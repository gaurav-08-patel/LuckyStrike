import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { AuthModal } from '../../components/AuthModal';
import { OfflineBanner, OfflineState } from '../../components/OfflineState';
import { toast } from '../../components/Toast';
import { useAuth } from '../../context/AuthContext';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

const getApiBaseUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) return envUrl.replace(/\/$/, '');

  const hostUri =
    Constants.expoConfig?.hostUri ??
    Constants.expoGoConfig?.hostUri ??
    Constants.manifest2?.extra?.expoGo?.debuggerHost ??
    Constants.manifest?.debuggerHost;

  if (hostUri) {
    const host = hostUri.split(':')[0];
    if (host && host !== 'localhost') return `http://${host}:5000`;
  }

  if (Platform.OS === 'android') return 'http://10.0.2.2:5000';
  return 'http://localhost:5000';
};

const API_BASE_URL = getApiBaseUrl();

type CampaignDetail = {
  id: string;
  title: string;
  subtitle: string;
  prize: string;
  drawCode: string;
  image: string;
  campaignType: 'daily' | 'weekly' | 'monthly';
  drawDate: string | null;
  lastRegistration: string | null;
  currency: string;
  status: string;
  entryFrom: number;
  maxTickets: number;
  ticketsSold: number;
  remainingTickets: number;
  ticketPrice: number;
  prizeTitle: string;
};

const resolveImageUri = (value: unknown) => {
  const fallback = 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=900&q=80';
  if (typeof value !== 'string' || !value.trim()) return fallback;

  const normalized = value.trim();
  if (/^https?:\/\//i.test(normalized) || /^data:/i.test(normalized)) return normalized;
  if (normalized.startsWith('/')) return `${API_BASE_URL}${normalized}`;
  return normalized;
};

const formatPrizeText = (prizeTitle: unknown, prizeAmount: number) => {
  const value = String(prizeTitle ?? '').trim().toLowerCase();

  if (!value) return `INR ${new Intl.NumberFormat('en-IN').format(prizeAmount || 0)}`;
  if (value.includes('car')) return 'Car prize';
  if (value.includes('electronics') || value.includes('phone') || value.includes('laptop') || value.includes('watch') || value.includes('device')) {
    return 'Electronics prize';
  }

  return `INR ${new Intl.NumberFormat('en-IN').format(prizeAmount || 0)}`;
};

const formatCurrency = (value: number, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);

const formatCountdown = (expiresAt: string | null, now: Date) => {
  if (!expiresAt) return 'Open';
  const deadline = new Date(expiresAt);
  const diff = Math.max(deadline.getTime() - now.getTime(), 0);

  if (diff <= 0) return 'Closed';

  const totalSeconds = Math.floor(diff / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds].map((part) => String(part).padStart(2, '0')).join(':');
};

const formatDrawDate = (value: string | null) => {
  if (!value) return 'TBA';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const normalizeCampaignData = (raw: Record<string, unknown>): CampaignDetail => {
  const drawType = String(raw.draw_type ?? 'daily').trim().toLowerCase();
  const prizeTitle = String(raw.prize_title ?? '');
  const prizeAmount = Number(raw.prize_amount ?? 0);
  const ticketPrice = Number(raw.ticket_price ?? 0);
  const maxTickets = Number(raw.max_tickets ?? 0);
  const ticketsSold = Number(raw.tickets_sold ?? 0);
  const remainingTickets = Math.max(maxTickets - ticketsSold, 0);

  return {
    id: String(raw.id ?? ''),
    title: String(raw.title ?? 'Lucky Strike draw'),
    subtitle: drawType === 'weekly' ? 'Weekly draw' : drawType === 'monthly' ? 'Monthly draw' : 'Daily draw',
    prize: formatPrizeText(prizeTitle, prizeAmount),
    drawCode: String(raw.draw_code ?? raw.id ?? 'N/A'),
    image: resolveImageUri(raw.image),
    campaignType: drawType === 'weekly' ? 'weekly' : drawType === 'monthly' ? 'monthly' : 'daily',
    drawDate: raw.draw_at ? String(raw.draw_at) : null,
    lastRegistration: raw.expires_at ? String(raw.expires_at) : null,
    currency: 'INR',
    status: String(raw.status ?? 'active'),
    entryFrom: Number.isFinite(ticketPrice) ? ticketPrice : 0,
    maxTickets: Number.isFinite(maxTickets) ? maxTickets : 0,
    ticketsSold: Number.isFinite(ticketsSold) ? ticketsSold : 0,
    remainingTickets,
    ticketPrice: Number.isFinite(ticketPrice) ? ticketPrice : 0,
    prizeTitle,
  };
};

export default function CampaignDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isLoggedIn, isAuthReady, user, setUser } = useAuth();
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [now, setNow] = useState(() => new Date());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isConfirmPurchaseOpen, setIsConfirmPurchaseOpen] = useState(false);
  const [ticketQuantity, setTicketQuantity] = useState(1);
  const [isBuying, setIsBuying] = useState(false);
  const [purchaseError, setPurchaseError] = useState('');
  const { isOffline } = useNetworkStatus(true);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!id) {
      setCampaign(null);
      setIsLoading(false);
      return;
    }

    const loadCampaign = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/draws/${encodeURIComponent(String(id))}`);

        if (!response.ok) {
          throw new Error('Draw not found');
        }

        const data = (await response.json()) as Record<string, unknown>;
        setCampaign(normalizeCampaignData(data));
      } catch (error) {
        console.warn('Campaign failed to load:', error);
        setCampaign(null);
      } finally {
        setIsLoading(false);
      }
    };

    void loadCampaign();
  }, [id]);

  const deadline = useMemo(() => {
    if (!campaign) return new Date(Date.now() + 86400000);
    const raw = campaign.lastRegistration || campaign.drawDate || new Date(Date.now() + 86400000).toISOString();
    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? new Date(Date.now() + 86400000) : parsed;
  }, [campaign]);

  const remainingMs = deadline.getTime() - now.getTime();
  const isExpired = remainingMs <= 0;
  const countdownLabel = formatCountdown(campaign?.lastRegistration ?? null, now);
  const walletBalance = Number(user?.walletBalance ?? 0);
  const pendingWithdrawalAmount = Number(user?.pendingWithdrawalAmount ?? 0);
  const availableBalance = Math.max(walletBalance - pendingWithdrawalAmount, 0);
  const totalCost = Number(campaign?.ticketPrice ?? 0) * ticketQuantity;

  const resetPurchaseModal = () => {
    setIsPurchaseModalOpen(false);
    setTicketQuantity(1);
    setPurchaseError('');
  };

  const askForPurchaseConfirmation = () => {
    if (!campaign) return;
    setIsConfirmPurchaseOpen(true);
  };

  const handleOpenPurchase = () => {
    if (!isAuthReady) return;
    if (isOffline) {
      toast.error('Offline mode', 'Connect to the internet to buy tickets.');
      return;
    }
    if (!isLoggedIn) {
      setIsAuthModalOpen(true);
      return;
    }

    if (!campaign) return;
    if (campaign.status !== 'active') {
      toast.error('Ticket purchase unavailable', 'This draw is not currently active.');
      return;
    }

    setPurchaseError('');
    setTicketQuantity(1);
    setIsPurchaseModalOpen(true);
  };

  const handleBuyTickets = async () => {
    if (!campaign || !id) {
      toast.error('Purchase failed', 'Campaign details are unavailable.');
      return;
    }

    if (isOffline) {
      toast.error('Offline mode', 'Connect to the internet before buying tickets.');
      return;
    }

    if (!isLoggedIn) {
      setIsAuthModalOpen(true);
      return;
    }

    if (!Number.isInteger(ticketQuantity) || ticketQuantity <= 0) {
      setPurchaseError('Please select at least 1 ticket.');
      return;
    }

    if (availableBalance < totalCost) {
      setPurchaseError(`You need ${formatCurrency(totalCost, campaign.currency)} available in your wallet to continue.`);
      return;
    }

    try {
      setIsBuying(true);
      setPurchaseError('');

      const token = await AsyncStorage.getItem('luckyStrikeToken');
      if (!token) {
        setIsAuthModalOpen(true);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/draws/${encodeURIComponent(String(campaign.id))}/buy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ quantity: ticketQuantity }),
      });

      const data = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        throw new Error(data.message || 'Ticket purchase failed.');
      }

      const nextWalletBalance = Math.max(0, Number(user?.walletBalance ?? 0) - totalCost);
      await setUser({ ...(user ?? {}), walletBalance: nextWalletBalance }, token);

      setCampaign((current) => {
        if (!current) return current;
        return {
          ...current,
          ticketsSold: current.ticketsSold + ticketQuantity,
          remainingTickets: Math.max(current.remainingTickets - ticketQuantity, 0),
        };
      });

      toast.success(
        'Tickets bought',
        `You bought ${ticketQuantity} ticket${ticketQuantity > 1 ? 's' : ''} successfully.`,
      );
      resetPurchaseModal();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Something went wrong while buying tickets.';
      setPurchaseError(message);
      toast.error('Purchase failed', message);
    } finally {
      setIsBuying(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.screen}>
        {isOffline ? <OfflineBanner label='Offline mode' /> : null}
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name='arrow-back' size={22} color='#171310' />
            </TouchableOpacity>
            <View style={styles.skeletonBadge} />
          </View>

          {isOffline ? (
            <OfflineState
              title='Campaign unavailable'
              message='The draw details are offline right now. Connect to the internet to load the latest campaign info.'
              onRetry={() => {
                if (id) {
                  void fetch(`${API_BASE_URL}/api/draws/${encodeURIComponent(String(id))}`);
                }
              }}
            />
          ) : (
            <>
              <View style={styles.skeletonHeroCard}>
                <View style={styles.skeletonHeroImage} />
                <View style={styles.skeletonHeroContent}>
                  <View style={styles.skeletonLineTiny} />
                  <View style={styles.skeletonLineLarge} />
                  <View style={styles.skeletonLineMedium} />
                </View>
              </View>

              <View style={styles.metaGrid}>
                {Array.from({ length: 4 }).map((_, index) => (
                  <View key={index} style={styles.skeletonMetaCard}>
                    <View style={styles.skeletonLineTiny} />
                    <View style={styles.skeletonLineShort} />
                  </View>
                ))}
              </View>

              <View style={styles.skeletonStatusRow}>
                <View style={styles.skeletonStatusPill} />
                <View style={styles.skeletonLineSmall} />
              </View>

              <View style={styles.skeletonSummaryCard}>
                <View style={styles.skeletonLineTiny} />
                <View style={styles.skeletonLineLong} />
                <View style={styles.skeletonLineMedium} />
                <View style={styles.skeletonLineMedium} />
                <View style={styles.skeletonLineMedium} />
              </View>

              <View style={styles.skeletonPrimaryButton} />
            </>
          )}
        </ScrollView>
      </View>
    );
  }

  if (!campaign) {
    return (
      <View style={styles.loadingScreen}>
        {isOffline ? <OfflineBanner label='Offline mode' /> : null}
        <Text style={styles.eyebrow}>LuckyStrike</Text>
        <Text style={styles.loadingText}>{isOffline ? 'Campaign unavailable offline.' : 'Draw not found.'}</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/campaigns')}>
          <Text style={styles.primaryButtonText}>{isOffline ? 'Back to campaigns' : 'Back to campaigns'}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {isOffline ? <OfflineBanner label='Offline mode' /> : null}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name='arrow-back' size={22} color='#171310' />
          </TouchableOpacity>

          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{campaign.subtitle.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.heroCard}>
          <Image source={{ uri: campaign.image }} style={styles.heroImage} resizeMode='cover' />

          <View style={styles.heroContent}>
            <Text style={styles.eyebrow}>Draw code {campaign.drawCode}</Text>
            <Text style={styles.title}>{campaign.title}</Text>
            <Text style={styles.prizeLine}>Win {campaign.prize}</Text>
          </View>
        </View>

        <View style={styles.metaGrid}>
          <View style={styles.metaCard}>
            <Text style={styles.metaLabel}>Entry from</Text>
            <Text style={styles.metaValue}>{formatCurrency(campaign.entryFrom, campaign.currency)}</Text>
          </View>
          <View style={styles.metaCard}>
            <Text style={styles.metaLabel}>Tickets left</Text>
            <Text style={styles.metaValue}>{campaign.remainingTickets}</Text>
          </View>
          <View style={styles.metaCard}>
            <Text style={styles.metaLabel}>Draw starts</Text>
            <Text style={styles.metaValue}>{formatDrawDate(campaign.drawDate)}</Text>
          </View>
          <View style={styles.metaCard}>
            <Text style={styles.metaLabel}>Window closes</Text>
            <Text style={styles.metaValue}>{formatDrawDate(campaign.lastRegistration)}</Text>
          </View>
        </View>

        <View style={styles.statusRow}>
          <View style={[styles.statusChip, isExpired ? styles.statusChipClosed : styles.statusChipOpen]}>
            <Text style={[styles.statusChipText, !isExpired && styles.statusChipTextOpen]}>{isExpired ? 'Closed' : countdownLabel}</Text>
          </View>
          <Text style={styles.smallLabel}>{campaign.ticketsSold} tickets sold</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>Prize details</Text>
          <Text style={styles.summaryText}>This draw features {campaign.prizeTitle || 'Lucky Strike prize'} and closes at {formatDrawDate(campaign.lastRegistration)}.</Text>

          <View style={styles.summaryRows}> 
            <View style={styles.summaryRow}>
              <Text style={styles.summaryRowLabel}>Ticket price</Text>
              <Text style={styles.summaryRowValue}>{formatCurrency(campaign.entryFrom, campaign.currency)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryRowLabel}>Eligible for draw</Text>
              <Text style={styles.summaryRowValue}>{campaign.status === 'active' ? 'Open' : 'Unavailable'}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryRowLabel}>Wallet balance</Text>
              <Text style={styles.summaryRowValue}>{formatCurrency(availableBalance, campaign.currency)}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, isOffline && styles.primaryButtonDisabled]}
          onPress={handleOpenPurchase}
          disabled={isExpired || campaign.status !== 'active' || isOffline}
        >
          <Text style={styles.primaryButtonText}>{isOffline ? 'Offline' : isExpired || campaign.status !== 'active' ? 'Draw closed' : 'Buy tickets'}</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={isPurchaseModalOpen} transparent animationType='fade' onRequestClose={resetPurchaseModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Buy tickets</Text>
            <Text style={styles.modalSubtitle}>{campaign.title}</Text>

            <View style={styles.quantityRow}>
              <TouchableOpacity style={styles.stepButton} onPress={() => setTicketQuantity((current) => Math.max(1, current - 1))}>
                <Text style={styles.stepButtonText}>−</Text>
              </TouchableOpacity>

              <TextInput
                value={String(ticketQuantity)}
                keyboardType='number-pad'
                onChangeText={(value) => {
                  const nextValue = Number(value.replace(/\D/g, '')) || 0;
                  setTicketQuantity(Math.max(1, nextValue));
                }}
                style={styles.quantityInput}
                textAlign='center'
              />

              <TouchableOpacity style={styles.stepButton} onPress={() => setTicketQuantity((current) => current + 1)}>
                <Text style={styles.stepButtonText}>＋</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.summaryRows}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryRowLabel}>Unit price</Text>
                <Text style={styles.summaryRowValue}>{formatCurrency(campaign.entryFrom, campaign.currency)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryRowLabel}>Total</Text>
                <Text style={styles.summaryRowValue}>{formatCurrency(totalCost, campaign.currency)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryRowLabel}>Available</Text>
                <Text style={styles.summaryRowValue}>{formatCurrency(availableBalance, campaign.currency)}</Text>
              </View>
            </View>

            {purchaseError ? <Text style={styles.errorText}>{purchaseError}</Text> : null}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.secondaryButton} onPress={resetPurchaseModal}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.primaryButtonSmall} onPress={askForPurchaseConfirmation} disabled={isBuying}>
                <Text style={[styles.primaryButtonText, styles.primaryButtonTextCentered]}>{isBuying ? 'Buying...' : 'Confirm purchase'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={isConfirmPurchaseOpen} transparent animationType='fade' onRequestClose={() => setIsConfirmPurchaseOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Confirm purchase</Text>
            <Text style={styles.modalSubtitle}>
              {`You are buying ${ticketQuantity} ticket${ticketQuantity > 1 ? 's' : ''} for ${formatCurrency(totalCost, campaign.currency)}.`}
            </Text>
            <Text style={styles.modalSubtitle}>Do you want to continue?</Text>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => setIsConfirmPurchaseOpen(false)}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.primaryButtonSmall}
                onPress={() => {
                  setIsConfirmPurchaseOpen(false);
                  void handleBuyTickets();
                }}
                disabled={isBuying}
              >
                <Text style={[styles.primaryButtonText, styles.primaryButtonTextCentered]}>{isBuying ? 'Buying...' : 'Confirm'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} redirectAfterLogin={id ? `/campaign/${id}` : '/campaigns'} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fffaf6',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 32,
  },
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fffaf6',
    paddingHorizontal: 24,
  },
  skeletonBadge: {
    width: 120,
    height: 42,
    borderWidth: 3,
    borderColor: '#171310',
    backgroundColor: '#efe6dc',
    shadowColor: '#171310',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  skeletonHeroCard: {
    borderWidth: 3,
    borderColor: '#171310',
    backgroundColor: '#fff',
    shadowColor: '#171310',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
    overflow: 'hidden',
  },
  skeletonHeroImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#efe8e2',
  },
  skeletonHeroContent: {
    backgroundColor: '#fffaf1',
    paddingHorizontal: 16,
    paddingVertical: 18,
    gap: 10,
  },
  skeletonLineTiny: {
    width: '25%',
    height: 12,
    backgroundColor: '#e7ddd4',
  },
  skeletonLineSmall: {
    width: '18%',
    height: 18,
    backgroundColor: '#e7ddd4',
  },
  skeletonLineShort: {
    width: '45%',
    height: 16,
    backgroundColor: '#e7ddd4',
  },
  skeletonLineMedium: {
    width: '65%',
    height: 18,
    backgroundColor: '#e7ddd4',
  },
  skeletonLineLarge: {
    width: '80%',
    height: 28,
    backgroundColor: '#e7ddd4',
  },
  skeletonLineLong: {
    width: '90%',
    height: 18,
    backgroundColor: '#e7ddd4',
  },
  skeletonMetaCard: {
    width: '48%',
    borderWidth: 3,
    borderColor: '#171310',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 14,
    gap: 8,
    shadowColor: '#171310',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  skeletonStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
  },
  skeletonStatusPill: {
    width: 120,
    height: 40,
    backgroundColor: '#e7ddd4',
    borderWidth: 3,
    borderColor: '#171310',
  },
  skeletonSummaryCard: {
    marginTop: 18,
    borderWidth: 3,
    borderColor: '#171310',
    backgroundColor: '#fff',
    padding: 16,
    gap: 10,
    shadowColor: '#171310',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  skeletonPrimaryButton: {
    marginTop: 18,
    height: 52,
    borderWidth: 3,
    borderColor: '#171310',
    backgroundColor: '#e7ddd4',
    shadowColor: '#171310',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: '#ff2d78',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 22,
    fontWeight: '900',
    color: '#171310',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderWidth: 3,
    borderColor: '#171310',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#171310',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  backButtonText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#171310',
  },
  headerBadge: {
    borderWidth: 3,
    borderColor: '#171310',
    backgroundColor: '#f9d849',
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#171310',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  headerBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.6,
    color: '#171310',
  },
  heroCard: {
    borderWidth: 3,
    borderColor: '#171310',
    backgroundColor: '#fff',
    shadowColor: '#171310',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#f4efe9',
  },
  heroContent: {
    padding: 16,
    backgroundColor: '#fffaf1',
  },
  title: {
    marginTop: 8,
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 32,
    color: '#171310',
    textTransform: 'uppercase',
  },
  prizeLine: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: '800',
    color: '#ff2d78',
  },
  metaGrid: {
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  metaCard: {
    width: '48%',
    borderWidth: 2,
    borderColor: '#171310',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 14,
    minHeight: 82,
  },
  metaLabel: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: '#5d5856',
  },
  metaValue: {
    marginTop: 10,
    fontSize: 17,
    fontWeight: '900',
    color: '#171310',
  },
  statusRow: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: '#171310',
  },
  statusChipOpen: {
    backgroundColor: '#1f7a4f',
  },
  statusChipClosed: {
    backgroundColor: '#f6d9d7',
  },
  statusChipText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: '#171310',
  },
  statusChipTextOpen: {
    color: '#fff',
  },
  smallLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5d5856',
  },
  summaryCard: {
    marginTop: 18,
    borderWidth: 3,
    borderColor: '#171310',
    backgroundColor: '#fff',
    padding: 16,
    shadowColor: '#171310',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: '#171310',
  },
  summaryText: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 20,
    color: '#3d3937',
  },
  summaryRows: {
    marginTop: 14,
    gap: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e8dfd8',
  },
  summaryRowLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5d5856',
  },
  summaryRowValue: {
    fontSize: 12,
    fontWeight: '900',
    color: '#171310',
  },
  primaryButton: {
    marginTop: 20,
    borderWidth: 3,
    borderColor: '#171310',
    backgroundColor: '#ff3b30',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#171310',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  primaryButtonDisabled: {
    backgroundColor: '#8e8180',
    opacity: 0.9,
  },
  primaryButtonSmall: {
    flex: 1,
    borderWidth: 3,
    borderColor: '#171310',
    backgroundColor: '#ff3b30',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#171310',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: '#fff',
    textAlign: 'center',
  },
  primaryButtonTextCentered: {
    textAlign: 'center',
    alignSelf: 'center',
    width: '100%',
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 3,
    borderColor: '#171310',
    backgroundColor: '#fff',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#171310',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  secondaryButtonText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: '#171310',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(23, 19, 16, 0.55)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#fffaf6',
    borderWidth: 3,
    borderColor: '#171310',
    padding: 18,
    shadowColor: '#171310',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '900',
    textTransform: 'uppercase',
    color: '#171310',
  },
  modalSubtitle: {
    marginTop: 8,
    fontSize: 14,
    color: '#5d5856',
  },
  quantityRow: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  stepButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#171310',
    backgroundColor: '#f9d849',
  },
  stepButtonText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#171310',
  },
  quantityInput: {
    width: 92,
    height: 48,
    borderWidth: 3,
    borderColor: '#171310',
    backgroundColor: '#fff',
    fontSize: 22,
    fontWeight: '900',
    color: '#171310',
  },
  modalActions: {
    marginTop: 18,
    flexDirection: 'row',
    gap: 12,
  },
  errorText: {
    marginTop: 12,
    fontSize: 12,
    fontWeight: '700',
    color: '#db3a2d',
  },
});

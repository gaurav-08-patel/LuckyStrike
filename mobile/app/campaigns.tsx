import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { OfflineBanner, OfflineState } from '../components/OfflineState';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

const CAMPAIGNS_CACHE_KEY = 'lucky-strike-campaigns-page';

const readCachedCampaigns = async (): Promise<Campaign[]> => {
  try {
    const raw = await AsyncStorage.getItem(CAMPAIGNS_CACHE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as Array<Record<string, unknown>>;
    return Array.isArray(parsed) ? parsed.map((campaign) => normalizeCampaign(campaign)) : [];
  } catch (error) {
    console.warn('Failed to read cached campaigns page data:', error);
    return [];
  }
};

const saveCachedCampaigns = async (campaigns: Campaign[]) => {
  try {
    await AsyncStorage.setItem(CAMPAIGNS_CACHE_KEY, JSON.stringify(campaigns));
  } catch (error) {
    console.warn('Failed to save campaigns page cache:', error);
  }
};

const tabs = ['All campaigns', 'Daily', 'Weekly', 'Monthly'] as const;
type TabName = (typeof tabs)[number];

type Campaign = {
  id: string;
  title: string;
  subtitle: string;
  prize: string;
  entryFrom: number;
  status: string;
  image: string;
  drawCode: string;
  campaignType: 'daily' | 'weekly' | 'monthly';
  drawDate?: string;
  lastRegistration?: string | null;
  currency?: string;
};

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
  if (
    value.includes('electronics') ||
    value.includes('phone') ||
    value.includes('laptop') ||
    value.includes('watch') ||
    value.includes('device')
  ) {
    return 'Electronics prize';
  }

  return `INR ${new Intl.NumberFormat('en-IN').format(prizeAmount || 0)}`;
};

const formatCountdown = (deadline: Date, now: Date) => {
  const leftMs = Math.max(deadline.getTime() - now.getTime(), 0);
  if (leftMs <= 0) return '00:00:00';
  const totalSeconds = Math.floor(leftMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':');
};

const formatDrawDateTime = (value?: string) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);
};

const normalizeCampaign = (raw: Record<string, unknown>): Campaign => {
  const drawType = String(raw.draw_type ?? 'daily').trim().toLowerCase();
  const prizeTitle = String(raw.prize_title ?? '');
  const prizeAmount = Number(raw.prize_amount ?? 0);
  const ticketPrice = Number(raw.ticket_price ?? 0);

  return {
    id: String(raw.id ?? ''),
    title: String(raw.title ?? 'Untitled draw'),
    subtitle: drawType === 'weekly' ? 'Weekly draw' : drawType === 'monthly' ? 'Monthly draw' : 'Daily draw',
    prize: formatPrizeText(prizeTitle, prizeAmount),
    entryFrom: Number.isFinite(ticketPrice) ? ticketPrice : 0,
    status: String(raw.status ?? 'active'),
    image: resolveImageUri(raw.image),
    drawCode: String(raw.draw_code ?? raw.id ?? 'N/A'),
    campaignType: drawType === 'weekly' ? 'weekly' : drawType === 'monthly' ? 'monthly' : 'daily',
    drawDate: raw.draw_at ? String(raw.draw_at) : undefined,
    lastRegistration: raw.expires_at ? String(raw.expires_at) : null,
    currency: 'INR',
  };
};

const getCampaignDeadline = (campaign: Campaign) => {
  const rawDeadline = campaign.lastRegistration || campaign.drawDate || new Date(Date.now() + 86400000).toISOString();
  const date = new Date(rawDeadline);
  return Number.isNaN(date.getTime()) ? new Date(Date.now() + 86400000) : date;
};

export default function CampaignsScreen() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [activeTab, setActiveTab] = useState<TabName>('All campaigns');
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [now, setNow] = useState(() => new Date());
  const [pressedCardId, setPressedCardId] = useState<string | null>(null);
  const { isOffline } = useNetworkStatus(true);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadCampaigns = async (nextOffset: number, append: boolean) => {
    const tabValue = activeTab === 'All campaigns' ? 'all' : activeTab.toLowerCase();
    const limit = 5;

    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setIsLoading(true);
      }

      const cachedCampaigns = await readCachedCampaigns();
      if (cachedCampaigns.length > 0 && !append) {
        setCampaigns(cachedCampaigns);
      }

      if (isOffline) {
        setHasMore(false);
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/draws?limit=${limit}&offset=${nextOffset}${tabValue === 'all' ? '' : `&drawType=${tabValue}`}`,
      );

      if (!response.ok) {
        if (cachedCampaigns.length > 0) {
          setCampaigns(cachedCampaigns);
        }
        setHasMore(false);
        return;
      }

      const payload = (await response.json()) as {
        draws?: Array<Record<string, unknown>>;
        hasMore?: boolean;
      };

      const draws = Array.isArray(payload?.draws) ? payload.draws : [];
      const normalized = draws.map((draw) => normalizeCampaign(draw as Record<string, unknown>));
      setCampaigns((current) => (append ? [...current, ...normalized] : normalized));
      setHasMore(Boolean(payload?.hasMore));
      setOffset(nextOffset + normalized.length);
      if (normalized.length > 0) {
        await saveCachedCampaigns(normalized);
      }
    } catch (error) {
      console.warn('Failed to load campaigns:', error);
      const cachedCampaigns = await readCachedCampaigns();
      if (cachedCampaigns.length > 0) {
        setCampaigns(cachedCampaigns);
      } else {
        setCampaigns([]);
      }
      setHasMore(false);
    } finally {
      setIsLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    void loadCampaigns(0, false);
  }, [activeTab]);

  const handleShowMore = () => {
    if (isOffline || !hasMore || loadingMore) return;
    void loadCampaigns(offset, true);
  };

  const visibleCampaigns = useMemo(() => {
    const filtered = campaigns.filter((campaign) => {
      if (activeTab === 'All campaigns') return true;
      return campaign.subtitle.toLowerCase().includes(activeTab.toLowerCase());
    });

    return filtered;
  }, [campaigns, activeTab]);

  return (
    <View style={styles.screen}>
      {isOffline ? <OfflineBanner label='Offline mode' /> : null}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name='arrow-back' size={22} color='#171310' />
          </TouchableOpacity>
          <Text style={styles.heading}>Campaigns</Text>
        </View>

        <View style={styles.tabArea}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.tabRow}>
              {tabs.map((tab) => {
                const selected = tab === activeTab;
                return (
                  <TouchableOpacity
                    key={tab}
                    style={[styles.tabButton, selected && styles.tabButtonActive]}
                    onPress={() => setActiveTab(tab)}
                  >
                    <Text style={[styles.tabText, selected && styles.tabTextActive]}>{tab}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {isLoading ? (
          <View style={styles.list}>
            {Array.from({ length: 3 }).map((_, index) => (
              <View key={index} style={styles.skeletonCard}>
                <View style={styles.skeletonHeader} />
                <View style={styles.skeletonImage} />
                <View style={styles.skeletonBody}>
                  <View style={styles.skeletonLineShort} />
                  <View style={styles.skeletonLineLong} />
                  <View style={styles.skeletonLineMedium} />
                </View>
              </View>
            ))}
          </View>
        ) : visibleCampaigns.length === 0 ? (
          isOffline ? (
            <OfflineState
              title='No campaigns available'
              message='You are offline, so fresh campaign data is unavailable right now.'
              onRetry={() => void loadCampaigns(0, false)}
            />
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No campaigns available</Text>
              <Text style={styles.emptyText}>There are no draws in this category right now. Please check back soon.</Text>
            </View>
          )
        ) : (
          <View style={styles.list}>
            {visibleCampaigns.map((campaign) => {
              const deadline = getCampaignDeadline(campaign);
              const remainingMs = deadline.getTime() - now.getTime();
              const isExpired = remainingMs <= 0;
              const dayMs = 24 * 60 * 60 * 1000;
              const showCountdown = !isExpired && remainingMs <= 2 * dayMs;
              const isJustLaunched = !isExpired && remainingMs > 2 * dayMs && remainingMs <= 7 * dayMs;

              const productTone = isOffline
                ? styles.statusCached
                : isExpired
                  ? styles.statusClosed
                  : showCountdown
                    ? styles.statusClosing
                    : styles.statusOpen;
 
              let badgeLabel = isOffline ? 'Cached data' : 'Registration open';
              if (!isOffline && isExpired) badgeLabel = 'Closed';
              else if (!isOffline && showCountdown) badgeLabel = 'Offline';
              else if (!isOffline && isJustLaunched) badgeLabel = 'Just launched';

              const isPressed = pressedCardId === campaign.id;

              return (
                <TouchableOpacity
                  key={campaign.id}
                  style={[styles.cardShell, isPressed && styles.cardShellPressed]}
                  activeOpacity={1}
                  pressRetentionOffset={{ top: 10, left: 10, right: 10, bottom: 10 }}
                  onPress={() => router.push(`/campaign/${campaign.id}`)}
                  onPressIn={() => setPressedCardId(campaign.id)}
                  onPressOut={() => setPressedCardId(null)}
                >
                  <View style={[styles.registrationPill, productTone]}>
                    {isOffline ? (
                      <Text style={[styles.registrationPillText, styles.registrationPillTextClosed]}>{badgeLabel}</Text>
                    ) : showCountdown ? (
                      <>
                        <Text style={styles.registrationPillLabel}>{badgeLabel}</Text>
                        <Text style={styles.registrationPillTime}>{formatCountdown(deadline, now)}</Text>
                      </>
                    ) : (
                      <Text style={[styles.registrationPillText, isExpired && styles.registrationPillTextClosed]}>{badgeLabel}</Text>
                    )}
                  </View>

                  <View style={styles.card}>
                    <View style={styles.mediaWrap}>
                      <Image
                        source={{ uri: campaign.image || 'https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=900&q=80' }}
                        style={styles.image}
                        resizeMode='cover'
                      />
                    </View>

                    <View style={styles.body}>
                      <Text style={styles.winText}>Win <Text style={styles.prizeText}>{campaign.prize}</Text></Text>
                      <Text style={styles.offerText}>{campaign.title.toUpperCase()}</Text>

                      <View style={styles.entryButton}>
                        <Text style={styles.entryButtonText}>Entry from {campaign.entryFrom}</Text>
                      </View>

                      <View style={styles.metaRow}>
                        <Text style={styles.metaText}>Draw date: {formatDrawDateTime(campaign.drawDate)} or earlier</Text>
                        <Text style={styles.drawCode}>DRAW CODE: {campaign.drawCode}</Text>
                      </View>

                      <View style={styles.footerRow}>
                        <Text style={styles.footerLeft}>{isExpired ? 'Closed' : 'Open registration'}</Text>
                        <Text style={styles.footerRight}>{campaign.currency || 'INR'}</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}

            {hasMore && !isLoading && !isOffline && (
              <TouchableOpacity
                style={[styles.showMoreButton, loadingMore && styles.showMoreButtonDisabled]}
                onPress={handleShowMore}
                disabled={loadingMore}
              >
                <Text style={styles.showMoreButtonText}>{loadingMore ? 'Loading...' : 'Show more'}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
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
    paddingTop: 16,
    paddingBottom: 32,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
  },
  backButton: {
    width: 42,
    height: 42,
    borderWidth: 3,
    borderColor: '#171310',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#171310',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  backButtonText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#171310',
  },
  heading: {
    fontSize: 28,
    fontWeight: '900',
    color: '#171310',
    textTransform: 'uppercase',
  },
  tabArea: {
    marginBottom: 18,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tabButton: {
    borderWidth: 3,
    borderColor: '#171310',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 9,
    shadowColor: '#171310',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  tabButtonActive: {
    backgroundColor: '#ff3b30',
  },
  tabText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: '#171310',
  },
  tabTextActive: {
    color: '#fff',
  },
  list: {
    gap: 16,
  },
  cardShell: {
    borderWidth: 3,
    borderColor: '#171310',
    backgroundColor: '#fff',
    shadowColor: '#171310',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  },
  cardShellPressed: {
    transform: [{ translateY: 1 }],
  },
  registrationPill: {
    borderBottomWidth: 3,
    borderBottomColor: '#171310',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  statusOpen: {
    backgroundColor: '#1f7a4f',
  },
  statusClosing: {
    backgroundColor: '#b78000',
  },
  statusClosed: {
    backgroundColor: '#171310',
  },
  statusCached: {
    backgroundColor: '#5d5856',
  },
  registrationPillLabel: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: '#fff',
  },
  registrationPillText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: '#fff',
  },
  registrationPillTextClosed: {
    color: '#fff',
  },
  registrationPillTime: {
    marginTop: 3,
    fontSize: 16,
    fontWeight: '900',
    color: '#fff',
  },
  card: {
    flexDirection: 'column',
  },
  mediaWrap: {
    width: '100%',
  },
  image: {
    width: '100%',
    height: 180,
    backgroundColor: '#efebe8',
  },
  body: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
  },
  winText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#171310',
  },
  prizeText: {
    color: '#ff2d78',
  },
  offerText: {
    marginTop: 8,
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 24,
    textTransform: 'uppercase',
    color: '#171310',
  },
  entryButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
    borderWidth: 3,
    borderColor: '#171310',
    backgroundColor: '#ffd400',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  entryButtonText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: '#171310',
  },
  metaRow: {
    marginTop: 12,
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: '#5d5856',
    fontWeight: '700',
  },
  drawCode: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: '#171310',
  },
  footerRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e8dfd8',
  },
  footerLeft: {
    fontSize: 11,
    fontWeight: '800',
    color: '#171310',
  },
  footerRight: {
    fontSize: 11,
    fontWeight: '900',
    color: '#ff2d78',
  },
  showMoreButton: {
    marginTop: 8,
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
    elevation: 6,
  },
  showMoreButtonDisabled: {
    opacity: 0.7,
  },
  showMoreButtonText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: '#fff',
  },
  skeletonCard: {
    borderWidth: 3,
    borderColor: '#171310',
    backgroundColor: '#fff',
    shadowColor: '#171310',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
    overflow: 'hidden',
  },
  skeletonHeader: {
    height: 46,
    backgroundColor: '#eae2db',
    borderBottomWidth: 3,
    borderBottomColor: '#171310',
  },
  skeletonImage: {
    height: 180,
    backgroundColor: '#efe8e2',
  },
  skeletonBody: {
    paddingHorizontal: 14,
    paddingVertical: 16,
    gap: 10,
  },
  skeletonLineShort: {
    width: '30%',
    height: 16,
    backgroundColor: '#e7dfd8',
  },
  skeletonLineLong: {
    width: '85%',
    height: 24,
    backgroundColor: '#e7dfd8',
  },
  skeletonLineMedium: {
    width: '60%',
    height: 18,
    backgroundColor: '#e7dfd8',
  },
  emptyCard: {
    marginTop: 18,
    borderWidth: 3,
    borderColor: '#171310',
    backgroundColor: '#fff',
    padding: 20,
    shadowColor: '#171310',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '900',
    textTransform: 'uppercase',
    color: '#171310',
  },
  emptyText: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 18,
    color: '#4b4745',
  },
});

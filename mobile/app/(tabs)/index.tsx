import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { CampaignsSection, type Campaign } from '../../components/CampaignsSection';
import { HeroSection, type HeroSlide } from '../../components/HeroSection';
import { HowItWorksSection } from '../../components/HowItWorksSection';
import { OfflineBanner, OfflineState } from '../../components/OfflineState';
import { SiteHeader } from '../../components/SiteHeader';
import { WinnersSection, type Winner } from '../../components/WinnersSection';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

const tabs = ['All campaigns', 'Daily', 'Weekly', 'Monthly'] as const;

const heroSlides: HeroSlide[] = [
  {
    src: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=900&q=80',
    alt: 'Lucky Strike prize poster',
    tag: 'Now live',
  },
  {
    src: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=900&q=80',
    alt: 'Lucky Strike prize posters',
    tag: 'New draw',
  },
];

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
    if (host && host !== 'localhost') {
      return `http://${host}:5000`;
    }
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000';
  }

  return 'http://localhost:5000';
};

const API_BASE_URL = getApiBaseUrl();
const CAMPAIGNS_CACHE_KEY = 'lucky-strike-home-campaigns';

const readCachedCampaigns = async (): Promise<Campaign[]> => {
  try {
    const raw = await AsyncStorage.getItem(CAMPAIGNS_CACHE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as Array<Record<string, unknown>>;
    return Array.isArray(parsed) ? parsed.map(normalizeCampaign) : [];
  } catch (error) {
    console.warn('Failed to read cached campaigns:', error);
    return [];
  }
};

const saveCachedCampaigns = async (campaigns: Campaign[]) => {
  try {
    await AsyncStorage.setItem(CAMPAIGNS_CACHE_KEY, JSON.stringify(campaigns));
  } catch (error) {
    console.warn('Failed to save cached campaigns:', error);
  }
};

const formatPrize = (campaign: any) => {
  const prizeAmount = Number(campaign.prize_amount ?? 0);
  const prizeType = String(campaign.prize_title ?? '').toLowerCase();

  if (prizeType.includes('car')) return 'Car prize';
  if (prizeType.includes('electronics') || prizeType.includes('phone') || prizeType.includes('laptop') || prizeType.includes('watch')) {
    return 'Electronics prize';
  }

  return `INR ${Number.isFinite(prizeAmount) ? prizeAmount.toLocaleString('en-IN') : '0'}`;
};

const formatCountdown = (expiresAt: string | null, now: Date) => {
  if (!expiresAt) return 'registration open';
  const deadline = new Date(expiresAt);
  const diff = Math.max(deadline.getTime() - now.getTime(), 0);

  if (diff <= 0) return 'Closed';

  const totalSeconds = Math.floor(diff / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds].map((v) => String(v).padStart(2, '0')).join(':');
};

const resolveImageUri = (imageValue: unknown) => {
  const fallbackImage = 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=900&q=80';

  if (typeof imageValue !== 'string' || !imageValue.trim()) return fallbackImage;

  const normalized = imageValue.trim();
  if (/^https?:\/\//i.test(normalized) || /^data:/i.test(normalized)) {
    return normalized;
  }

  if (normalized.startsWith('/')) {
    return `${API_BASE_URL}${normalized}`;
  }

  return normalized;
};

const normalizeCampaign = (raw: any): Campaign => {
  const drawType = String(raw.draw_type ?? 'daily').toLowerCase();
  const ticketPrice = Number(raw.ticket_price ?? 0);
  const title = String(raw.title ?? 'Untitled draw');
  const subtitle = drawType === 'weekly' ? 'Weekly draw' : drawType === 'monthly' ? 'Monthly draw' : 'Daily draw';
  const imageUri = resolveImageUri(raw.image);

  return {
    id: String(raw.id ?? ''),
    title,
    subtitle,
    prize: formatPrize(raw),
    entryFrom: Number.isFinite(ticketPrice) ? ticketPrice : 0,
    status: formatCountdown(raw.expires_at ?? raw.last_registration ?? null, new Date()),
    image: imageUri,
    drawCode: String(raw.draw_code ?? raw.id ?? 'N/A'),
    campaignType: drawType === 'weekly' ? 'weekly' : drawType === 'monthly' ? 'monthly' : 'daily',
    drawDate: String(raw.draw_at ?? raw.drawDate ?? ''),
    lastRegistration: raw.expires_at ? String(raw.expires_at) : raw.last_registration ? String(raw.last_registration) : null,
    currency: 'INR',
    entriesMultiplier: raw.entries_multiplier ? String(raw.entries_multiplier) : null,
  };
};

const normalizeWinner = (raw: any): Winner => ({
  id: String(raw.id ?? Math.random().toString()),
  name: String(raw.name ?? raw.winner_name ?? 'Lucky Winner'),
  prize: `INR ${Number(raw.cash ?? raw.prize_amount ?? 0).toLocaleString('en-IN')}`,
  badge: String(raw.drawType ?? raw.draw_type ?? raw.drawTitle ?? raw.draw_title ?? 'Winner'),
  image: String(raw.image ?? raw.image_url ?? ''),
  entryNo: String(raw.entry_no ?? raw.ticket_code ?? raw.draw_code ?? 'N/A'),
  announcedOn: raw.announced_on ? String(raw.announced_on) : raw.announced_at ? String(raw.announced_at) : undefined,
});

export default function HomeScreen() {
  const scrollRef = useRef<ScrollView | null>(null);
  const howItWorksYRef = useRef(0);
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>('All campaigns');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [showOfflineFallback, setShowOfflineFallback] = useState(false);
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(true);
  const { isOffline: offlineMode, isConnected } = useNetworkStatus(true);
  const effectiveOfflineState = offlineMode || showOfflineFallback;

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((current) => (current + 1) % heroSlides.length);
    }, 4200);

    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    setIsLoadingCampaigns(true);

    try {
      const cachedCampaigns = await readCachedCampaigns();
      if (cachedCampaigns.length > 0) {
        setCampaigns(cachedCampaigns);
      }

      if (offlineMode) {
        setShowOfflineFallback(true);
        return;
      }

      const [drawsRes, winnersRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/draws?limit=5&offset=0`),
        fetch(`${API_BASE_URL}/api/winners?limit=6`),
      ]);

      if (drawsRes.ok) {
        const drawsData = await drawsRes.json();
        const draws = Array.isArray(drawsData?.draws) ? drawsData.draws : [];
        const nextCampaigns = draws.map(normalizeCampaign);
        setCampaigns(nextCampaigns);
        await saveCachedCampaigns(nextCampaigns);
        setShowOfflineFallback(false);
      } else if (cachedCampaigns.length === 0) {
        setShowOfflineFallback(true);
      }

      if (winnersRes.ok) {
        const winnersData = await winnersRes.json();
        const winnersList = Array.isArray(winnersData)
          ? winnersData
          : Array.isArray(winnersData?.winners)
            ? winnersData.winners
            : [];
        setWinners(winnersList.slice(0, 12).map(normalizeWinner));
      }
    } catch (error) {
      console.warn('Failed to load Lucky Strike mobile home data', error);
      const cachedCampaigns = await readCachedCampaigns();
      if (cachedCampaigns.length > 0) {
        setCampaigns(cachedCampaigns);
      } else {
        setCampaigns([]);
      }
      setShowOfflineFallback(true);
    } finally {
      setIsLoadingCampaigns(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [isConnected]);

  const visibleCampaigns = useMemo(() => {
    return campaigns.filter((campaign) => {
      if (activeTab === 'All campaigns') return true;
      const tabKey = activeTab.toLowerCase();
      return campaign.subtitle.toLowerCase().includes(tabKey);
    });
  }, [campaigns, activeTab]);

  const handleScrollToHowItWorks = () => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({
      y: howItWorksYRef.current,
      animated: true,
    });
  };

  return (
    <View style={styles.screen}>
      {effectiveOfflineState ? <OfflineBanner label={offlineMode ? 'Offline mode' : 'Showing cached campaigns'} /> : null}

      <ScrollView ref={scrollRef} style={styles.screen} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <SiteHeader />
          <HeroSection
            slides={heroSlides}
            activeSlide={activeSlide}
            onChange={setActiveSlide}
            onPressHowItWorks={handleScrollToHowItWorks}
          />

          {showOfflineFallback && campaigns.length === 0 ? (
            <OfflineState
              title="No campaigns available"
              message="You’re offline or there are no live draws right now."
              onRetry={() => void loadData()}
            />
          ) : (
            <CampaignsSection
              campaigns={visibleCampaigns}
              tabs={[...tabs]}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              isOffline={effectiveOfflineState}
            />
          )}

          <HowItWorksSection onLayout={(event) => {
            howItWorksYRef.current = event.nativeEvent.layout.y;
          }} />
          <WinnersSection winners={winners} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fffaf6',
  },
  container: {
    paddingBottom: 40,
    backgroundColor: '#fffaf6',
  },
  offlineBanner: {
    backgroundColor: '#171310',
    borderBottomWidth: 3,
    borderBottomColor: '#171310',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  offlineText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: '#fff',
  },
  offlineCard: {
    marginHorizontal: 16,
    marginTop: 12,
    borderWidth: 3,
    borderColor: '#171310',
    backgroundColor: '#fff',
    padding: 18,
    shadowColor: '#171310',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  offlineCardTitle: {
    fontSize: 18,
    fontWeight: '900',
    textTransform: 'uppercase',
    color: '#171310',
  },
  offlineCardText: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 18,
    color: '#4e4a47',
  },
  retryButton: {
    marginTop: 16,
    alignSelf: 'flex-start',
    borderWidth: 3,
    borderColor: '#171310',
    backgroundColor: '#ff3b30',
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#171310',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  retryButtonText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: '#fff',
  },
});

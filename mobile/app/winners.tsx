import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000');

type WinnerItem = {
  id: string;
  name: string;
  prize: string;
  badge: string;
  image?: string;
  entryNo?: string;
  announcedOn?: string;
};

const normalizeWinner = (raw: any): WinnerItem => ({
  id: String(raw?.id ?? `${raw?.entry_no ?? 'winner'}-${Math.random()}`),
  name: String(raw?.name ?? raw?.winner_name ?? 'Lucky winner'),
  prize: `INR ${Number(raw?.cash ?? raw?.prize_amount ?? 0).toLocaleString('en-IN')}`,
  badge: String(raw?.drawType ?? raw?.draw_type ?? raw?.draw_title ?? raw?.drawTitle ?? 'Winner'),
  image: String(raw?.image ?? raw?.image_url ?? 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=900&q=80'),
  entryNo: String(raw?.entry_no ?? raw?.ticket_code ?? raw?.draw_code ?? 'N/A'),
  announcedOn: raw?.announced_on ? String(raw.announced_on) : raw?.announced_at ? String(raw.announced_at) : undefined,
});

const formatDate = (value?: string) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

export default function WinnersScreen() {
  const router = useRouter();
  const { isOffline } = useNetworkStatus();
  const [winners, setWinners] = useState<WinnerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(12);

  const loadWinners = async () => {
    if (isOffline) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/winners?limit=50`);
      if (!response.ok) {
        throw new Error('Failed to fetch winners');
      }

      const payload = await response.json();
      const nextWinners = Array.isArray(payload)
        ? payload.map(normalizeWinner)
        : Array.isArray(payload?.winners)
          ? payload.winners.map(normalizeWinner)
          : [];

      setWinners(nextWinners);
      setVisibleCount((current) => Math.min(current, Math.max(nextWinners.length, 12)));
    } catch (error) {
      console.warn('Winners page failed to load:', error);
      setWinners([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadWinners();
  }, [isOffline]);

  const visibleWinners = useMemo(() => winners.slice(0, visibleCount), [winners, visibleCount]);
  const hasMore = visibleCount < winners.length;

  return (
    <View style={styles.screen}>
      {isOffline ? <OfflineBanner label='Offline mode' /> : null}

      <ScrollView style={styles.scroll} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.9}>
            <Ionicons name='arrow-back' size={22} color='#171310' />
          </TouchableOpacity>
          <Text style={styles.heading}>Winners</Text>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.kicker}>Hall of fame</Text>
          <Text style={styles.heroTitle}>Recent winners</Text>
          <Text style={styles.heroText}>
            Fresh prize results from the latest Lucky Strike draws, verified and announced for the public feed.
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size='small' color='#171310' />
            <Text style={styles.loadingText}>Loading winners...</Text>
          </View>
        ) : visibleWinners.length === 0 ? (
          <OfflineState
            title='No winners yet'
            message='The latest lucky winner will appear here as soon as a draw is settled.'
            onRetry={() => void loadWinners()}
          />
        ) : (
          <>
            {visibleWinners.map((winner) => (
              <View key={winner.id} style={styles.winnerCard}>
                <View style={styles.cardTopRow}>
                  <View style={styles.pill}>
                    <Text style={styles.pillText}>Winner</Text>
                  </View>
                  <Text style={styles.entryText}>{winner.entryNo || 'N/A'}</Text>
                </View>

                <View style={styles.imageWrap}>
                  <Image
                    source={{
                      uri:
                        winner.image ||
                        'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=900&q=80',
                    }}
                    style={styles.image}
                    resizeMode='cover'
                  />
                </View>

                <View style={styles.cardBody}>
                  <Text style={styles.name}>{winner.name}</Text>
                  <Text style={styles.prize}>{winner.prize}</Text>
                  <Text style={styles.badge}>{winner.badge}</Text>
                  <Text style={styles.meta}>Announced: {formatDate(winner.announcedOn)}</Text>
                </View>
              </View>
            ))}

            {hasMore ? (
              <TouchableOpacity style={styles.showMoreButton} onPress={() => setVisibleCount((count) => count + 12)} activeOpacity={0.9}>
                <Text style={styles.showMoreButtonText}>Show more</Text>
              </TouchableOpacity>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f5efe8',
  },
  scroll: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
    borderRadius: 0,
  },
  heading: {
    fontSize: 28,
    fontWeight: '900',
    color: '#171310',
    textTransform: 'uppercase',
    letterSpacing: -0.8,
  },
  heroCard: {
    borderWidth: 3,
    borderColor: '#171310',
    backgroundColor: '#fffaf5',
    padding: 16,
    shadowColor: '#171310',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  kicker: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 3,
    borderColor: '#171310',
    backgroundColor: '#f6d7e0',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: '#171310',
  },
  heroTitle: {
    marginTop: 12,
    fontSize: 28,
    fontWeight: '900',
    color: '#171310',
    textTransform: 'uppercase',
    letterSpacing: -0.8,
  },
  heroText: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 18,
    color: '#4e4a47',
  },
  loadingCard: {
    borderWidth: 3,
    borderColor: '#171310',
    backgroundColor: '#fff',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#171310',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  loadingText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#171310',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  winnerCard: {
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: '#171310',
    shadowColor: '#171310',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
    overflow: 'hidden',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 3,
    borderBottomColor: '#171310',
    backgroundColor: '#fffaf5',
  },
  pill: {
    backgroundColor: '#ff3d8c',
    borderWidth: 2,
    borderColor: '#171310',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  pillText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  entryText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#171310',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  imageWrap: {
    borderBottomWidth: 3,
    borderBottomColor: '#171310',
    backgroundColor: '#f5efe8',
  },
  image: {
    width: '100%',
    height: 180,
  },
  cardBody: {
    padding: 14,
    gap: 6,
  },
  name: {
    fontSize: 20,
    fontWeight: '900',
    color: '#171310',
    textTransform: 'uppercase',
  },
  prize: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ff3d8c',
    letterSpacing: -0.4,
  },
  badge: {
    fontSize: 11,
    fontWeight: '800',
    color: '#171310',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  meta: {
    marginTop: 2,
    fontSize: 11,
    color: '#4e4a47',
  },
  showMoreButton: {
    alignSelf: 'center',
    backgroundColor: '#171310',
    borderWidth: 3,
    borderColor: '#171310',
    paddingHorizontal: 18,
    paddingVertical: 12,
    shadowColor: '#171310',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  showMoreButtonText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: '#fff',
  },
});

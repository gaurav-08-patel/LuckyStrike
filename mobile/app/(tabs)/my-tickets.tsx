import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AuthModal } from '../../components/AuthModal';
import { useAuth } from '../../context/AuthContext';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

type TicketStatusFilter = 'all' | 'active' | 'won' | 'lost';

type MyTicketApiItem = {
  id: number;
  ticketCode: string;
  ticketStatus: string;
  createdAt: string;
  draw: {
    id: number;
    drawCode: string;
    title: string;
    prizeTitle: string;
    prizeAmount: number;
    ticketPrice: number;
    drawAt: string;
    expiresAt: string;
    drawStatus: string;
  };
};

type TicketSummary = {
  all: number;
  active: number;
  won: number;
  lost: number;
};

type DrawGroup = {
  drawId: number;
  drawCode: string;
  title: string;
  prizeTitle: string;
  prizeAmount: number;
  drawStatus: string;
  drawAt: string;
  expiresAt: string;
  tickets: MyTicketApiItem[];
};

const filterOptions: { key: TicketStatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'won', label: 'Won' },
  { key: 'lost', label: 'Lost' },
];

const toLocalTime = (utcValue?: string) => {
  if (!utcValue) return 'N/A';
  const normalizedValue = utcValue.includes('T') || utcValue.includes(' ')
    ? utcValue.replace(' ', 'T')
    : utcValue;

  const hasExplicitTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(normalizedValue);
  const date = new Date(hasExplicitTimezone ? normalizedValue : `${normalizedValue}Z`);

  if (Number.isNaN(date.getTime())) return utcValue;

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
};

const formatDate = (value: string) => toLocalTime(value);

const formatPrize = (amount: number) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(amount);

const getDrawStatusStyle = (status: string) => {
  const normalized = status.toLowerCase();

  if (normalized === 'completed' || normalized === 'finished') {
    return styles.statusCompleted;
  }

  if (normalized === 'closed' || normalized === 'expired') {
    return styles.statusClosed;
  }

  if (normalized === 'active' || normalized === 'live') {
    return styles.statusActive;
  }

  return styles.statusNeutral;
};

const getTicketStatusStyle = (status: string) => {
  const normalized = status.toLowerCase();

  if (normalized === 'won') return styles.ticketWon;
  if (normalized === 'lost') return styles.ticketLost;
  if (normalized === 'active' || normalized === 'pending') return styles.ticketActive;
  return styles.ticketNeutral;
};

const getTicketCardTone = (status: string) => {
  const normalized = status.toLowerCase();
  if (normalized === 'won') return styles.ticketCardWon;
  if (normalized === 'lost') return styles.ticketCardLost;
  return styles.ticketCardActive;
};

export default function MyTicketsScreen() {
  const { isLoggedIn, isAuthReady } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState<TicketStatusFilter>('all');
  const [tickets, setTickets] = useState<MyTicketApiItem[]>([]);
  const [summary, setSummary] = useState<TicketSummary>({ all: 0, active: 0, won: 0, lost: 0 });
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    if (!isAuthReady) return;
    if (!isLoggedIn) {
      setTickets([]);
      setLoading(false);
      return;
    }

    const fetchTickets = async () => {
      try {
        setLoading(true);
        const token = await AsyncStorage.getItem('luckyStrikeToken');
        if (!token) {
          setTickets([]);
          setLoading(false);
          return;
        }

        const query = selectedStatus === 'all' ? '' : `?status=${selectedStatus}`;
        const response = await fetch(`${API_BASE_URL}/api/my-tickets${query}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Unable to load tickets.');
        }

        const data = await response.json();
        const nextTickets = Array.isArray(data?.tickets) ? data.tickets : [];
        setTickets(nextTickets);
        setSummary(
          data?.summary || {
            all: 0,
            active: 0,
            won: 0,
            lost: 0,
          },
        );
      } catch (error) {
        console.warn('Tickets failed to load:', error);
        setTickets([]);
        setSummary({ all: 0, active: 0, won: 0, lost: 0 });
      } finally {
        setLoading(false);
      }
    };

    void fetchTickets();
  }, [isAuthReady, isLoggedIn, selectedStatus]);

  const groupedTickets = useMemo<DrawGroup[]>(() => {
    const groups = new Map<number, DrawGroup>();

    tickets.forEach((ticket) => {
      const draw = ticket.draw;
      const existing = groups.get(draw.id);

      if (existing) {
        existing.tickets.push(ticket);
        return;
      }

      groups.set(draw.id, {
        drawId: draw.id,
        drawCode: draw.drawCode,
        title: draw.title,
        prizeTitle: draw.prizeTitle,
        prizeAmount: draw.prizeAmount,
        drawStatus: draw.drawStatus,
        drawAt: draw.drawAt,
        expiresAt: draw.expiresAt,
        tickets: [ticket],
      });
    });

    return Array.from(groups.values())
      .map((group) => ({
        ...group,
        tickets: [...group.tickets].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
      }))
      .sort((a, b) => {
        const aLatest = Math.max(...a.tickets.map((ticket) => new Date(ticket.createdAt).getTime()));
        const bLatest = Math.max(...b.tickets.map((ticket) => new Date(ticket.createdAt).getTime()));
        return bLatest - aLatest;
      });
  }, [tickets]);

  if (!isAuthReady) {
    return (
      <View style={styles.screen}>
        <View style={styles.loginContainer}>
          <Text style={styles.loadingText}>Loading your tickets...</Text>
        </View>
      </View>
    );
  }

  if (!isLoggedIn) {
    return (
      <>
        <View style={styles.screen}>
          <View style={styles.lockCard}>
            <View style={styles.lockBadge}>
              <Text style={styles.lockBadgeText}>Locked</Text>
            </View>

            <Text style={styles.lockTitle}>Unlock your tickets</Text>
            <Text style={styles.lockText}>
              Sign in to see all your active, won, and lost tickets from every draw.
            </Text>

            <View style={styles.lockList}>
              <View style={styles.lockRow}>
                <Text style={styles.lockDot}>•</Text>
                <Text style={styles.lockRowText}>Track every ticket you’ve bought</Text>
              </View>
              <View style={styles.lockRow}>
                <Text style={styles.lockDot}>•</Text>
                <Text style={styles.lockRowText}>See draw status and winners</Text>
              </View>
              <View style={styles.lockRow}>
                <Text style={styles.lockDot}>•</Text>
                <Text style={styles.lockRowText}>Check ticket progress in one place</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => setAuthModalOpen(true)}
            >
              <Text style={styles.primaryButtonText}>Login / Signup</Text>
            </TouchableOpacity>
          </View>
        </View>

        <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      </>
    );
  }

  return (
    <>
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <Text style={styles.pageTitle}>My Tickets</Text>
          </View>

          <View style={styles.filterBar}>
            {filterOptions.map((option) => {
              const selected = option.key === selectedStatus;
              return (
                <TouchableOpacity
                  key={option.key}
                  activeOpacity={0.9}
                  onPress={() => setSelectedStatus(option.key)}
                  style={[styles.filterButton, selected && styles.filterButtonActive]}
                >
                  <Text style={[styles.filterText, selected && styles.filterTextActive]}>
                    {option.label} ({summary[option.key]})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {loading ? (
            <View style={styles.skeletonList}>
              {Array.from({ length: 2 }).map((_, index) => (
                <View key={index} style={styles.skeletonCard}>
                  <View style={styles.skeletonHeader} />
                  <View style={styles.skeletonLineShort} />
                  <View style={styles.skeletonLineLong} />
                  <View style={styles.skeletonLineMedium} />
                  <View style={styles.skeletonTicketRow}>
                    <View style={styles.skeletonTicketCard} />
                    <View style={styles.skeletonTicketCard} />
                  </View>
                </View>
              ))}
            </View>
          ) : groupedTickets.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>No tickets found</Text>
              <Text style={styles.emptyText}>
                Try another filter or buy tickets from an active draw.
              </Text>
            </View>
          ) : (
            <View style={styles.groupList}>
              {groupedTickets.map((group) => (
                <View key={group.drawId} style={styles.groupCard}>
                  <View style={styles.groupHeader}>
                    <View style={styles.groupInfo}>
                      <Text style={styles.drawCode}>Draw: {group.drawCode}</Text>
                      <Text style={styles.groupTitle}>{group.title}</Text>
                      <Link href={`/campaign/${group.drawId}`} asChild>
                        <TouchableOpacity style={styles.viewDrawLink}>
                          <View style={styles.viewDrawRow}>
                            <Ionicons name='link' size={11} color='#ff2d78' />
                            <Text style={styles.viewDrawText}>View draw</Text>
                          </View>
                        </TouchableOpacity>
                      </Link>
                    </View>

                    <View style={styles.groupChips}>
                      <Text style={[styles.statusPill, getDrawStatusStyle(group.drawStatus)]}>
                        {group.drawStatus}
                      </Text>
                      <Text style={styles.countPill}>
                        {group.tickets.length} ticket{group.tickets.length > 1 ? 's' : ''}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.summaryRow}>
                    <View style={styles.summaryBox}>
                      <Text style={styles.summaryLabel}>Prize</Text>
                      <Text style={styles.summaryValue}>
                        {group.prizeTitle} · {formatPrize(group.prizeAmount)}
                      </Text>
                    </View>
                    <View style={styles.summaryBox}>
                      <Text style={styles.summaryLabel}>Draw time</Text>
                      <Text style={styles.summaryValue}>{formatDate(group.drawAt)}</Text>
                    </View>
                    <View style={styles.summaryBox}>
                      <Text style={styles.summaryLabel}>Closes</Text>
                      <Text style={styles.summaryValue}>{formatDate(group.expiresAt)}</Text>
                    </View>
                  </View>

                  <View style={styles.ticketGrid}>
                    {group.tickets.length > 4 ? (
                      <ScrollView
                        style={styles.ticketListScrollable}
                        contentContainerStyle={styles.ticketListContent}
                        showsVerticalScrollIndicator={false}
                        nestedScrollEnabled
                      >
                        {group.tickets.map((ticket) => (
                          <View
                            key={ticket.id}
                            style={[styles.ticketCard, getTicketCardTone(ticket.ticketStatus)]}
                          >
                            <View style={styles.ticketCutLeft} />
                            <View style={styles.ticketCutRight} />

                            <View style={styles.ticketHeader}>
                              <View>
                                <Text style={styles.ticketLabel}>Ticket</Text>
                                <Text style={styles.ticketCode}>{ticket.ticketCode}</Text>
                              </View>
                              <Text style={[styles.ticketBadge, getTicketStatusStyle(ticket.ticketStatus)]}>
                                {ticket.ticketStatus}
                              </Text>
                            </View>

                            <View style={styles.ticketDividerWrap}>
                              <View style={styles.ticketDivider}>
                                {Array.from({ length: 24 }, (_, index) => (
                                  <View key={`${ticket.id}-dot-${index}`} style={styles.ticketDividerDot} />
                                ))}
                              </View>
                            </View>

                            <View style={styles.ticketMetaRow}>
                              <Text style={styles.ticketMeta}>Price: {ticket.draw.ticketPrice}</Text>
                              <Text style={styles.ticketMeta}>Purchased: {formatDate(ticket.createdAt)}</Text>
                            </View>
                          </View>
                        ))}
                      </ScrollView>
                    ) : (
                      group.tickets.map((ticket) => (
                        <View
                          key={ticket.id}
                          style={[styles.ticketCard, getTicketCardTone(ticket.ticketStatus)]}
                        >
                          <View style={styles.ticketCutLeft} />
                          <View style={styles.ticketCutRight} />

                          <View style={styles.ticketHeader}>
                            <View>
                              <Text style={styles.ticketLabel}>Ticket</Text>
                              <Text style={styles.ticketCode}>{ticket.ticketCode}</Text>
                            </View>
                            <Text style={[styles.ticketBadge, getTicketStatusStyle(ticket.ticketStatus)]}>
                              {ticket.ticketStatus}
                            </Text>
                          </View>

                          <View style={styles.ticketDividerWrap}>
                            <View style={styles.ticketDivider}>
                              {Array.from({ length: 24 }, (_, index) => (
                                <View key={`${ticket.id}-dot-${index}`} style={styles.ticketDividerDot} />
                              ))}
                            </View>
                          </View>

                          <View style={styles.ticketMetaRow}>
                            <Text style={styles.ticketMeta}>Price: {ticket.draw.ticketPrice}</Text>
                            <Text style={styles.ticketMeta}>Purchased: {formatDate(ticket.createdAt)}</Text>
                          </View>
                        </View>
                      ))
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f9f5f0',
  },
  content: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 36,
  },
  headerRow: {
    paddingTop: 8,
    paddingBottom: 10,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '900',
    textTransform: 'uppercase',
    color: '#171310',
    letterSpacing: -0.7,
  },
  filterBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
    marginBottom: 8,
  },
  filterButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#171310',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 6,
    shadowColor: '#171310',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  filterButtonActive: {
    backgroundColor: '#ff3c8c',
  },
  filterText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: '#171310',
  },
  filterTextActive: {
    color: '#fff',
  },
  skeletonList: {
    gap: 12,
    marginTop: 12,
  },
  skeletonCard: {
    borderWidth: 2,
    borderColor: '#171310',
    backgroundColor: '#fff',
    padding: 12,
    shadowColor: '#171310',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  skeletonHeader: {
    width: '35%',
    height: 18,
    backgroundColor: '#efe3da',
    marginBottom: 12,
  },
  skeletonLineShort: {
    width: '25%',
    height: 12,
    backgroundColor: '#efe3da',
    marginBottom: 8,
  },
  skeletonLineLong: {
    width: '65%',
    height: 18,
    backgroundColor: '#efe3da',
    marginBottom: 8,
  },
  skeletonLineMedium: {
    width: '45%',
    height: 14,
    backgroundColor: '#efe3da',
    marginBottom: 12,
  },
  skeletonTicketRow: {
    flexDirection: 'row',
    gap: 8,
  },
  skeletonTicketCard: {
    flex: 1,
    height: 90,
    backgroundColor: '#f4eae2',
    borderWidth: 2,
    borderColor: '#171310',
  },
  emptyBox: {
    marginTop: 12,
    borderWidth: 1.5,
    borderColor: '#1713101a',
    borderRadius: 14,
    backgroundColor: '#fff8fb',
    padding: 18,
  },
  emptyTitle: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '900',
    textTransform: 'uppercase',
    color: '#171310',
  },
  emptyText: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
    color: '#17131099',
  },
  groupList: {
    gap: 10,
  },
  groupCard: {
    borderWidth: 2,
    borderColor: '#1713106d',
    borderRadius: 14,
    backgroundColor: '#fffef7',
    padding: 9,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 7,
  },
  groupInfo: {
    flex: 1,
    paddingRight: 6,
  },
  drawCode: {
    fontSize: 7.5,
    color: '#17131088',
    fontWeight: '900',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  groupTitle: {
    marginTop: 4,
    fontSize: 15,
    fontWeight: '900',
    color: '#171310',
    letterSpacing: -0.3,
    textTransform: 'uppercase',
  },
  viewDrawLink: {
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  viewDrawRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    textDecorationLine: 'underline',
  },
  viewDrawText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: '#ff2d78',
    textDecorationLine: 'underline',
  },
  groupChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 6,
  },
  statusPill: {
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 999,
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
    overflow: 'hidden',
    lineHeight: 10,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  countPill: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#17131018',
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 5,
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#171310',
    lineHeight: 10,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 5,
    marginBottom: 8,
  },
  summaryBox: {
    flex: 1,
    backgroundColor: '#f7f4f2',
    borderWidth: 1,
    borderColor: '#17131014',
    borderRadius: 9,
    padding: 7,
  },
  summaryLabel: {
    fontSize: 6.5,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#17131088',
    fontWeight: '900',
  },
  summaryValue: {
    marginTop: 3,
    fontSize: 8.8,
    lineHeight: 12,
    color: '#171310',
    fontWeight: '800',
  },
  ticketGrid: {
    gap: 7,
  },
  ticketListScrollable: {
    maxHeight: 280,
  },
  ticketListContent: {
    gap: 7,
    paddingBottom: 4,
  },
  ticketCard: {
    position: 'relative',
    borderWidth: 1,
    borderColor: '#17131014',
    borderRadius: 12,
    padding: 8,
    overflow: 'visible',
    marginHorizontal: 2,
  },
  ticketCutLeft: {
    position: 'absolute',
    left: -10,
    top: '58%',
    width: 20,
    height: 20,
    marginTop: -10,
    borderRadius: 999,
    backgroundColor: '#fffef7',
    zIndex: 2,
  },
  ticketCutRight: {
    position: 'absolute',
    right: -10,
    top: '58%',
    width: 20,
    height: 20,
    marginTop: -10,
    borderRadius: 999,
    backgroundColor: '#fffef7',
    zIndex: 2,
  },
  ticketCardActive: {
    backgroundColor: '#f9ebd7',
  },
  ticketCardWon: {
    backgroundColor: '#cfeee0',
  },
  ticketCardLost: {
    backgroundColor: '#f2d1d6',
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  ticketLabel: {
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: '#17131088',
  },
  ticketCode: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: '900',
    color: '#171310',
    letterSpacing: -0.4,
  },
  ticketBadge: {
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 999,
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
    overflow: 'hidden',
  },
  ticketDividerWrap: {
    position: 'relative',
    marginTop: 8,
    paddingHorizontal: 10,
  },
  ticketDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 3,
    height: 6,
  },
  ticketDividerDot: {
    width: 5,
    height: 2,
    borderRadius: 99,
    backgroundColor: '#17131022',
  },
  ticketMetaRow: {
    marginTop: 7,
    gap: 4,
  },
  ticketMeta: {
    fontSize: 9,
    lineHeight: 13,
    color: '#171310',
    fontWeight: '700',
  },
  statusCompleted: {
    backgroundColor: '#dff9e8',
    color: '#126c44',
  },
  statusClosed: {
    backgroundColor: '#eceae7',
    color: '#4d4b49',
  },
  statusActive: {
    backgroundColor: '#fff1b8',
    color: '#7d5600',
  },
  statusNeutral: {
    backgroundColor: '#fde7ef',
    color: '#8d1d59',
  },
  ticketWon: {
    backgroundColor: '#bfe7d0',
    color: '#0f5839',
  },
  ticketLost: {
    backgroundColor: '#eab7c0',
    color: '#882332',
  },
  ticketActive: {
    backgroundColor: '#f4d9a8',
    color: '#755100',
  },
  ticketNeutral: {
    backgroundColor: '#eceae7',
    color: '#4d4b49',
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: '#17131088',
  },
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fffaf7',
    paddingHorizontal: 24,
  },
  lockCard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#fffaf7',
  },
  lockBadge: {
    backgroundColor: '#171310',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
  },
  lockBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  lockTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#171310',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  lockText: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 20,
    color: '#17131099',
    textAlign: 'center',
  },
  lockList: {
    width: '100%',
    marginTop: 18,
    gap: 10,
  },
  lockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  lockDot: {
    fontSize: 22,
    color: '#ff3c8c',
    fontWeight: '900',
  },
  lockRowText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    color: '#171310',
  },
  primaryButton: {
    width: '100%',
    marginTop: 22,
    backgroundColor: '#ff3c8c',
    borderWidth: 3,
    borderColor: '#171310',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#171310',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
});

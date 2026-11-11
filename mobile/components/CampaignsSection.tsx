import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export type Campaign = {
  id: string;
  title: string;
  subtitle: string;
  prize: string;
  entryFrom: number;
  status: string;
  image: string;
  drawCode: string;
  campaignType?: 'daily' | 'weekly' | 'monthly';
  drawDate?: string;
  lastRegistration?: string | null;
  currency?: string;
  entriesMultiplier?: string | null;
};

type TabName = 'All campaigns' | 'Daily' | 'Weekly' | 'Monthly';

type CampaignsSectionProps = {
  campaigns: Campaign[];
  tabs: readonly TabName[];
  activeTab: TabName;
  onTabChange: (tab: TabName) => void;
};

const getCampaignDeadline = (campaign: Campaign) => {
  const rawDeadline = campaign.lastRegistration || campaign.drawDate || new Date(Date.now() + 86400000).toISOString();
  const date = new Date(rawDeadline);
  return Number.isNaN(date.getTime()) ? new Date(Date.now() + 86400000) : date;
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

export function CampaignsSection({ campaigns, tabs, activeTab, onTabChange }: CampaignsSectionProps) {
  const router = useRouter();
  const [now, setNow] = useState(() => new Date());
  const [pressedCardId, setPressedCardId] = useState<string | null>(null);

  useEffect(() => {
    const clock = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(clock);
  }, []);

  const visibleCampaigns = campaigns.filter((campaign) => {
    if (activeTab === 'All campaigns') return true;
    return campaign.subtitle.toLowerCase().includes(activeTab.toLowerCase());
  });

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.eyebrow}>Draws</Text>
          <Text style={styles.title}>Campaigns</Text>
        </View>

        <TouchableOpacity style={styles.showAllButton} onPress={() => router.push('/campaigns')}>
          <Text style={styles.showAllText}>Show all</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabArea}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.tabRow}>
            {tabs.map((tab) => {
              const selected = tab === activeTab;
              return (
               <TouchableOpacity
                 key={tab}
                 onPress={() => onTabChange(tab)}
                 style={[styles.tabButton, selected && styles.tabButtonActive]}
               >
                 <Text style={[styles.tabText, selected && styles.tabTextActive]}>{tab}</Text>
               </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      <View style={styles.list}>
        {visibleCampaigns.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No campaigns available</Text>
            <Text style={styles.emptyText}>There are no active draws right now. Please check back soon for the next lucky draw.</Text>
          </View>
        ) : (
          visibleCampaigns.slice(0, 3).map((campaign) => {
            const deadline = getCampaignDeadline(campaign);
            const remainingMs = deadline.getTime() - now.getTime();
            const isExpired = remainingMs <= 0;
            const dayMs = 24 * 60 * 60 * 1000;
            const showCountdown = !isExpired && remainingMs <= 2 * dayMs;
            const isJustLaunched = !isExpired && remainingMs > 2 * dayMs && remainingMs <= 7 * dayMs;

            const productTone = isExpired
              ? styles.statusClosed
              : showCountdown
               ? styles.statusClosing
               : styles.statusOpen;

            let badgeLabel = 'Registration open';
            if (isExpired) badgeLabel = 'Closed';
            else if (showCountdown) badgeLabel = 'Closing in';
            else if (isJustLaunched) badgeLabel = 'Just launched';

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
                   {showCountdown ? (
                     <>
                       <Text style={styles.registrationPillLabel}>{badgeLabel}</Text>
                       <Text style={styles.registrationPillTime}>{formatCountdown(deadline, now)}</Text>
                     </>
                   ) : (
                     <Text style={styles.registrationPillText}>{badgeLabel}</Text>
                   )}
                 </View>

                 <View style={styles.card}>
                   <View style={styles.mediaWrap}>
                     <Image source={{ uri: campaign.image || 'https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=900&q=80' }} style={styles.image} resizeMode='cover' />
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
          })
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: '#ff2d78',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#171310',
    textTransform: 'uppercase',
  },
  showAllButton: {
    borderWidth: 3,
    borderColor: '#171310',
    borderRadius: 0,
    backgroundColor: '#ffd400',
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#171310',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  showAllText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: '#171310',
  },
  tabArea: {
    marginTop: 8,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tabButton: {
    borderWidth: 3,
    borderColor: '#171310',
    borderRadius: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
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
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: '#171310',
  },
  tabTextActive: {
    color: '#fff',
  },
  list: {
    marginTop: 18,
    gap: 18,
  },
  cardShell: {
    marginTop: 12,
    transform: [{ scale: 1 }],
  },
  cardShellPressed: {
    transform: [{ scale: 0.98 }],
  },
  registrationPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 3,
    borderColor: '#171310',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: -18,
    marginLeft: 12,
    shadowColor: '#171310',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
    minWidth: 150,
    zIndex: 3,
  },
  statusOpen: {
    backgroundColor: '#53c765',
  },
  statusClosing: {
    backgroundColor: '#ff3b30',
  },
  statusClosed: {
    backgroundColor: '#171310',
  },
  registrationPillLabel: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  registrationPillText: {
    color: '#171310',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  registrationPillTime: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1,
    textAlign: 'center',
  },
  card: {
    position: 'relative',
    backgroundColor: '#f3f2f2',
    borderWidth: 3,
    borderColor: '#171310',
    borderRadius: 28,
    overflow: 'visible',
    shadowColor: '#171310',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
    paddingBottom: 12,
  },
  mediaWrap: {
    margin: 10,
    marginTop: 18,
    borderWidth: 3,
    borderColor: '#171310',
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#dfe8ef',
  },
  image: {
    width: '100%',
    height: 200,
  },
  body: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  winText: {
    marginTop: 4,
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 30,
    color: '#ff3b30',
    textTransform: 'uppercase',
  },
  prizeText: {
    color: '#171310',
  },
  offerText: {
    marginTop: 2,
    fontSize: 14,
    color: '#171310',
    fontWeight: '900',
    opacity: 0.8,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  entryButton: {
    marginTop: 16,
    width: '100%',
    backgroundColor: '#3d4fd1',
    borderWidth: 3,
    borderColor: '#171310',
    borderRadius: 0,
    paddingVertical: 14,
    paddingHorizontal: 10,
    shadowColor: '#171310',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  entryButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  metaRow: {
    marginTop: 16,
    paddingTop: 10,
    borderTopWidth: 3,
    borderTopColor: '#171310',
    borderStyle: 'dashed',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  metaText: {
    flex: 1,
    color: '#171310',
    opacity: 0.8,
    fontSize: 12,
    fontWeight: '700',
  },
  drawCode: {
    color: '#ff3b30',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  footerRow: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  footerLeft: {
    color: '#171310',
    fontSize: 12,
    fontWeight: '700',
    opacity: 0.8,
  },
  footerRight: {
    color: '#171310',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    opacity: 0.8,
  },
  emptyCard: {
    borderWidth: 3,
    borderColor: '#171310',
    borderRadius: 28,
    backgroundColor: '#fffaf2',
    padding: 24,
    shadowColor: '#171310',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  emptyTitle: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '900',
    color: '#171310',
    textTransform: 'uppercase',
  },
  emptyText: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    color: '#171310',
    opacity: 0.7,
  },
});

import { useEffect, useState } from 'react';
import { Link } from 'expo-router';
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
  const [now, setNow] = useState(() => new Date());

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

        <Link href='/campaigns' asChild>
          <TouchableOpacity style={styles.showAllButton}>
            <Text style={styles.showAllText}>Show all</Text>
          </TouchableOpacity>
        </Link>
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
            const showCountdown = !isExpired && remainingMs <= 2 * 24 * 60 * 60 * 1000;

            return (
              <Link key={campaign.id} href={`/campaign/${campaign.id}`} asChild>
               <TouchableOpacity style={styles.card}>
                 <View style={styles.badgeParent}>
                   <View style={styles.badgeBox}>
                     <Text style={styles.badgeText}>
                       {campaign.entriesMultiplier || (showCountdown ? 'closing in' : 'registration open')}
                     </Text>
                     {showCountdown && !campaign.entriesMultiplier ? (
                       <Text style={styles.badgeTime}>{formatCountdown(deadline, now)}</Text>
                     ) : null}
                   </View>
                 </View>

                 <View style={styles.mediaWrap}>
                   <Image source={{ uri: campaign.image }} style={styles.image} resizeMode='cover' />
                 </View>

                 <View style={styles.body}>
                   <Text style={styles.titleRow}>Win {campaign.prize}</Text>
                   <Text style={styles.subtitle}>{campaign.title}</Text>

                   <TouchableOpacity style={styles.entryButton} activeOpacity={0.9}>
                     <Text style={styles.entryButtonText}>Entry from {campaign.entryFrom}</Text>
                   </TouchableOpacity>

                   <View style={styles.metaRow}>
                     <Text style={styles.metaText}>Draw date: {formatDrawDateTime(campaign.drawDate)} or earlier</Text>
                     <Text style={styles.drawCode}>DRAW CODE: {campaign.drawCode}</Text>
                   </View>

                   <View style={styles.footerRow}>
                     <View style={[styles.countdownBox, isExpired && styles.countdownClosed]}>
                       <Text style={styles.countdownText}>{isExpired ? 'Closed' : formatCountdown(deadline, now)}</Text>
                     </View>
                     <Text style={styles.currencyText}>{campaign.currency || 'INR'}</Text>
                   </View>
                 </View>
               </TouchableOpacity>
              </Link>
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
  card: {
    position: 'relative',
    marginTop: 12,
    borderWidth: 3,
    borderColor: '#171310',
    borderRadius: 26,
    backgroundColor: '#f5f5f5',
    overflow: 'visible',
    shadowColor: '#171310',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  },
  badgeParent: {
    position: 'absolute',
    top: -18,
    left: 16,
    zIndex: 5,
  },
  badgeBox: {
    alignSelf: 'flex-start',
    backgroundColor: '#ff3b30',
    borderWidth: 3,
    borderColor: '#171310',
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#171310',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: '#171310',
  },
  badgeTime: {
    marginTop: 2,
    fontSize: 18,
    fontWeight: '900',
    color: '#171310',
    textTransform: 'uppercase',
  },
  mediaWrap: {
    borderWidth: 3,
    borderColor: '#171310',
    borderRadius: 24,
    overflow: 'hidden',
    margin: 10,
    marginTop: 18,
    backgroundColor: '#fff',
  },
  image: {
    width: '100%',
    height: 180,
  },
  body: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 8,
  },
  titleRow: {
    fontSize: 30,
    lineHeight: 30,
    fontWeight: '900',
    color: '#171310',
    textTransform: 'uppercase',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
    color: '#171310',
    opacity: 0.7,
    textTransform: 'uppercase',
  },
  entryButton: {
    marginTop: 12,
    width: '100%',
    borderWidth: 3,
    borderColor: '#171310',
    backgroundColor: '#4b5bdc',
    paddingHorizontal: 10,
    paddingVertical: 14,
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
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 3,
    borderTopColor: '#171310',
    borderStyle: 'dashed',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  metaText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: '#171310',
    opacity: 0.75,
  },
  drawCode: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
    color: '#ff3b30',
    textTransform: 'uppercase',
  },
  footerRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  countdownBox: {
    flex: 1,
    borderWidth: 3,
    borderColor: '#171310',
    backgroundColor: '#ff3b30',
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: '#171310',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  countdownClosed: {
    backgroundColor: '#171310',
  },
  countdownText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  currencyText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#171310',
    opacity: 0.7,
    textTransform: 'uppercase',
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

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
};

type TabName = 'All campaigns' | 'Daily' | 'Weekly' | 'Monthly';

type CampaignsSectionProps = {
  campaigns: Campaign[];
  tabs: readonly TabName[];
  activeTab: TabName;
  onTabChange: (tab: TabName) => void;
};

export function CampaignsSection({ campaigns, tabs, activeTab, onTabChange }: CampaignsSectionProps) {
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
          visibleCampaigns.slice(0, 3).map((campaign) => (
            <Link key={campaign.id} href={`/campaign/${campaign.id}`} asChild>
              <TouchableOpacity style={styles.card}>
                <View style={styles.cardLabel}>
                  <Text style={styles.cardLabelText}>{campaign.status}</Text>
                </View>

                <View style={styles.cardContent}>
                  <View style={styles.imageWrap}>
                    <Image source={{ uri: campaign.image }} style={styles.image} resizeMode='cover' />
                  </View>

                  <View style={styles.body}>
                    <View style={styles.prizeRow}>
                      <Text style={styles.winText}>Win</Text>
                      <Text style={styles.prize}>{campaign.prize}</Text>
                    </View>

                    <Text style={styles.subtitleText}>{campaign.title}</Text>

                    <View style={styles.metaRow}>
                      <View style={styles.entryPill}>
                        <Text style={styles.entryPillText}>Entry from {campaign.entryFrom}</Text>
                      </View>
                      <Text style={styles.drawCode}>Draw code: {campaign.drawCode}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            </Link>
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 10,
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
    gap: 16,
  },
  card: {
    borderWidth: 3,
    borderColor: '#171310',
    borderRadius: 28,
    backgroundColor: '#f5f5f5',
    overflow: 'visible',
    shadowColor: '#171310',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  },
  cardLabel: {
    backgroundColor: '#ffd400',
    borderBottomWidth: 3,
    borderBottomColor: '#171310',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  cardLabelText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: '#171310',
  },
  cardContent: {
    flexDirection: 'row',
    gap: 12,
    padding: 10,
  },
  imageWrap: {
    width: '38%',
    borderWidth: 3,
    borderColor: '#171310',
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  image: {
    width: '100%',
    height: 160,
  },
  body: {
    flex: 1,
    backgroundColor: '#f7f7f7',
    borderRadius: 20,
    padding: 12,
    justifyContent: 'center',
  },
  prizeRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  winText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ff3b30',
    textTransform: 'uppercase',
  },
  prize: {
    fontSize: 18,
    fontWeight: '900',
    color: '#171310',
    textTransform: 'uppercase',
    flexShrink: 1,
  },
  subtitleText: {
    marginTop: 6,
    fontSize: 14,
    color: '#171310',
    opacity: 0.7,
    fontWeight: '700',
  },
  metaRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  entryPill: {
    borderRadius: 999,
    borderWidth: 3,
    borderColor: '#171310',
    backgroundColor: '#4b5bdc',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  entryPillText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  drawCode: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.1,
    color: '#171310',
    opacity: 0.65,
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

import { StyleSheet, Text, View } from 'react-native';

export type Winner = {
  id: string;
  name: string;
  prize: string;
  badge: string;
};

type WinnersSectionProps = {
  winners: Winner[];
};

export function WinnersSection({ winners }: WinnersSectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.badgeWrap}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Winners</Text>
        </View>
      </View>

      <View style={styles.list}>
        {winners.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No winners yet</Text>
            <Text style={styles.emptyText}>The latest lucky winner will appear here as soon as the draw is settled.</Text>
          </View>
        ) : (
          winners.map((winner) => (
            <View key={winner.id} style={styles.card}>
              <View style={styles.row}>
                <View>
                  <Text style={styles.name}>{winner.name}</Text>
                  <Text style={styles.badgeLine}>{winner.badge}</Text>
                </View>
                <View style={styles.prizeChip}>
                  <Text style={styles.prizeText}>{winner.prize}</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 32,
    marginHorizontal: 16,
  },
  badgeWrap: {
    alignItems: 'center',
  },
  badge: {
    borderRadius: 999,
    borderWidth: 3,
    borderColor: '#171310',
    backgroundColor: '#f43d7e',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  badgeText: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: '#fff',
  },
  list: {
    marginTop: 16,
    gap: 12,
  },
  card: {
    borderWidth: 3,
    borderColor: '#171310',
    borderRadius: 22,
    backgroundColor: '#fff',
    padding: 16,
    shadowColor: '#171310',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 18,
    fontWeight: '900',
    color: '#171310',
    textTransform: 'uppercase',
  },
  badgeLine: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: '#ff2d78',
  },
  prizeChip: {
    borderRadius: 999,
    borderWidth: 3,
    borderColor: '#171310',
    backgroundColor: '#3acf7e',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  prizeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: '#171310',
  },
  emptyCard: {
    borderWidth: 3,
    borderColor: '#171310',
    borderRadius: 22,
    backgroundColor: '#fffaf2',
    padding: 24,
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
    fontSize: 14,
    lineHeight: 20,
    color: '#171310',
    opacity: 0.7,
  },
});

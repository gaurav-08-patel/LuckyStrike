import { StyleSheet, Text, View } from 'react-native';

const steps = [
  { id: 'step-1', number: '01', title: 'Choose campaign', description: 'Buy Modesh Credit from the prize campaign that matches your style.' },
  { id: 'step-2', number: '02', title: 'Earn entries', description: 'Every purchase unlocks entries for big-ticket prizes and daily wins.' },
  { id: 'step-3', number: '03', title: 'Follow the draw', description: 'Track the live draw and keep an eye on your results in real time.' },
  { id: 'step-4', number: '04', title: 'Redeem rewards', description: 'Cash out or shop on the Modesh store with your credited rewards.' },
];

export function HowItWorksSection() {
  return (
    <View style={styles.section}>
      <View style={styles.badgeWrap}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>How it works</Text>
        </View>
      </View>

      <View style={styles.list}>
        {steps.map((step) => (
          <View key={step.id} style={styles.card}>
            <View style={styles.cardTop}>
              <Text style={styles.number}>{step.number}</Text>
              <View style={styles.circle}>
                <Text style={styles.circleText}>{step.number}</Text>
              </View>
            </View>
            <Text style={styles.title}>{step.title}</Text>
            <Text style={styles.text}>{step.description}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 32,
    marginHorizontal: 16,
    borderWidth: 3,
    borderColor: '#171310',
    borderRadius: 28,
    backgroundColor: '#f5efe9',
    padding: 16,
    shadowColor: '#171310',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
  badgeWrap: {
    alignItems: 'center',
  },
  badge: {
    borderRadius: 999,
    borderWidth: 3,
    borderColor: '#171310',
    backgroundColor: '#f4ce45',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  badgeText: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: '#171310',
  },
  list: {
    marginTop: 20,
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
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  number: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: '#ff2d78',
  },
  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#171310',
    backgroundColor: '#f4ce45',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#171310',
  },
  title: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '900',
    textTransform: 'uppercase',
    color: '#171310',
  },
  text: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
    color: '#171310',
    opacity: 0.7,
  },
});

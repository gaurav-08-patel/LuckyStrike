import { StyleSheet, Text, View } from 'react-native';

type Step = {
  id: string;
  number: string;
  title: string;
  description: string;
  accent: string;
  chip: string;
  glow: string;
  align: 'left' | 'right';
};

const steps: Step[] = [
  {
    id: 'step-1',
    number: '01',
    title: 'Choose campaign',
    description: 'Buy Modesh Credit from the prize campaign that matches your style.',
    accent: '#2cc98d',
    chip: '#146c4d',
    glow: '#14af7d',
    align: 'left',
  },
  {
    id: 'step-2',
    number: '02',
    title: 'Earn entries',
    description: 'Every purchase unlocks entries for big-ticket prizes and daily wins.',
    accent: '#ff5d7d',
    chip: '#8d1948',
    glow: '#ef456d',
    align: 'right',
  },
  {
    id: 'step-3',
    number: '03',
    title: 'Follow the draw',
    description: 'Track the live draw and keep an eye on your results in real time.',
    accent: '#7567ef',
    chip: '#342a7a',
    glow: '#5d4fe1',
    align: 'left',
  },
  {
    id: 'step-4',
    number: '04',
    title: 'Redeem rewards',
    description: 'Cash out or shop on the Modesh store with your credited rewards.',
    accent: '#ff82c1',
    chip: '#8d2d68',
    glow: '#f75ab0',
    align: 'right',
  },
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
        {steps.map((step, index) => {
          const isRight = step.align === 'right';
          const isLast = index === steps.length - 1;

          return (
            <View key={step.id} style={[styles.stepRow, isRight && styles.stepRowRight]}>
              <View style={[styles.card, { backgroundColor: step.accent }]}> 
                <View style={styles.cardInner}>
                  <View style={styles.cardHeader}>
                    <View style={[styles.chip, { backgroundColor: step.chip }]}>
                      <Text style={styles.chipText}>{step.title}</Text>
                    </View>
                    <View style={styles.counterCircle}>
                      <Text style={styles.counterText}>{step.number}</Text>
                    </View>
                  </View>

                  <Text style={styles.cardText}>{step.description}</Text>
                </View>
              </View>

              {!isLast ? (
                <View style={styles.timelinePointWrap}>
                  <View style={styles.timelinePointOuter}>
                    <View style={styles.timelinePointInner} />
                  </View>
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 22,
    width: '100%',
    backgroundColor: '#f5efe9',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  badgeWrap: {
    alignItems: 'center',
    marginBottom: 14,
  },
  badge: {
    borderRadius: 999,
    borderWidth: 3,
    borderColor: '#171310',
    backgroundColor: '#f4ce45',
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: '#171310',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: '#171310',
  },
  list: {
    gap: 12,
  },
  stepRow: {
    position: 'relative',
    paddingLeft: 0,
  },
  stepRowRight: {
    paddingLeft: 0,
  },
  card: {
    borderWidth: 3,
    borderColor: '#171310',
    borderRadius: 18,
    shadowColor: '#171310',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 7,
    overflow: 'hidden',
  },
  cardInner: {
    minHeight: 120,
    padding: 12,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  chip: {
    borderWidth: 3,
    borderColor: '#171310',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: '#fff',
  },
  counterCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 3,
    borderColor: '#171310',
    backgroundColor: '#fffaf7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#171310',
  },
  cardText: {
    marginTop: 12,
    maxWidth: 220,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'left',
  },
  timelinePointWrap: {
    alignItems: 'center',
    marginTop: 12,
  },
  timelinePointOuter: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 3,
    borderColor: '#171310',
    backgroundColor: '#fffaf7',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#171310',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
  timelinePointInner: {
    width: 18,
    height: 18,
    borderRadius: 6,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: '#171310',
    backgroundColor: '#f4ce45',
    transform: [{ rotate: '45deg' }],
  },
});

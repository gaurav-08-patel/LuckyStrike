import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useEffect, useMemo, useRef, useState } from 'react';

export type Winner = {
  id: string;
  name: string;
  prize: string;
  badge: string;
  image?: string;
  entryNo?: string;
  announcedOn?: string;
};

type WinnersSectionProps = {
  winners: Winner[];
};

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

export function WinnersSection({ winners }: WinnersSectionProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const cardWidth = 270;
  const gap = 12;

  const validWinners = useMemo(() => winners.filter(Boolean), [winners]);
  const maxIndex = Math.max(0, validWinners.length - 1);

  const scrollToIndex = (index: number) => {
    const nextIndex = Math.min(maxIndex, Math.max(0, index));
    setActiveIndex(nextIndex);
    scrollRef.current?.scrollTo({
      x: nextIndex * (cardWidth + gap),
      animated: true,
    });
  };

  useEffect(() => {
    if (validWinners.length <= 1) return;

    const interval = setInterval(() => {
      setActiveIndex((current) => {
        const nextIndex = current >= maxIndex ? 0 : current + 1;
        scrollRef.current?.scrollTo({
          x: nextIndex * (cardWidth + gap),
          animated: true,
        });
        return nextIndex;
      });
    }, 2200);

    return () => clearInterval(interval);
  }, [validWinners.length, maxIndex]);

  return (
    <View style={styles.section}>
      <View style={styles.badgeWrap}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Winners</Text>
        </View>
      </View>

      {validWinners.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No winners yet</Text>
          <Text style={styles.emptyText}>The latest lucky winner will appear here as soon as the draw is settled.</Text>
        </View>
      ) : (
        <>
          <View style={styles.carouselWrap}>
            <TouchableOpacity
              style={[styles.navButton, styles.navButtonLeft, activeIndex === 0 && styles.navButtonDisabled]}
              onPress={() => scrollToIndex(activeIndex - 1)}
              disabled={activeIndex === 0}
            >
              <Text style={styles.navButtonText}>{'‹'}</Text>
            </TouchableOpacity>

            <ScrollView
              ref={scrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              snapToInterval={cardWidth + gap}
              decelerationRate="fast"
              style={styles.scrollView}
              onScroll={(event) => {
                const x = event.nativeEvent.contentOffset.x;
                const nextIndex = Math.round(x / (cardWidth + gap));
                setActiveIndex(Math.min(maxIndex, Math.max(0, nextIndex)));
              }}
              scrollEventThrottle={16}
            >
              {validWinners.map((winner) => (
                <View key={winner.id} style={[styles.card, { width: cardWidth }]}>
                  <View style={styles.topBar}>
                    <View style={styles.pill}>
                      <Text style={styles.pillText}>Winner</Text>
                    </View>
                    <Text style={styles.idText}>{winner.id}</Text>
                  </View>

                  <View style={styles.imageWrap}>
                    <Image
                      source={{
                        uri:
                          winner.image ||
                          'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=900&q=80',
                      }}
                      style={styles.image}
                      resizeMode="cover"
                    />
                  </View>

                  <View style={styles.body}>
                    <View style={styles.nameRow}>
                      <Text style={styles.name}>{winner.name}</Text>
                      <Text style={styles.prize}>{winner.prize}</Text>
                    </View>

                    <View style={styles.meta}>
                      <Text style={styles.metaText}>Entry no: {winner.entryNo || 'N/A'}</Text>
                      <Text style={styles.metaText}>Announced: {formatDate(winner.announcedOn)}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={[styles.navButton, styles.navButtonRight, activeIndex >= maxIndex && styles.navButtonDisabled]}
              onPress={() => scrollToIndex(activeIndex + 1)}
              disabled={activeIndex >= maxIndex}
            >
              <Text style={styles.navButtonText}>{'›'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footerRow}>
            <TouchableOpacity style={styles.seeAllButton}>
              <Text style={styles.seeAllText}>See all winners</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 22,
    marginHorizontal: 0,
    width: '100%',
    paddingBottom: 14,
  },
  badgeWrap: {
    alignItems: 'center',
    marginBottom: 12,
  },
  badge: {
    borderRadius: 999,
    borderWidth: 3,
    borderColor: '#171310',
    backgroundColor: '#f43d7e',
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
    color: '#fff',
  },
  carouselWrap: {
    position: 'relative',
    paddingHorizontal: 0,
    marginHorizontal: 0,
  },
  scrollView: {
    marginHorizontal: 0,
  },
  scrollContent: {
    paddingHorizontal: 8,
    gap: 10,
    paddingVertical: 4,
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    marginTop: -18,
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 3,
    borderColor: '#171310',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#171310',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
    zIndex: 2,
  },
  navButtonLeft: {
    left: 4,
  },
  navButtonRight: {
    right: 4,
  },
  navButtonDisabled: {
    opacity: 0.45,
  },
  navButtonText: {
    fontSize: 24,
    lineHeight: 24,
    color: '#171310',
    fontWeight: '900',
  },
  card: {
    borderWidth: 3,
    borderColor: '#171310',
    borderRadius: 20,
    backgroundColor: '#fff',
    overflow: 'hidden',
    shadowColor: '#171310',
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 7,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#fff0f5',
    borderBottomWidth: 3,
    borderBottomColor: '#171310',
  },
  pill: {
    borderWidth: 2,
    borderColor: '#171310',
    backgroundColor: '#f4ce45',
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 5,
  },
  pillText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: '#171310',
  },
  idText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: '#171310',
  },
  imageWrap: {
    padding: 10,
    backgroundColor: '#fff0f5',
  },
  image: {
    width: '100%',
    height: 170,
    borderWidth: 3,
    borderColor: '#171310',
    borderRadius: 16,
  },
  body: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#171310',
    paddingBottom: 8,
  },
  name: {
    flex: 1,
    fontSize: 16,
    fontWeight: '900',
    color: '#171310',
    textTransform: 'uppercase',
  },
  prize: {
    fontSize: 13,
    fontWeight: '900',
    color: '#ff2d78',
    textTransform: 'uppercase',
  },
  meta: {
    marginTop: 8,
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
    color: '#171310',
    opacity: 0.8,
  },
  footerRow: {
    marginTop: 12,
    alignItems: 'center',
  },
  seeAllButton: {
    borderWidth: 3,
    borderColor: '#171310',
    borderRadius: 999,
    backgroundColor: '#f7f7f7',
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#171310',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
  seeAllText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
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

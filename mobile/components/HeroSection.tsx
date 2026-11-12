import { Link } from 'expo-router';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export type HeroSlide = {
  src: string;
  alt: string;
  tag: string;
};

type HeroSectionProps = {
  slides: HeroSlide[];
  activeSlide: number;
  onChange: (index: number) => void;
  onPressHowItWorks?: () => void;
};

export function HeroSection({ slides, activeSlide, onChange, onPressHowItWorks }: HeroSectionProps) {
  const slide = slides[activeSlide] ?? slides[0];

  return (
    <View style={styles.heroWrap}>
      <View style={styles.imageLayer}>
        {slides.map((item, index) => (
          <View
            key={item.alt}
            style={[
              StyleSheet.absoluteFill,
              index === activeSlide ? styles.slideVisible : styles.slideHidden,
            ]}
          >
            <Image source={{ uri: item.src }} style={styles.heroImage} resizeMode='cover' />
            <View style={styles.imageGradient} />
          </View>
        ))}
      </View>

      <View style={styles.floatingBubbleOne} />
      <View style={styles.floatingBubbleTwo} />
      <View style={styles.floatingBubbleThree} />

      <View style={styles.innerWrap}>
        <View style={styles.textBlock}>
          <View style={styles.chip}>
            <Text style={styles.chipText}>{slide.tag}</Text>
          </View>

          <Text style={styles.title}>
            Your{' '}
            <Text style={styles.titleAccent}>lucky</Text>
            {'\n'}number is waiting.
          </Text>

          <Text style={styles.subtitle}>Grab an entry, hold your ticket, and watch the draw happen live. Simple as that.</Text>

          <View style={styles.buttonRow}>
            <Link href='/campaigns' asChild>
              <TouchableOpacity style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Get your entry</Text>
              </TouchableOpacity>
            </Link>

            <TouchableOpacity style={styles.secondaryButton} onPress={onPressHowItWorks}>
              <Text style={styles.secondaryButtonText}>See how it works</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroWrap: {
    position: 'relative',
    width: '100%',
    minHeight: 270,
    overflow: 'hidden',
    backgroundColor: '#fffaf7',
    borderBottomWidth: 3,
    borderBottomColor: '#171310',
  },
  imageLayer: {
    ...StyleSheet.absoluteFill,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  imageGradient: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255,251,247,0.9)',
  },
  slideVisible: {
    opacity: 1,
  },
  slideHidden: {
    opacity: 0,
    display: 'none',
  },
  floatingBubbleOne: {
    position: 'absolute',
    left: -40,
    top: -30,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(255,212,0,0.45)',
  },
  floatingBubbleTwo: {
    position: 'absolute',
    right: 40,
    top: 60,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,45,120,0.20)',
  },
  floatingBubbleThree: {
    position: 'absolute',
    left: '26%',
    bottom: -18,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255,59,48,0.15)',
  },
  innerWrap: {
    position: 'relative',
    zIndex: 2,
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 18,
  },
  textBlock: {
    width: '88%',
    maxWidth: 360,
  },
  chip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 0,
    borderWidth: 3,
    borderColor: '#171310',
    backgroundColor: '#ff2d78',
    shadowColor: '#171310',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  chipText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: '#fff',
  },
  title: {
    marginTop: 12,
    fontSize: 30,
    lineHeight: 32,
    fontWeight: '900',
    color: '#171310',
    textTransform: 'uppercase',
    letterSpacing: -1,
  },
  titleAccent: {
    color: '#ff2d78',
    textShadowColor: '#171310',
    textShadowOffset: { width: 2, height: 0 },
    textShadowRadius: 0,
  },
  subtitle: {
    marginTop: 10,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
    color: '#171310',
    opacity: 0.72,
    maxWidth: 300,
  },
  buttonRow: {
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    width: '100%',
  },
  primaryButton: {
    borderRadius: 0,
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: '#ff3b30',
    borderWidth: 3,
    borderColor: '#171310',
    shadowColor: '#171310',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  },
  secondaryButton: {
    borderRadius: 0,
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: '#171310',
    shadowColor: '#171310',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  },
  primaryButtonText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: '#fff',
  },
  secondaryButtonText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: '#171310',
  },
});

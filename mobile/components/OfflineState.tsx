import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type OfflineStateProps = {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
};

export function OfflineState({
  title = 'Offline mode',
  message = 'You are offline right now. Connect to the internet to load fresh data.',
  onRetry,
  retryLabel = 'Retry',
}: OfflineStateProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>

      {onRetry ? (
        <TouchableOpacity style={styles.button} onPress={onRetry}>
          <Text style={styles.buttonText}>{retryLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export function OfflineBanner({ label = 'Offline mode' }: { label?: string }) {
  return (
    <View style={styles.banner}>
      <Text style={styles.bannerText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#171310',
    borderBottomWidth: 3,
    borderBottomColor: '#171310',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  bannerText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  card: {
    marginHorizontal: 16,
    marginTop: 12,
    borderWidth: 3,
    borderColor: '#171310',
    backgroundColor: '#fff',
    padding: 18,
    shadowColor: '#171310',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    textTransform: 'uppercase',
    color: '#171310',
  },
  message: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 18,
    color: '#4e4a47',
  },
  button: {
    marginTop: 16,
    alignSelf: 'flex-start',
    borderWidth: 3,
    borderColor: '#171310',
    backgroundColor: '#ff3b30',
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#171310',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  buttonText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: '#fff',
  },
});

import { Link } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export function SiteHeader() {
  return (
    <View style={styles.headerShell}>
      <Link href='/' asChild>
        <TouchableOpacity>
          <Text style={styles.brand}>
            Lucky<Text style={styles.brandAccent}>Strike</Text>
          </Text>
        </TouchableOpacity>
      </Link>

      <Link href='/(tabs)/account' asChild>
        <TouchableOpacity activeOpacity={0.96}>
          <View style={styles.loginButtonShadow}>
            <View style={styles.loginButton}>
              <Text style={styles.loginText}>Login / Signup</Text>
            </View>
          </View>
        </TouchableOpacity>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  headerShell: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(23,19,16,0.12)',
  },
  brand: {
    fontSize: 26,
    lineHeight: 28,
    fontWeight: '900',
    color: '#171310',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  brandAccent: {
    color: '#ff3b30',
  },
  loginButtonShadow: {
    backgroundColor: '#171310',
    borderRadius: 999,
    shadowColor: '#171310',
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 12,
    marginRight: 4,
    marginBottom: 4,
  },
  loginButton: {
    backgroundColor: '#ff3d8c',
    borderWidth: 3,
    borderColor: '#171310',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});

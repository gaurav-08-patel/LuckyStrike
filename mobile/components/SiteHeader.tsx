import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AuthModal } from './AuthModal';
import { useAuth } from '../context/AuthContext';

export function SiteHeader() {
  const router = useRouter();
  const { isLoggedIn, user } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const accountInitial = (user?.firstName?.[0] ?? user?.lastName?.[0] ?? 'A').toUpperCase();
  const avatarSource = user?.profileImage ? { uri: user.profileImage } : null;

  return (
    <>
      <View style={styles.headerShell}>
        <Link href='/' asChild>
          <TouchableOpacity>
            <Text style={styles.brand}>
              Lucky<Text style={styles.brandAccent}>Strike</Text>
            </Text>
          </TouchableOpacity>
        </Link>

        {isLoggedIn ? (
          <TouchableOpacity activeOpacity={0.96} onPress={() => router.push('/(tabs)/account')}>
            <View style={styles.accountButtonShadow}>
              <View style={styles.accountButton}>
                {avatarSource ? (
                  <Image source={avatarSource} style={styles.avatarImage} resizeMode='cover' />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarText}>{accountInitial}</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity activeOpacity={0.96} onPress={() => setIsAuthModalOpen(true)}>
            <View style={styles.loginButtonShadow}>
              <View style={styles.loginButton}>
                <Text style={styles.loginText}>Login / Signup</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      </View>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
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
  accountButtonShadow: {
    backgroundColor: '#ff3d8c',
    borderRadius: 999,
    shadowColor: '#171310',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
    marginRight: 4,
    marginBottom: 4,
  },
  accountButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    borderWidth: 2,
    borderColor: '#ff3d8c',
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderRadius: 999,
    width: 42,
    height: 42,
    overflow: 'hidden',
  },
  avatarFallback: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#171310',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  avatarText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
});

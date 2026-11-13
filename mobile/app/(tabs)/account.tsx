import { Link, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AuthModal } from '../../components/AuthModal';
import { useAuth } from '../../context/AuthContext';

const accountSections = [
  { key: 'profile', label: 'Profile', accent: '#ff3d8c', href: '/account/profile' },
  { key: 'bank-accounts', label: 'Bank accounts', accent: '#f6c945', href: '/account/bank-accounts' },
  { key: 'withdrawals', label: 'Withdrawals', accent: '#ff9f1c', href: '/account/withdrawals' },
  { key: 'support', label: 'Support', accent: '#5b6cff', href: '/account/support' },
] as const;

export default function AccountScreen() {
  const router = useRouter();
  const { user, isLoggedIn, logoutUser } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const displayName = useMemo(() => {
    if (!user) return 'Guest';
    return `${user.firstName ?? ''}${user.lastName ? ` ${user.lastName}` : ''}`.trim() || 'Lucky User';
  }, [user]);

  const email = user?.email ?? 'No email provided';
  const phoneNumber = user?.phoneNumber ? `+${String(user.phoneNumber).replace(/\D/g, '')}` : 'No phone number provided';
  const initials = (user?.firstName?.[0] ?? user?.lastName?.[0] ?? 'L').toUpperCase();
  const profileImageUri = user?.profileImage || null;

  if (isLoggedIn && !user) {
    router.replace('/account/profile');
  }

  return (
    <>
      <ScrollView style={styles.screen} contentContainerStyle={[styles.contentContainer, { flexGrow: 1 }]}>
        <View style={styles.shellCard}>
          <Text style={styles.eyebrow}>My account</Text>

          <View style={styles.profileRow}>
            <View style={styles.avatarWrap}>
              {profileImageUri ? (
                <Image source={{ uri: profileImageUri }} style={styles.avatarImage} resizeMode='cover' />
              ) : (
                <Text style={styles.avatarText}>{initials}</Text>
              )}
            </View>

            <View style={styles.profileMeta}>
              <Text style={styles.name}>{displayName}</Text>
              <Text style={styles.email}>{email}</Text>
              <Text style={styles.phone}>{phoneNumber}</Text>
            </View>
          </View>

          {!isLoggedIn ? (
            <Text style={styles.notice}>Login to access your profile and account settings</Text>
          ) : (
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>User account</Text>
            </View>
          )}
        </View>

        {!isLoggedIn ? (
          <View style={styles.buttonWrap}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => setIsAuthModalOpen(true)}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>Login / Signup</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.loggedInContainer}>
            <View style={styles.listWrap}>
              {accountSections.map((section) => (
                <Link key={section.key} href={section.href} asChild>
                  <TouchableOpacity activeOpacity={0.9} style={styles.listButton}>
                    <View style={[styles.listAccent, { backgroundColor: section.accent }]} />
                    <Text style={styles.listButtonText}>{section.label}</Text>
                    <Text style={styles.listArrow}>›</Text>
                  </TouchableOpacity>
                </Link>
              ))}
            </View>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => setIsLogoutModalOpen(true)}
              style={styles.logoutButton}
            >
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <Modal
        transparent
        visible={isLogoutModalOpen}
        animationType='fade'
        onRequestClose={() => setIsLogoutModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalEyebrow}>Confirm logout</Text>
                <Text style={styles.modalTitle}>Are you sure?</Text>
              </View>
            </View>

            <Text style={styles.modalNoticeText}>
              You’ll need to sign in again to access your wallet, tickets, and account settings.
            </Text>

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => setIsLogoutModalOpen(false)}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.9}
                onPress={async () => {
                  setIsLogoutModalOpen(false);
                  await logoutUser();
                }}
                style={styles.confirmButton}
              >
                <Text style={styles.confirmButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
 
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f5efe8',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  contentContainer: {
    paddingBottom: 24,
    flexGrow: 1,
  },
  shellCard: {
    marginTop: 8,
    backgroundColor: '#fffaf5',
    borderWidth: 2,
    borderColor: '#171310',
    borderRadius: 0,
    padding: 14,
    shadowColor: '#171310',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  eyebrow: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 2,
    color: '#00000099',
    textTransform: 'uppercase',
  },
  profileRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarWrap: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#171310',
    borderWidth: 2,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
  },
  profileMeta: {
    flex: 1,
  },
  name: {
    fontSize: 24,
    fontWeight: '900',
    color: '#171310',
    textTransform: 'uppercase',
  },
  email: {
    marginTop: 4,
    fontSize: 12,
    color: '#171310b3',
  },
  phone: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: '700',
    color: '#171310',
  },
  notice: {
    marginTop: 12,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
    color: '#17131099',
    textTransform: 'uppercase',
  },
  statusBadge: {
    marginTop: 14,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 2,
    borderColor: '#171310',
    borderRadius: 999,
    backgroundColor: '#171310',
    alignSelf: 'flex-start',
    shadowColor: '#171310',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.8,
    color: '#fff',
    textTransform: 'uppercase',
  },
  buttonWrap: {
    marginTop: 16,
  },
  primaryButton: {
    backgroundColor: '#ff3d8c',
    borderWidth: 2,
    borderColor: '#171310',
    borderRadius: 0,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: '#171310',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  primaryButtonText: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.8,
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  loggedInContainer: {
    flexGrow: 1,
    minHeight: 420,
    marginTop: 18,
    justifyContent: 'space-between',
  },
  listWrap: {
    gap: 10,
    flex: 1,
  },
  listButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#171310',
    borderRadius: 0,
    paddingVertical: 14,
    paddingHorizontal: 14,
    shadowColor: '#171310',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  listAccent: {
    width: 10,
    height: 10,
    borderRadius: 2,
    marginRight: 12,
    backgroundColor: '#171310',
  },
  listButtonText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.8,
    color: '#171310',
    textTransform: 'uppercase',
  },
  listArrow: {
    fontSize: 22,
    fontWeight: '900',
    color: '#171310',
    marginLeft: 8,
  },
  logoutButton: {
    marginTop: 'auto',
    backgroundColor: '#ff3b30',
    borderWidth: 3,
    borderColor: '#171310',
    borderRadius: 0,
    paddingVertical: 14,
    paddingHorizontal: 14,
    shadowColor: '#171310',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  logoutButtonText: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.8,
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(23, 19, 16, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#fffaf6',
    borderWidth: 3,
    borderColor: '#171310',
    padding: 18,
    shadowColor: '#171310',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  modalEyebrow: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: '#17131088',
  },
  modalTitle: {
    marginTop: 6,
    fontSize: 24,
    fontWeight: '900',
    textTransform: 'uppercase',
    color: '#171310',
  },
  modalNoticeText: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 20,
    color: '#171310',
    fontWeight: '600',
  },
  modalActionRow: {
    marginTop: 18,
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 3,
    borderColor: '#171310',
    backgroundColor: '#fff',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#171310',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  cancelButtonText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: '#171310',
  },
  confirmButton: {
    flex: 1,
    borderWidth: 3,
    borderColor: '#171310',
    backgroundColor: '#ff3b30',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#171310',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  confirmButtonText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: '#fff',
  },
});

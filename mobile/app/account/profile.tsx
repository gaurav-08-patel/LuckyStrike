import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { toast } from '../../components/Toast';
import { OfflineBanner } from '../../components/OfflineState';
import { useAuth } from '../../context/AuthContext';
import { countries } from '../../data/countries';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

const genderOptions = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other', value: 'other' },
];

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000');

const formatValue = (value?: string | null) => {
  if (!value || !value.trim()) return 'Not provided';
  return value.trim();
};

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isAuthReady, setUser } = useAuth();
  const { isOffline } = useNetworkStatus();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dropdownTarget, setDropdownTarget] = useState<'gender' | 'nationality' | 'countryOfResidence' | null>(null);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    gender: '',
    nationality: '',
    countryOfResidence: '',
  });

  useEffect(() => {
    setForm({
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      email: user?.email ?? '',
      phoneNumber: user?.phoneNumber ?? '',
      gender: user?.gender ?? '',
      nationality: user?.nationality ?? '',
      countryOfResidence: user?.countryOfResidence ?? '',
    });
    setAvatarUri(user?.profileImage ?? null);
    setAvatarFile(null);
  }, [user]);

  const initials = useMemo(() => {
    const value = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();
    if (!value) return 'U';
    return value
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  }, [user]);

  const activeAvatarUri = avatarUri || user?.profileImage || null;

  const resetForm = () => {
    setForm({
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      email: user?.email ?? '',
      phoneNumber: user?.phoneNumber ?? '',
      gender: user?.gender ?? '',
      nationality: user?.nationality ?? '',
      countryOfResidence: user?.countryOfResidence ?? '',
    });
    setAvatarUri(user?.profileImage ?? null);
    setAvatarFile(null);
  };

  const saveProfile = async () => {
    if (!user?.id) {
      setError('Not authenticated');
      return;
    }

    if (isOffline) {
      const message = 'You are offline. Please reconnect to the internet to update your profile.';
      setError(message);
      toast.error('Offline', message);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = await AsyncStorage.getItem('luckyStrikeToken');
      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        gender: form.gender,
        nationality: form.nationality,
        countryOfResidence: form.countryOfResidence,
      };

      const response = await fetch(`${API_BASE_URL}/api/users/${user.id}/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.message || 'Failed to update profile');
      }

      const meResponse = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      });

      if (meResponse.ok) {
        const meData = await meResponse.json();
        if (meData?.user) {
          await setUser(meData.user, token);
        }
      }

      setEditing(false);
    } catch (err: any) {
      const message =
        err?.message === 'Failed to fetch'
          ? 'Network issue while updating profile. Please check your connection and try again.'
          : err?.message || 'Failed to update profile';
      setError(message);
      toast.error('Update failed', message);
    } finally {
      setLoading(false);
    }
  };

  const uploadAvatar = async () => {
    if (!user?.id || !avatarFile) {
      return;
    }

    if (isOffline) {
      const message = 'You are offline. Please reconnect to the internet before uploading a profile photo.';
      setError(message);
      toast.error('Offline', message);
      return;
    }

    setAvatarUploading(true);
    setError(null);

    try {
      const token = await AsyncStorage.getItem('luckyStrikeToken');
      const uploadResult = await FileSystem.uploadAsync(`${API_BASE_URL}/api/users/${user.id}/avatar`, avatarFile.uri, {
        httpMethod: 'POST',
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        fieldName: 'avatar',
        mimeType: avatarFile.type || 'image/jpeg',
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      });

      if (!uploadResult || uploadResult.status >= 400) {
        const parsed = uploadResult?.body ? JSON.parse(uploadResult.body) : {};
        throw new Error(parsed?.message || 'Avatar upload failed');
      }

      let data: { url?: string } = {};
      try {
        data = JSON.parse(uploadResult.body || '{}');
      } catch {
        data = {};
      }

      const nextUrl = typeof data?.url === 'string' ? data.url : null;

      if (nextUrl) {
        setAvatarUri(nextUrl);
      }

      const meResponse = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      });

      if (meResponse.ok) {
        const meData = await meResponse.json();
        if (meData?.user) {
          await setUser(meData.user, token);
        }
      }

      setAvatarFile(null);
      setAvatarUri(nextUrl || user?.profileImage || null);
      setEditing(false);
    } catch (err: any) {
      const message =
        err?.message === 'Failed to fetch'
          ? 'Network issue while uploading your avatar. Please reconnect to the internet and try again.'
          : err?.message || 'Failed to upload avatar';
      setError(message);
      toast.error('Upload failed', message);
    } finally {
      setAvatarUploading(false);
    }
  };

  const pickAvatar = async () => {
    if (isOffline) {
      const message = 'You are offline. Please reconnect to the internet before changing your profile photo.';
      setError(message);
      toast.error('Offline', message);
      return;
    }

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      setError('Permission is required to select a profile photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (result.canceled || !result.assets?.[0]) {
      return;
    }

    const asset = result.assets[0];
    setAvatarUri(asset.uri);
    setAvatarFile({
      uri: asset.uri,
      name: asset.fileName || `avatar-${Date.now()}.jpg`,
      type: asset.mimeType || 'image/jpeg',
    });
  };

  const dropdownOptions =
    dropdownTarget === 'gender'
      ? genderOptions.map((option) => ({ label: option.label, value: option.value }))
      : countries.map((country) => ({ label: country, value: country }));

  if (!isAuthReady) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size='large' color='#171310' />
      </View>
    );
  }

  if (!user) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.contentContainer}>
        <View style={styles.topRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name='arrow-back' size={22} color='#171310' />
          </TouchableOpacity>
          <Text style={styles.heading}>Profile</Text>
        </View>

        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Please log in to view and edit your profile.</Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <>
      {isOffline ? <OfflineBanner label='Offline mode' /> : null}
      <ScrollView style={styles.screen} contentContainerStyle={styles.contentContainer}>
        <View style={styles.topRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name='arrow-back' size={22} color='#171310' />
          </TouchableOpacity>
          <Text style={styles.heading}>Profile</Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarCircle}>
              {activeAvatarUri ? (
                <Image source={{ uri: activeAvatarUri }} style={styles.avatarImage} resizeMode='cover' />
              ) : (
                <Text style={styles.avatarText}>{initials}</Text>
              )}
            </View>
            <Text style={styles.userName}>{`${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || 'Lucky User'}</Text>
            <Text style={styles.userEmail}>{user.email ?? 'No email provided'}</Text>
            <Text style={styles.userPhone}>{user.phoneNumber ?? 'No phone number provided'}</Text>

            <View style={styles.avatarActions}>
              <TouchableOpacity activeOpacity={0.9} onPress={() => void pickAvatar()} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>{avatarFile ? 'Choose another photo' : 'Upload avatar'}</Text>
              </TouchableOpacity>

              {avatarFile ? (
                <TouchableOpacity activeOpacity={0.9} onPress={() => void uploadAvatar()} disabled={avatarUploading} style={styles.primaryButtonSmall}>
                  <Text style={styles.primaryButtonText}>{avatarUploading ? 'Uploading...' : 'Update avatar'}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        </View>

        <View style={styles.formCard}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.sectionTitle}>Personal details</Text>
            {!editing ? (
              <TouchableOpacity activeOpacity={0.9} onPress={() => setEditing(true)} style={styles.editButton}>
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.fieldGroup}>
            {!editing ? (
              <>
                <View style={styles.infoBox}>
                  <Text style={styles.label}>First name</Text>
                  <Text style={styles.valueText}>{formatValue(user.firstName)}</Text>
                </View>
                <View style={styles.infoBox}>
                  <Text style={styles.label}>Last name</Text>
                  <Text style={styles.valueText}>{formatValue(user.lastName)}</Text>
                </View>
                <View style={styles.infoBox}>
                  <Text style={styles.label}>Email</Text>
                  <Text style={styles.valueText}>{formatValue(user.email)}</Text>
                </View>
                <View style={styles.infoBox}>
                  <Text style={styles.label}>Phone number</Text>
                  <Text style={styles.valueText}>{formatValue(user.phoneNumber)}</Text>
                </View>
                <View style={styles.infoBox}>
                  <Text style={styles.label}>Gender</Text>
                  <Text style={styles.valueText}>{formatValue(user.gender)}</Text>
                </View>
                <View style={styles.infoBox}>
                  <Text style={styles.label}>Nationality</Text>
                  <Text style={styles.valueText}>{formatValue(user.nationality)}</Text>
                </View>
                <View style={styles.infoBox}>
                  <Text style={styles.label}>Country of residence</Text>
                  <Text style={styles.valueText}>{formatValue(user.countryOfResidence)}</Text>
                </View>
              </>
            ) : (
              <>
                <View style={styles.fieldWrap}>
                  <Text style={styles.label}>First name</Text>
                  <TextInput
                    value={form.firstName}
                    onChangeText={(value) => setForm((current) => ({ ...current, firstName: value }))}
                    style={styles.input}
                  />
                </View>

                <View style={styles.fieldWrap}>
                  <Text style={styles.label}>Last name</Text>
                  <TextInput
                    value={form.lastName}
                    onChangeText={(value) => setForm((current) => ({ ...current, lastName: value }))}
                    style={styles.input}
                  />
                </View>

                <View style={styles.fieldWrap}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    value={form.email}
                    onChangeText={(value) => setForm((current) => ({ ...current, email: value }))}
                    keyboardType='email-address'
                    style={styles.input}
                  />
                </View>

                <View style={styles.fieldWrap}>
                  <Text style={styles.label}>Phone number</Text>
                  <TextInput
                    value={form.phoneNumber || 'Not provided'}
                    editable={false}
                    style={[styles.input, styles.inputDisabled]}
                  />
                </View>

                <View style={styles.fieldWrap}>
                  <Text style={styles.label}>Gender</Text>
                  <TouchableOpacity style={styles.dropdownBox} onPress={() => setDropdownTarget('gender')} activeOpacity={0.9}>
                    <Text style={[styles.dropdownText, !form.gender && styles.dropdownTextPlaceholder]}>
                      {form.gender ? genderOptions.find((option) => option.value === form.gender)?.label : 'Select gender'}
                    </Text>
                    <Ionicons name='chevron-down' size={18} color='#171310' />
                  </TouchableOpacity>
                </View>

                <View style={styles.fieldWrap}>
                  <Text style={styles.label}>Nationality</Text>
                  <TouchableOpacity style={styles.dropdownBox} onPress={() => setDropdownTarget('nationality')} activeOpacity={0.9}>
                    <Text style={[styles.dropdownText, !form.nationality && styles.dropdownTextPlaceholder]}>
                      {form.nationality || 'Select nationality'}
                    </Text>
                    <Ionicons name='chevron-down' size={18} color='#171310' />
                  </TouchableOpacity>
                </View>

                <View style={styles.fieldWrap}>
                  <Text style={styles.label}>Country of residence</Text>
                  <TouchableOpacity style={styles.dropdownBox} onPress={() => setDropdownTarget('countryOfResidence')} activeOpacity={0.9}>
                    <Text style={[styles.dropdownText, !form.countryOfResidence && styles.dropdownTextPlaceholder]}>
                      {form.countryOfResidence || 'Select country'}
                    </Text>
                    <Ionicons name='chevron-down' size={18} color='#171310' />
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>

          {editing ? (
            <View style={styles.actionRow}>
              <TouchableOpacity activeOpacity={0.9} onPress={() => { resetForm(); setEditing(false); }} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.9} onPress={() => void saveProfile()} disabled={loading} style={styles.primaryButtonWide}>
                <Text style={styles.primaryButtonText}>{loading ? 'Saving...' : 'Save changes'}</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <Modal visible={Boolean(dropdownTarget)} transparent animationType='fade' onRequestClose={() => setDropdownTarget(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select {dropdownTarget === 'gender' ? 'gender' : 'country'}</Text>
              <TouchableOpacity onPress={() => setDropdownTarget(null)} style={styles.closeButton}>
                <Ionicons name='close' size={20} color='#171310' />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalList} contentContainerStyle={styles.modalListContent}>
              {dropdownOptions.map((option) => {
                const selected =
                  dropdownTarget === 'gender'
                    ? form.gender === option.value
                    : form.nationality === option.value || form.countryOfResidence === option.value;

                return (
                  <TouchableOpacity
                    key={option.value}
                    activeOpacity={0.9}
                    onPress={() => {
                      setForm((current) => ({
                        ...current,
                        [dropdownTarget || 'gender']: option.value,
                      }));
                      setDropdownTarget(null);
                    }}
                    style={[styles.optionButton, selected && styles.optionButtonSelected]}
                  >
                    <Text style={[styles.optionButtonText, selected && styles.optionButtonTextSelected]}>{option.label}</Text>
                    {selected ? <Ionicons name='checkmark' size={18} color='#171310' /> : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f5efe8',
    paddingHorizontal: 16,
  },
  contentContainer: {
    paddingTop: 16,
    paddingBottom: 32,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
  },
  backButton: {
    width: 42,
    height: 42,
    borderWidth: 3,
    borderColor: '#171310',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#171310',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  heading: {
    fontSize: 28,
    fontWeight: '900',
    color: '#171310',
    textTransform: 'uppercase',
  },
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5efe8',
  },
  emptyCard: {
    marginTop: 16,
    backgroundColor: '#ffffff',
    borderWidth: 3,
    borderColor: '#171310',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#171310',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderWidth: 3,
    borderColor: '#171310',
    borderRadius: 0,
    padding: 16,
    shadowColor: '#171310',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  profileHeader: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#fff3f8',
    borderWidth: 3,
    borderColor: '#f9a8d4',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 84,
    height: 84,
    borderRadius: 42,
  },
  avatarText: {
    color: '#be185d',
    fontSize: 30,
    fontWeight: '900',
  },
  userName: {
    marginTop: 12,
    fontSize: 22,
    fontWeight: '900',
    color: '#171310',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  userEmail: {
    marginTop: 6,
    fontSize: 12,
    color: '#171310b3',
    textAlign: 'center',
  },
  userPhone: {
    marginTop: 5,
    fontSize: 12,
    color: '#171310b3',
    textAlign: 'center',
  },
  formCard: {
    marginTop: 24,
    backgroundColor: '#fffaf5',
    borderWidth: 3,
    borderColor: '#171310',
    borderRadius: 0,
    padding: 16,
    shadowColor: '#171310',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#171310',
    textTransform: 'uppercase',
  },
  editButton: {
    borderWidth: 3,
    borderColor: '#171310',
    backgroundColor: '#ff3d8c',
    borderRadius: 0,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#171310',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  editButtonText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.6,
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  errorBox: {
    marginBottom: 12,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 12,
    padding: 12,
  },
  errorText: {
    fontSize: 12,
    color: '#b91c1c',
    fontWeight: '700',
  },
  fieldGroup: {
    gap: 12,
  },
  infoBox: {
    borderWidth: 2,
    borderColor: '#1713101a',
    backgroundColor: '#ffffff',
    borderRadius: 0,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  fieldWrap: {
    gap: 8,
  },
  label: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.8,
    color: '#17131099',
    textTransform: 'uppercase',
  },
  valueText: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: '700',
    color: '#171310',
  },
  input: {
    borderWidth: 2,
    borderColor: '#1713101a',
    backgroundColor: '#ffffff',
    borderRadius: 0,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#171310',
  },
  inputDisabled: {
    opacity: 0.9,
  },
  dropdownBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: '#1713101a',
    backgroundColor: '#ffffff',
    borderRadius: 0,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dropdownText: {
    flex: 1,
    fontSize: 16,
    color: '#171310',
    fontWeight: '700',
  },
  dropdownTextPlaceholder: {
    color: '#17131066',
  },
  avatarActions: {
    marginTop: 18,
    width: '100%',
    gap: 10,
  },
  secondaryButton: {
    backgroundColor: '#fff1f2',
    borderWidth: 2,
    borderColor: '#f9a8d4',
    borderRadius: 0,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  secondaryButtonText: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.8,
    color: '#be185d',
    textTransform: 'uppercase',
  },
  actionRow: {
    marginTop: 18,
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: '#171310',
    backgroundColor: '#ffffff',
    borderRadius: 0,
  },
  cancelButtonText: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.8,
    color: '#171310',
    textTransform: 'uppercase',
  },
  primaryButton: {
    backgroundColor: '#ff3d8c',
    borderWidth: 3,
    borderColor: '#171310',
    borderRadius: 0,
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowColor: '#171310',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  primaryButtonSmall: {
    backgroundColor: '#ff3d8c',
    borderWidth: 3,
    borderColor: '#171310',
    borderRadius: 0,
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowColor: '#171310',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  primaryButtonWide: {
    flex: 1,
    backgroundColor: '#ff3d8c',
    borderWidth: 3,
    borderColor: '#171310',
    borderRadius: 0,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: '#171310',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  primaryButtonText: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.8,
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(23, 19, 16, 0.42)',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  modalCard: {
    backgroundColor: '#fffaf5',
    borderWidth: 3,
    borderColor: '#171310',
    borderRadius: 0,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: '#1713101a',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#171310',
    textTransform: 'uppercase',
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#171310',
  },
  modalList: {
    maxHeight: 420,
  },
  modalListContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: '#1713101a',
    backgroundColor: '#ffffff',
    borderRadius: 0,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
  },
  optionButtonSelected: {
    backgroundColor: '#ffe2ea',
  },
  optionButtonText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#171310',
  },
  optionButtonTextSelected: {
    color: '#be185d',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: '#171310b3',
  },
});

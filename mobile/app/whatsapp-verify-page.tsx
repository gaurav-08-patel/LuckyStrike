import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useAuth } from '../context/AuthContext';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000');

const INITIAL_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  invitationCode: '',
};

export default function WhatsAppVerifyPage() {
  const router = useRouter();
  const { user, isAuthReady, setUser } = useAuth();
  const [form, setForm] = useState(INITIAL_FORM);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthReady && !user) {
      router.replace('/');
    }
  }, [isAuthReady, router, user]);

  if (!user || !isAuthReady) {
    return (
      <View style={styles.loadingWrap}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const handleChange = (field: keyof typeof INITIAL_FORM, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    if (!agreed) {
      setError('Please agree to the terms and privacy policy.');
      return;
    }

    const userId = user.id ?? user._id;
    if (!userId) {
      setError('User session is missing. Please log in again.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = await AsyncStorage.getItem('luckyStrikeToken');
      if (!token) {
        throw new Error('Your session is missing. Please log in again.');
      }

      const response = await fetch(API_BASE_URL + '/api/users/' + String(userId) + '/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          invitationCode: form.invitationCode.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to save your details.');
      }

      await setUser({ ...user, ...data.user });
      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
      keyboardVerticalOffset={40}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.wrapper}>
          <View style={styles.heroCard}>
            <Text style={styles.heroTitle}>Complete Your Profile</Text>
            <Text style={styles.heroSubtitle}>You’re almost in</Text>
            <View style={styles.prizeBadge}>
              <Text style={styles.prizeText}>₹10,000</Text>
            </View>
            <Text style={styles.heroOffer}>Limited Time Offer</Text>
          </View>

          <View style={styles.formCard}>
            <View style={styles.fieldGroup}>
              <View style={styles.fieldWrap}>
                <Text style={styles.labelText}>
                  First Name <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  value={form.firstName}
                  onChangeText={(value) => handleChange('firstName', value)}
                  style={styles.input}
                  placeholder='First Name'
                  placeholderTextColor='#17131055'
                />
              </View>

              <View style={styles.fieldWrap}>
                <Text style={styles.labelText}>
                  Last Name <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  value={form.lastName}
                  onChangeText={(value) => handleChange('lastName', value)}
                  style={styles.input}
                  placeholder='Last Name'
                  placeholderTextColor='#17131055'
                />
              </View>

              <View style={styles.fieldWrap}>
                <Text style={styles.labelText}>
                  Email <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  value={form.email}
                  onChangeText={(value) => handleChange('email', value)}
                  autoCapitalize='none'
                  keyboardType='email-address'
                  style={styles.input}
                  placeholder='Email'
                  placeholderTextColor='#17131055'
                />
              </View>

              <View style={styles.fieldWrap}>
                <Text style={styles.labelText}>Invitation Code (Optional)</Text>
                <TextInput
                  value={form.invitationCode}
                  onChangeText={(value) => handleChange('invitationCode', value)}
                  style={styles.input}
                  placeholder='Invitation Code'
                  placeholderTextColor='#17131055'
                />
              </View>

              <View style={styles.fieldWrap}>
                <Text style={styles.labelText}>Registered WhatsApp Number:</Text>
                <View style={styles.phoneBox}>
                  <Text style={styles.phoneText}>+{String(user.phoneNumber || '').replace(/\D/g, '')}</Text>
                </View>
              </View>
            </View>

            <Text style={styles.mandatoryText}>
              <Text style={styles.required}>*</Text> Mandatory Fields
            </Text>

            <View style={styles.checkboxRow}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => setAgreed((value) => !value)}
                style={[
                  styles.checkbox,
                  { backgroundColor: agreed ? '#ff3d8c' : '#ffffff' },
                ]}
              />

              <Text style={styles.checkboxText}>
                I agree to the{' '}
                <Text style={styles.inlineLink}>User Agreement</Text>{' '}
                and{' '}
                <Text style={styles.inlineLink}>Privacy Policy</Text>
              </Text>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => void handleSubmit()}
              disabled={loading}
              style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
            >
              <Text style={styles.primaryButtonText}>
                {loading ? 'SIGNING UP...' : 'SIGN-UP'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f2',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
  },
  wrapper: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  heroCard: {
    backgroundColor: '#ffe7f1',
    borderWidth: 2,
    borderColor: '#171310',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    shadowColor: '#171310',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  heroTitle: {
    color: '#171310',
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 26,
  },
  heroSubtitle: {
    color: '#171310',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 4,
    opacity: 0.8,
  },
  prizeBadge: {
    marginTop: 8,
    backgroundColor: '#ff2d78',
    borderWidth: 2,
    borderColor: '#171310',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
    shadowColor: '#171310',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  prizeText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
  },
  heroOffer: {
    color: '#ff2d78',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textAlign: 'center',
    marginTop: 8,
  },
  formCard: {
    backgroundColor: '#f3f3f3',
    borderWidth: 2,
    borderColor: '#171310',
    borderRadius: 18,
    padding: 12,
    marginTop: 12,
    shadowColor: '#171310',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  },
  fieldGroup: {
    gap: 10,
  },
  fieldWrap: {
    gap: 5,
  },
  labelText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#171310',
  },
  required: {
    color: '#ff3b30',
  },
  input: {
    height: 42,
    borderWidth: 2,
    borderColor: '#171310',
    borderRadius: 10,
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    fontSize: 14,
    color: '#171310',
    fontWeight: '600',
  },
  phoneBox: {
    height: 42,
    borderWidth: 2,
    borderColor: '#171310',
    borderRadius: 10,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  phoneText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#171310',
  },
  mandatoryText: {
    marginTop: 12,
    fontSize: 11,
    fontWeight: '600',
    color: '#171310',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 10,
    gap: 8,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderWidth: 2,
    borderColor: '#171310',
    borderRadius: 4,
    marginTop: 1,
  },
  checkboxText: {
    flex: 1,
    fontSize: 12,
    color: '#171310',
    lineHeight: 17,
    fontWeight: '500',
  },
  inlineLink: {
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
  errorText: {
    marginTop: 8,
    color: '#ff3b30',
    fontSize: 12,
    fontWeight: '800',
  },
  primaryButton: {
    marginTop: 12,
    height: 48,
    backgroundColor: '#3f57d8',
    borderWidth: 2,
    borderColor: '#171310',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#171310',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  primaryButtonDisabled: {
    opacity: 0.75,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f2f2f2',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: '#171310',
  },
});

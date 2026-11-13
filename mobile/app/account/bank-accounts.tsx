import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { OfflineBanner, OfflineState } from '../../components/OfflineState';
import { useAuth } from '../../context/AuthContext';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000');

type BankAccount = {
  id: number;
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  branchName?: string | null;
  ifscCode?: string | null;
  swiftCode?: string | null;
  iban?: string | null;
  routingNumber?: string | null;
  isDefault?: boolean;
};

type BankAccountForm = {
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  branchName: string;
  ifscCode: string;
  swiftCode: string;
  iban: string;
  routingNumber: string;
  isDefault: boolean;
};

const initialForm: BankAccountForm = {
  accountHolderName: '',
  bankName: '',
  accountNumber: '',
  branchName: '',
  ifscCode: '',
  swiftCode: '',
  iban: '',
  routingNumber: '',
  isDefault: false,
};

const isConnectionFailureMessage = (message: string) =>
  /Failed to fetch|Network request failed|Failed to connect|ECONNREFUSED|ConnectException|java\.net/i.test(
    message,
  );

export default function BankAccountsScreen() {
  const router = useRouter();
  const { user, isAuthReady } = useAuth();
  const { isOffline } = useNetworkStatus();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showOfflineBanner, setShowOfflineBanner] = useState(false);
  const [form, setForm] = useState<BankAccountForm>(initialForm);

  const token = useMemo(() => AsyncStorage.getItem('luckyStrikeToken'), []);
  const isScreenOffline = isOffline || showOfflineBanner;

  const fetchAccounts = async () => {
    if (!user?.id) return;

    if (isOffline || showOfflineBanner) {
      setAccounts([]);
      setError(null);
      setLoading(false);
      setShowOfflineBanner(true);
      return;
    }

    setLoading(true);
    setError(null);
    setShowOfflineBanner(false);

    try {
      const storedToken = await token;
      const response = await fetch(`${API_BASE_URL}/api/withdrawals/bank-accounts`, {
        headers: {
          Authorization: storedToken ? `Bearer ${storedToken}` : '',
        },
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.message || 'Failed to load bank accounts');
      }

      const data = await response.json();
      setAccounts(Array.isArray(data?.bankAccounts) ? data.bankAccounts : []);
      setShowOfflineBanner(false);
    } catch (err: any) {
      const message = err?.message || 'Unable to load bank accounts.';
      if (isConnectionFailureMessage(message)) {
        setAccounts([]);
        setError(null);
        setShowOfflineBanner(true);
        return;
      }

      setError(message);
      setShowOfflineBanner(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.id) {
      setAccounts([]);
      setError(null);
      return;
    }

    if (isOffline) {
      setShowOfflineBanner(true);
      return;
    }

    void fetchAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, isOffline]);

  const handleChange = (field: keyof BankAccountForm, value: string | boolean) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(initialForm);
  };

  const submitBankAccount = async () => {
    if (!user?.id) {
      setError('You must be logged in');
      return;
    }

    if (isOffline || showOfflineBanner) {
      setError(null);
      setShowOfflineBanner(true);
      return;
    }

    const payload = {
      ...(editingId ? { bankAccountId: editingId } : {}),
      accountHolderName: form.accountHolderName.trim(),
      bankName: form.bankName.trim(),
      accountNumber: form.accountNumber.trim(),
      branchName: form.branchName.trim(),
      ifscCode: form.ifscCode.trim() || undefined,
      swiftCode: form.swiftCode.trim() || undefined,
      iban: form.iban.trim() || undefined,
      routingNumber: form.routingNumber.trim() || undefined,
      isDefault: form.isDefault,
    };

    if (!payload.accountHolderName || !payload.bankName || !payload.accountNumber || !payload.branchName) {
      setError('Account holder name, bank name, account number, and branch name are required.');
      return;
    }

    setSaving(true);
    setError(null);
    setShowOfflineBanner(false);

    try {
      const storedToken = await token;
      const response = await fetch(`${API_BASE_URL}/api/withdrawals/bank-accounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: storedToken ? `Bearer ${storedToken}` : '',
        },
        body: JSON.stringify(payload),
      });

      const responseBody = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(responseBody?.message || 'Unable to save bank account.');
      }

      resetForm();
      await fetchAccounts();
    } catch (err: any) {
      const message = err?.message || 'Unable to save bank account.';
      if (isConnectionFailureMessage(message)) {
        setError(null);
        setShowOfflineBanner(true);
        return;
      }

      setError(message);
      setShowOfflineBanner(false);
    } finally {
      setSaving(false);
    }
  };

  const startEditing = (account: BankAccount) => {
    setEditingId(account.id);
    setForm({
      accountHolderName: account.accountHolderName || '',
      bankName: account.bankName || '',
      accountNumber: account.accountNumber || '',
      branchName: account.branchName || '',
      ifscCode: account.ifscCode || '',
      swiftCode: account.swiftCode || '',
      iban: account.iban || '',
      routingNumber: account.routingNumber || '',
      isDefault: account.isDefault || false,
    });
  };

  const setDefaultAccount = async (account: BankAccount) => {
    if (!user?.id) return;

    if (isOffline || showOfflineBanner) {
      setError(null);
      setShowOfflineBanner(true);
      return;
    }

    try {
      const storedToken = await token;
      const payload = {
        bankAccountId: account.id,
        accountHolderName: account.accountHolderName,
        bankName: account.bankName,
        accountNumber: account.accountNumber,
        branchName: account.branchName || '',
        ifscCode: account.ifscCode || '',
        swiftCode: account.swiftCode || '',
        iban: account.iban || '',
        routingNumber: account.routingNumber || '',
        isDefault: true,
      };

      const response = await fetch(`${API_BASE_URL}/api/withdrawals/bank-accounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: storedToken ? `Bearer ${storedToken}` : '',
        },
        body: JSON.stringify(payload),
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body?.message || 'Unable to set default bank account.');
      }

      await fetchAccounts();
    } catch (err: any) {
      const message = err?.message || 'Unable to set default bank account.';
      if (isConnectionFailureMessage(message)) {
        setError(null);
        setShowOfflineBanner(true);
        return;
      }

      setError(message);
      setShowOfflineBanner(false);
    }
  };

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
        {isScreenOffline ? <OfflineBanner label='Offline mode' /> : null}
        <View style={styles.topRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name='arrow-back' size={22} color='#171310' />
          </TouchableOpacity>
          <Text style={styles.heading}>Bank accounts</Text>
        </View>

        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Please log in to manage your saved bank accounts.</Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <>
      {isScreenOffline ? <OfflineBanner label='Offline mode' /> : null}
      <ScrollView style={styles.screen} contentContainerStyle={styles.contentContainer}>
        <View style={styles.topRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name='arrow-back' size={22} color='#171310' />
          </TouchableOpacity>
          <Text style={styles.heading}>Bank accounts</Text>
        </View>

        <View style={styles.formCard}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.sectionTitle}>{editingId ? 'Edit bank account' : 'Add bank account'}</Text>
            {editingId ? (
              <TouchableOpacity activeOpacity={0.9} onPress={resetForm} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.fieldGroup}>
            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Account holder name</Text>
              <TextInput
                value={form.accountHolderName}
                onChangeText={(value) => handleChange('accountHolderName', value)}
                style={styles.input}
                placeholder='Account holder name'
              />
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Bank name</Text>
              <TextInput
                value={form.bankName}
                onChangeText={(value) => handleChange('bankName', value)}
                style={styles.input}
                placeholder='Bank name'
              />
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Branch name</Text>
              <TextInput
                value={form.branchName}
                onChangeText={(value) => handleChange('branchName', value)}
                style={styles.input}
                placeholder='Branch name'
              />
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Account number</Text>
              <TextInput
                value={form.accountNumber}
                onChangeText={(value) => handleChange('accountNumber', value)}
                style={styles.input}
                placeholder='Account number'
              />
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.label}>IFSC code</Text>
              <TextInput
                value={form.ifscCode}
                onChangeText={(value) => handleChange('ifscCode', value)}
                style={styles.input}
                placeholder='IFSC code'
              />
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.label}>SWIFT code</Text>
              <TextInput
                value={form.swiftCode}
                onChangeText={(value) => handleChange('swiftCode', value)}
                style={styles.input}
                placeholder='SWIFT code'
              />
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.label}>IBAN</Text>
              <TextInput
                value={form.iban}
                onChangeText={(value) => handleChange('iban', value)}
                style={styles.input}
                placeholder='IBAN (optional)'
              />
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Routing number</Text>
              <TextInput
                value={form.routingNumber}
                onChangeText={(value) => handleChange('routingNumber', value)}
                style={styles.input}
                placeholder='Routing number (optional)'
              />
            </View>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => handleChange('isDefault', !form.isDefault)}
              style={styles.toggleButton}
            >
              <View style={styles.checkboxRow}>
                <View style={[styles.checkboxBox, form.isDefault && styles.checkboxBoxChecked]}>
                  {form.isDefault ? <Text style={styles.checkboxMark}>✓</Text> : null}
                </View>
                <Text style={styles.toggleText}>Set as default account</Text>
              </View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => void submitBankAccount()}
            disabled={saving || isScreenOffline}
            style={[styles.primaryButton, isScreenOffline && styles.primaryButtonDisabled]}
          >
            <Text style={styles.primaryButtonText}>
              {saving ? (editingId ? 'Updating...' : 'Saving...') : editingId ? 'Update bank account' : 'Save bank account'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.listCard}>
          <Text style={styles.sectionTitle}>Saved accounts</Text>

          {isScreenOffline ? (
            <OfflineState
              title='Bank accounts offline'
              message='You are offline. Connect to the internet to view or update your saved bank accounts.'
              onRetry={() => {
                setShowOfflineBanner(false);
                void fetchAccounts();
              }}
            />
          ) : loading ? (
            <Text style={styles.metaText}>Loading bank accounts...</Text>
          ) : accounts.length === 0 ? (
            <Text style={styles.metaText}>No bank accounts saved yet.</Text>
          ) : (
            <View style={styles.listWrap}>
              {accounts.map((account) => (
                <View key={account.id} style={[styles.accountItem, account.isDefault && styles.accountItemDefault]}>
                  <View style={styles.accountHeaderRow}>
                    <View style={styles.accountHeaderTextWrap}>
                      <Text style={styles.accountBank}>{account.accountHolderName}</Text>
                      <Text style={styles.accountBankSub}>{account.bankName}</Text>
                    </View>
                    {account.isDefault ? (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultBadgeText}>Default</Text>
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.accountMetaBlock}>
                    <Text style={styles.accountText}>
                      <Text style={styles.accountTextBold}>Account no:</Text> {account.accountNumber}
                    </Text>
                    {account.branchName ? (
                      <Text style={styles.accountText}>
                        <Text style={styles.accountTextBold}>Branch:</Text> {account.branchName}
                      </Text>
                    ) : null}
                    {account.ifscCode ? (
                      <Text style={styles.accountText}>
                        <Text style={styles.accountTextBold}>IFSC:</Text> {account.ifscCode}
                      </Text>
                    ) : null}
                    {account.swiftCode ? (
                      <Text style={styles.accountText}>
                        <Text style={styles.accountTextBold}>SWIFT:</Text> {account.swiftCode}
                      </Text>
                    ) : null}
                    {account.iban ? (
                      <Text style={styles.accountText}>
                        <Text style={styles.accountTextBold}>IBAN:</Text> {account.iban}
                      </Text>
                    ) : null}
                    {account.routingNumber ? (
                      <Text style={styles.accountText}>
                        <Text style={styles.accountTextBold}>Routing:</Text> {account.routingNumber}
                      </Text>
                    ) : null}
                  </View>

                  <View style={styles.actionRow}>
                    <TouchableOpacity activeOpacity={0.9} onPress={() => startEditing(account)} style={styles.secondaryButtonSmall}>
                      <Text style={styles.secondaryButtonText}>Edit</Text>
                    </TouchableOpacity>

                    {!account.isDefault ? (
                      <TouchableOpacity activeOpacity={0.9} onPress={() => void setDefaultAccount(account)} style={styles.primaryButtonSmall}>
                        <Text style={styles.primaryButtonText}>Set default</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
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
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5efe8',
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
  emptyCard: {
    marginTop: 16,
    backgroundColor: '#ffffff',
    borderWidth: 3,
    borderColor: '#171310',
    borderRadius: 0,
    padding: 20,
    shadowColor: '#171310',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: '#171310b3',
  },
  formCard: {
    backgroundColor: '#fff1f8',
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
  errorBox: {
    marginBottom: 12,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 0,
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
  toggleButton: {
    borderWidth: 2,
    borderColor: '#ff3d8c',
    backgroundColor: '#fff1f8',
    borderRadius: 0,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkboxBox: {
    width: 18,
    height: 18,
    borderWidth: 2,
    borderColor: '#171310',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxBoxChecked: {
    backgroundColor: '#ff3d8c',
    borderColor: '#171310',
  },
  checkboxMark: {
    fontSize: 12,
    fontWeight: '900',
    color: '#ffffff',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#171310',
  },
  secondaryButton: {
    borderWidth: 3,
    borderColor: '#171310',
    backgroundColor: '#ffffff',
    borderRadius: 0,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  secondaryButtonText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.6,
    color: '#171310',
    textTransform: 'uppercase',
  },
  secondaryButtonSmall: {
    borderWidth: 2,
    borderColor: '#171310',
    backgroundColor: '#ffffff',
    borderRadius: 0,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  primaryButton: {
    marginTop: 18,
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
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonSmall: {
    backgroundColor: '#ff3d8c',
    borderWidth: 3,
    borderColor: '#171310',
    borderRadius: 0,
    paddingVertical: 12,
    paddingHorizontal: 12,
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
  listCard: {
    marginTop: 24,
    backgroundColor: '#fff7fb',
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
  metaText: {
    marginTop: 12,
    fontSize: 14,
    color: '#171310b3',
  },
  listWrap: {
    marginTop: 16,
    gap: 12,
  },
  accountItem: {
    backgroundColor: '#fff1f8',
    borderWidth: 2,
    borderColor: '#ffb5d2',
    borderRadius: 0,
    padding: 12,
  },
  accountItemDefault: {
    backgroundColor: '#ffe3f0',
    borderColor: '#ff3d8c',
  },
  accountHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  accountHeaderTextWrap: {
    flex: 1,
  },
  accountBank: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.6,
    color: '#171310',
    textTransform: 'uppercase',
  },
  accountBankSub: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '700',
    color: '#171310b3',
  },
  defaultBadge: {
    borderWidth: 2,
    borderColor: '#ff3d8c',
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  defaultBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.6,
    color: '#ff3d8c',
    textTransform: 'uppercase',
  },
  accountMetaBlock: {
    marginTop: 12,
    gap: 4,
  },
  accountText: {
    fontSize: 14,
    color: '#171310cc',
  },
  accountTextBold: {
    fontWeight: '900',
    color: '#171310',
  },
  actionRow: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 10,
  },
});

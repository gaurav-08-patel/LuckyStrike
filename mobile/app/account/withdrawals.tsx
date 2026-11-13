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
  isDefault?: boolean;
};

type WithdrawalRequest = {
  id: number;
  amount: number;
  currency: string;
  status: string;
  requestNote?: string | null;
  adminNote?: string | null;
  rejectionReason?: string | null;
  createdAt?: string | null;
  reviewedAt?: string | null;
  paidAt?: string | null;
  paymentReference?: string | null;
  bankAccount?: {
    accountHolderName?: string | null;
    bankName?: string | null;
    accountNumber?: string | null;
    ifscCode?: string | null;
    swiftCode?: string | null;
    iban?: string | null;
    branchName?: string | null;
  };
};

const normalizeStatus = (raw?: string | null) => {
  const value = (raw || '').replace(/_/g, ' ').trim();
  if (!value) return 'Pending';
  return value
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const formatDisplayDate = (value?: string | null) => {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getStatusTone = (status?: string) => {
  const normalized = (status || '').toLowerCase();

  if (normalized === 'paid') return { badge: styles.badgePaid, text: styles.badgeTextPaid };
  if (normalized === 'approved') return { badge: styles.badgeApproved, text: styles.badgeTextApproved };
  if (normalized === 'rejected') return { badge: styles.badgeRejected, text: styles.badgeTextRejected };
  if (normalized === 'cancelled') return { badge: styles.badgeCancelled, text: styles.badgeTextCancelled };
  if (normalized === 'under_review') return { badge: styles.badgeUnderReview, text: styles.badgeTextUnderReview };
  return { badge: styles.badgePending, text: styles.badgeTextPending };
};

const isConnectionFailureMessage = (message: string) =>
  /Failed to fetch|Network request failed|Failed to connect|ECONNREFUSED|ConnectException|java\.net/i.test(
    message,
  );

export default function WithdrawalsScreen() {
  const router = useRouter();
  const { user, isAuthReady } = useAuth();
  const { isOffline } = useNetworkStatus();
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreRequests, setHasMoreRequests] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showBankAccountMenu, setShowBankAccountMenu] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOfflineBanner, setShowOfflineBanner] = useState(false);
  const [form, setForm] = useState({ bankAccountId: '', amount: '', note: '' });

  const token = useMemo(() => AsyncStorage.getItem('luckyStrikeToken'), []);
  const isScreenOffline = isOffline || showOfflineBanner;

  const fetchRequests = async (nextOffset = 0, append = false) => {
    if (!user?.id) return;

    if (isOffline || showOfflineBanner) {
      setShowOfflineBanner(true);
      setError(null);
      setLoading(false);
      setLoadingMore(false);
      return;
    }

    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError(null);
    setShowOfflineBanner(false);

    try {
      const storedToken = await token;
      const response = await fetch(`${API_BASE_URL}/api/withdrawals/my-requests?limit=5&offset=${nextOffset}`, {
        headers: {
          Authorization: storedToken ? `Bearer ${storedToken}` : '',
        },
      });

      const requestsData = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(requestsData?.message || 'Failed to load withdrawal history');
      }

      const nextRequests = Array.isArray(requestsData?.requests) ? requestsData.requests : [];
      setRequests((current) => (append ? [...current, ...nextRequests] : nextRequests));
      setHasMoreRequests(Boolean(requestsData?.hasMore));
      setShowOfflineBanner(false);
    } catch (err: any) {
      const message = err?.message || 'Unable to load withdrawal data.';
      if (isConnectionFailureMessage(message)) {
        setShowOfflineBanner(true);
        setError(null);
        return;
      }
      setError(message);
      setShowOfflineBanner(false);
    } finally {
      if (append) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  };

  const loadData = async () => {
    if (!user?.id) return;

    if (isOffline || showOfflineBanner) {
      setShowOfflineBanner(true);
      setError(null);
      setLoading(false);
      return;
    }

    const storedToken = await token;
    setLoading(true);
    setError(null);
    setShowOfflineBanner(false);

    try {
      const [accountsResponse, requestsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/withdrawals/bank-accounts`, {
          headers: {
            Authorization: storedToken ? `Bearer ${storedToken}` : '',
          },
        }),
        fetch(`${API_BASE_URL}/api/withdrawals/my-requests?limit=5&offset=0`, {
          headers: {
            Authorization: storedToken ? `Bearer ${storedToken}` : '',
          },
        }),
      ]);

      const accountsData = await accountsResponse.json().catch(() => ({}));
      const requestsData = await requestsResponse.json().catch(() => ({}));

      if (!accountsResponse.ok) {
        throw new Error(accountsData?.message || 'Failed to load bank accounts');
      }

      if (!requestsResponse.ok) {
        throw new Error(requestsData?.message || 'Failed to load withdrawal history');
      }

      setBankAccounts(Array.isArray(accountsData?.bankAccounts) ? accountsData.bankAccounts : []);
      const initialRequests = Array.isArray(requestsData?.requests) ? requestsData.requests : [];
      setRequests(initialRequests);
      setHasMoreRequests(Boolean(requestsData?.hasMore));
      setShowOfflineBanner(false);
    } catch (err: any) {
      const message = err?.message || 'Unable to load withdrawal data.';
      if (isConnectionFailureMessage(message)) {
        setShowOfflineBanner(true);
        setError(null);
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
      setBankAccounts([]);
      setRequests([]);
      setHasMoreRequests(false);
      return;
    }

    if (isOffline) {
      setShowOfflineBanner(true);
      return;
    }

    void loadData();
  }, [user?.id, isOffline]);

  const submitWithdrawal = async () => {
    if (!user?.id) {
      setError('Please log in to submit a withdrawal request.');
      return;
    }

    if (isOffline || showOfflineBanner) {
      setShowOfflineBanner(true);
      setError(null);
      return;
    }

    const bankAccountId = Number(form.bankAccountId);
    const amount = Number(form.amount);

    if (!Number.isInteger(bankAccountId) || bankAccountId <= 0) {
      setError('Please choose a saved bank account.');
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Withdrawal amount must be greater than 0.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setShowOfflineBanner(false);

    try {
      const storedToken = await token;
      const response = await fetch(`${API_BASE_URL}/api/withdrawals/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: storedToken ? `Bearer ${storedToken}` : '',
        },
        body: JSON.stringify({ bankAccountId, amount, note: form.note.trim() || undefined }),
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body?.message || 'Unable to submit withdrawal request');
      }

      setForm({ bankAccountId: '', amount: '', note: '' });
      setShowOfflineBanner(false);
      await loadData();
    } catch (err: any) {
      const message = err?.message || 'Unable to submit withdrawal request.';
      if (isConnectionFailureMessage(message)) {
        setShowOfflineBanner(true);
        setError(null);
        return;
      }

      setError(message);
      setShowOfflineBanner(false);
    } finally {
      setSubmitting(false);
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
      <>
        {isScreenOffline ? <OfflineBanner label='Offline mode' /> : null}
        <ScrollView style={styles.screen} contentContainerStyle={styles.contentContainer}>
          <View style={styles.topRow}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name='arrow-back' size={22} color='#171310' />
            </TouchableOpacity>
            <Text style={styles.heading}>Withdrawals</Text>
          </View>

          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Please log in to submit a withdrawal.</Text>
          </View>
        </ScrollView>
      </>
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
          <Text style={styles.heading}>Withdrawals</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Request withdrawal</Text>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Choose saved bank account</Text>

            {bankAccounts.length === 0 ? (
              <Text style={styles.metaText}>No saved accounts yet. Add one in Bank Accounts first.</Text>
            ) : (
              <View style={styles.selectWrap}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => setShowBankAccountMenu((current) => !current)}
                  style={styles.dropdownButton}
                >
                  <Text style={styles.dropdownText} numberOfLines={1}>
                    {(() => {
                      const selected = bankAccounts.find((account) => String(account.id) === form.bankAccountId);
                      if (!selected) return 'Select bank account';
                      return `${selected.bankName} •••• ${selected.accountNumber.slice(-4)}`;
                    })()}
                  </Text>
                  <Text style={styles.dropdownChevron}>{showBankAccountMenu ? '▴' : '▾'}</Text>
                </TouchableOpacity>

                {showBankAccountMenu ? (
                  <View style={styles.dropdownMenu}>
                    {bankAccounts.map((account) => {
                      const selected = form.bankAccountId === String(account.id);
                      return (
                        <TouchableOpacity
                          key={account.id}
                          activeOpacity={0.9}
                          onPress={() => {
                            setForm((current) => ({ ...current, bankAccountId: String(account.id) }));
                            setShowBankAccountMenu(false);
                          }}
                          style={[styles.dropdownItem, selected && styles.dropdownItemSelected]}
                        >
                          <Text style={styles.dropdownItemTitle}>{account.bankName}</Text>
                          <Text style={styles.dropdownItemMeta}>{account.accountHolderName}</Text>
                          <Text style={styles.dropdownItemMeta}>Account no: •••• {account.accountNumber.slice(-4)}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : null}
              </View>
            )}

            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Amount</Text>
              <TextInput
                value={form.amount}
                onChangeText={(value) => setForm((current) => ({ ...current, amount: value }))}
                placeholder='Enter amount'
                keyboardType='numeric'
                style={styles.input}
              />
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Note (optional)</Text>
              <TextInput
                value={form.note}
                onChangeText={(value) => setForm((current) => ({ ...current, note: value }))}
                placeholder='Optional note for your withdrawal'
                multiline
                style={[styles.input, styles.textArea]}
              />
            </View>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => void submitWithdrawal()}
              disabled={submitting || loading || bankAccounts.length === 0 || isScreenOffline}
              style={[styles.primaryButton, isScreenOffline && styles.primaryButtonDisabled]}
            >
              <Text style={styles.primaryButtonText}>{submitting ? 'Submitting...' : 'Submit request'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.listCard}>
          <Text style={styles.sectionTitle}>Withdrawal history</Text>

          {isScreenOffline ? (
            <OfflineState
              title='Withdrawals offline'
              message='You are offline. Connect to the internet to view your withdrawal history and submit a request.'
              onRetry={() => {
                setShowOfflineBanner(false);
                void loadData();
              }}
            />
          ) : loading ? (
            <Text style={styles.metaText}>Loading withdrawals...</Text>
          ) : requests.length === 0 ? (
            <Text style={styles.metaText}>No withdrawals yet.</Text>
          ) : (
            <View style={styles.listWrap}>
              {requests.map((request) => {
                const statusTone = getStatusTone(request.status);
                const account = request.bankAccount;

                return (
                  <View key={request.id} style={styles.requestCard}>
                    <View style={styles.requestHeader}>
                      <View>
                        <Text style={styles.amountText}>₹{Number(request.amount).toLocaleString('en-IN')}</Text>
                        <Text style={styles.requestDate}>Requested: {formatDisplayDate(request.createdAt)}</Text>
                      </View>

                      <View style={[styles.statusBadge, statusTone.badge]}>
                        <Text style={[styles.statusText, statusTone.text]}>{normalizeStatus(request.status)}</Text>
                      </View>
                    </View>

                    <View style={styles.divider} />

                    <Text style={styles.requestBank}>{account?.bankName || 'Bank account'}</Text>
                    {account?.accountHolderName ? (
                      <Text style={styles.requestMeta}>Account holder: {account.accountHolderName}</Text>
                    ) : null}
                    {account?.accountNumber ? (
                      <Text style={styles.requestMeta}>Account no: •••• {account.accountNumber.slice(-4)}</Text>
                    ) : null}
                    {account?.ifscCode ? <Text style={styles.requestMeta}>IFSC: {account.ifscCode}</Text> : null}
                    {account?.branchName ? <Text style={styles.requestMeta}>Branch: {account.branchName}</Text> : null}
                    {request.requestNote ? <Text style={styles.requestMeta}>Note: {request.requestNote}</Text> : null}
                    {request.reviewedAt ? (
                      <Text style={styles.requestMeta}>Reviewed: {formatDisplayDate(request.reviewedAt)}</Text>
                    ) : null}
                    {request.adminNote ? <Text style={styles.requestMeta}>Admin note: {request.adminNote}</Text> : null}
                    {request.rejectionReason ? (
                      <View style={styles.rejectionReasonBox}>
                        <Text style={styles.rejectionReasonLabel}>Rejection reason:</Text>
                        <Text style={styles.rejectionReasonText}>{request.rejectionReason}</Text>
                      </View>
                    ) : null}
                    {request.paidAt ? <Text style={styles.requestMeta}>Paid: {formatDisplayDate(request.paidAt)}</Text> : null}
                    {request.paymentReference ? (
                      <Text style={styles.requestMeta}>Payment ref: {request.paymentReference}</Text>
                    ) : null}
                  </View>
                );
              })}

              {hasMoreRequests ? (
                <TouchableOpacity
                  activeOpacity={0.9}
                  disabled={loadingMore || isScreenOffline}
                  onPress={() => void fetchRequests(requests.length, true)}
                  style={[styles.showMoreButton, isScreenOffline && styles.showMoreButtonDisabled]}
                >
                  <Text style={styles.showMoreButtonText}>{loadingMore ? 'Loading...' : 'Show more'}</Text>
                </TouchableOpacity>
              ) : null}
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#171310',
    textTransform: 'uppercase',
  },
  errorBox: {
    marginTop: 12,
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
    marginTop: 16,
    gap: 12,
  },
  label: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.8,
    color: '#17131099',
    textTransform: 'uppercase',
  },
  fieldWrap: {
    gap: 8,
  },
  selectWrap: {
    gap: 8,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: '#1713101a',
    backgroundColor: '#ffffff',
    borderRadius: 0,
    paddingHorizontal: 12,
    paddingVertical: 14,
    minHeight: 52,
  },
  dropdownText: {
    flex: 1,
    fontSize: 15,
    color: '#171310',
    marginRight: 12,
  },
  dropdownChevron: {
    fontSize: 18,
    color: '#171310',
    fontWeight: '900',
  },
  dropdownMenu: {
    borderWidth: 2,
    borderColor: '#ffb5d2',
    backgroundColor: '#fff9fb',
    borderRadius: 0,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f7d4e7',
  },
  dropdownItemSelected: {
    backgroundColor: '#fff0f6',
  },
  dropdownItemTitle: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.4,
    color: '#171310',
    textTransform: 'uppercase',
  },
  dropdownItemMeta: {
    marginTop: 3,
    fontSize: 14,
    color: '#171310cc',
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
  textArea: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  primaryButton: {
    marginTop: 4,
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
  showMoreButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff0f6',
    borderWidth: 2,
    borderColor: '#ff9ac0',
    borderRadius: 0,
    alignItems: 'center',
  },
  showMoreButtonDisabled: {
    opacity: 0.5,
  },
  showMoreButtonText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.8,
    color: '#171310',
    textTransform: 'uppercase',
  },
  requestCard: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#ffcee1',
    borderRadius: 0,
    padding: 12,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  amountText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#171310',
  },
  requestDate: {
    marginTop: 4,
    fontSize: 12,
    color: '#171310b3',
  },
  divider: {
    height: 1,
    backgroundColor: '#f5d2e2',
    marginVertical: 10,
  },
  requestBank: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.4,
    color: '#171310',
    textTransform: 'uppercase',
  },
  requestMeta: {
    marginTop: 4,
    fontSize: 14,
    color: '#171310cc',
  },
  statusBadge: {
    borderWidth: 2,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  badgePending: {
    backgroundColor: '#fff1cf',
    borderColor: '#d97706',
  },
  badgeApproved: {
    backgroundColor: '#e8f9ef',
    borderColor: '#0f9f6e',
  },
  badgePaid: {
    backgroundColor: '#e0f2fe',
    borderColor: '#0369a1',
  },
  badgeRejected: {
    backgroundColor: '#ffe4e6',
    borderColor: '#be123c',
  },
  badgeCancelled: {
    backgroundColor: '#f3f4f6',
    borderColor: '#475569',
  },
  badgeUnderReview: {
    backgroundColor: '#f3e8ff',
    borderColor: '#7c3aed',
  },
  statusText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  badgeTextPending: {
    color: '#92400e',
  },
  badgeTextApproved: {
    color: '#065f46',
  },
  badgeTextPaid: {
    color: '#0c4a6e',
  },
  badgeTextRejected: {
    color: '#9f1239',
  },
  badgeTextCancelled: {
    color: '#334155',
  },
  badgeTextUnderReview: {
    color: '#6d28d9',
  },
  rejectionReasonBox: {
    marginTop: 8,
    backgroundColor: '#fff1f2',
    borderWidth: 2,
    borderColor: '#fecdd3',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  rejectionReasonLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.4,
    color: '#9f1239',
    textTransform: 'uppercase',
  },
  rejectionReasonText: {
    marginTop: 4,
    fontSize: 14,
    color: '#7f1d1d',
    fontWeight: '700',
  },
});

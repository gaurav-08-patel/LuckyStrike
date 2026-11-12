import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { AuthModal } from "../../components/AuthModal";
import { useAuth } from "../../context/AuthContext";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (Platform.OS === "android"
    ? "http://10.0.2.2:5000"
    : "http://localhost:5000");

const presetAmounts = [50, 250, 500, 1000, 2000];
const walletCurrencyCode = "INR";

type WalletTab = "topup" | "history";

type WalletTransaction = {
  id: number;
  user_id: number;
  type: string;
  amount: string;
  balance_after: string;
  reference_type: string | null;
  reference_id: number | null;
  created_at: string;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: walletCurrencyCode,
    maximumFractionDigits: 0,
  }).format(value);

const formatDateTime = (value?: string) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
};

export default function WalletScreen() {
  const { user, isAuthReady, isLoggedIn, setUser } = useAuth();
  const [activeTab, setActiveTab] = useState<WalletTab>("topup");
  const [selectedAmount, setSelectedAmount] = useState<number>(50);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [customAmount, setCustomAmount] = useState("");
  const [paymentMethod, setPaymentMethod] =
    useState<"netbanking">("netbanking");
  const [walletHistory, setWalletHistory] = useState<WalletTransaction[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [isTopupModalOpen, setIsTopupModalOpen] = useState(false);
  const [isProcessingTopup, setIsProcessingTopup] = useState(false);
  const [topupError, setTopupError] = useState("");

  const walletBalance = Number(user?.walletBalance ?? 0);
  const pendingWithdrawalBalance = Number(user?.pendingWithdrawalAmount ?? 0);
  const availableBalance = Math.max(
    walletBalance - pendingWithdrawalBalance,
    0,
  );

  const activeAmount = useMemo(() => {
    if (customAmount.trim()) {
      const parsed = Number(customAmount);
      if (!Number.isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }
    return selectedAmount;
  }, [customAmount, selectedAmount]);

  const formattedAmount = formatCurrency(activeAmount);

  useEffect(() => {
    if (!isAuthReady) return;

    if (!isLoggedIn || !user) {
      return;
    }
  }, [isAuthReady, isLoggedIn, user]);

  const fetchWalletHistory = async () => {
    try {
      const token = await AsyncStorage.getItem("luckyStrikeToken");
      if (!token) {
        setWalletHistory([]);
        setLoadingHistory(false);
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/wallet/transactions?limit=10&offset=0`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) throw new Error("Failed to load wallet history");

      const payload = await response.json();
      const transactions = Array.isArray(payload?.transactions)
        ? payload.transactions
        : [];
      setWalletHistory(transactions);
    } catch (error) {
      console.warn("Wallet history unavailable:", error);
      setWalletHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    void fetchWalletHistory();
  }, []);

  const handleConfirmTopup = async () => {
    const amount = Number(activeAmount);

    if (!Number.isFinite(amount) || amount < 50) {
      setTopupError("Please enter a valid amount of at least INR 50.");
      return;
    }

    try {
      setIsProcessingTopup(true);
      setTopupError("");

      const token = await AsyncStorage.getItem("luckyStrikeToken");
      if (!token) {
        setTopupError("Please log in to continue with the top-up.");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/wallet/topup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.message || "Top-up failed. Please try again.");
      }

      const updatedBalance = Number(
        payload.walletBalance ?? payload.balance ?? user?.walletBalance ?? 0,
      );
      await setUser({ ...(user ?? {}), walletBalance: updatedBalance }, token);

      const nextTransaction: WalletTransaction = {
        id: Date.now(),
        user_id: Number(user?.id ?? 0),
        type: "topup",
        amount: String(amount),
        balance_after: String(updatedBalance),
        reference_type: "topup",
        reference_id: null,
        created_at: new Date().toISOString(),
      };

      setWalletHistory((current) => [nextTransaction, ...current]);
      setSelectedAmount(50);
      setCustomAmount("");
      setIsTopupModalOpen(false);
      Alert.alert(
        "Top-up successful",
        `Wallet topped up with ${formattedAmount}.`,
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Something went wrong while processing the top-up.";
      setTopupError(message);
    } finally {
      setIsProcessingTopup(false);
    }
  };

  if (!isAuthReady) {
    return (
      <View style={styles.screen}>
        <View style={styles.loginRequiredCard}>
          <Text style={styles.loginRequiredTitle}>Loading...</Text>
        </View>
      </View>
    );
  }

  if (!isLoggedIn || !user) {
    return (
      <>
        <View style={styles.screen}>
          <View style={styles.loginRequiredCard}>
            <View style={styles.lockBadge}>
              <Text style={styles.lockBadgeText}>Locked</Text>
            </View>

            <Text style={styles.loginRequiredTitle}>Unlock your wallet</Text>
            <Text style={styles.loginRequiredText}>
              Sign in to check your balance, add funds, and track every wallet transaction in one place.
            </Text>

            <View style={styles.featureList}>
              <View style={styles.featureRow}>
                <Text style={styles.featureDot}>•</Text>
                <Text style={styles.featureText}>View balance and payout status</Text>
              </View>
              <View style={styles.featureRow}>
                <Text style={styles.featureDot}>•</Text>
                <Text style={styles.featureText}>Top up instantly with secure payment</Text>
              </View>
              <View style={styles.featureRow}>
                <Text style={styles.featureDot}>•</Text>
                <Text style={styles.featureText}>Track every transaction in your history</Text>
              </View>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.primaryLoginButton}
                onPress={() => setIsAuthModalOpen(true)}
              >
                <Text style={styles.primaryLoginButtonText}>Login / Signup</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      </>
    );
  }

  return (
    <>
      <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          <Text style={styles.pageTitle}>Wallet</Text>

          <View style={styles.tabBar}>
            {[
              { key: "topup", label: "Top up" },
              { key: "history", label: "Wallet History" },
            ].map((tab) => {
              const selected = activeTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  activeOpacity={0.9}
                  onPress={() => setActiveTab(tab.key as WalletTab)}
                  style={[styles.tabButton, selected && styles.tabButtonActive]}
                >
                  <Text
                    style={[styles.tabText, selected && styles.tabTextActive]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Wallet balance</Text>
          <View style={styles.balanceRow}>
            <Text style={styles.currencyText}>{walletCurrencyCode}</Text>
            <Text style={styles.balanceText}>
              {formatCurrency(walletBalance)
                .replace(walletCurrencyCode, "")
                .trim()}
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Total balance</Text>
            <Text style={styles.statValue}>
              {formatCurrency(walletBalance)}
            </Text>
          </View>

          <View style={[styles.statBox, styles.statBoxAlt]}>
            <Text style={styles.statLabel}>Pending</Text>
            <Text style={styles.statValue}>
              {formatCurrency(pendingWithdrawalBalance)}
            </Text>
          </View>

          <View style={[styles.statBox, styles.statBoxSoft]}>
            <Text style={styles.statLabel}>Available</Text>
            <Text style={styles.statValue}>
              {formatCurrency(availableBalance)}
            </Text>
          </View>
        </View>

        <View style={styles.panel}>
          {activeTab === "topup" ? (
            <View style={styles.topupGrid}>
              <View style={styles.cardSection}>
                <Text style={styles.sectionTitle}>Select top-up amount</Text>

                <View style={styles.amountGrid}>
                  {presetAmounts.map((amount) => {
                    const isSelected =
                      !customAmount && selectedAmount === amount;
                    return (
                      <TouchableOpacity
                        key={amount}
                        activeOpacity={0.85}
                        onPress={() => {
                          setSelectedAmount(amount);
                          setCustomAmount("");
                        }}
                        style={[
                          styles.amountButton,
                          isSelected && styles.amountButtonActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.amountButtonText,
                            isSelected && styles.amountButtonTextActive,
                          ]}
                        >
                          {walletCurrencyCode} {amount.toLocaleString("en-IN")}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={styles.inputLabel}>
                  or enter an amount (Min INR 50)
                </Text>
                <TextInput
                  value={customAmount}
                  onChangeText={(value) => {
                    setCustomAmount(value);
                    if (value.trim()) {
                      setSelectedAmount(50);
                    }
                  }}
                  keyboardType="numeric"
                  placeholder="Enter amount"
                  placeholderTextColor="#17131066"
                  style={styles.input}
                />
              </View>

              <View style={styles.cardSection}>
                <Text style={styles.sectionTitle}>Payment method</Text>

                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => setPaymentMethod("netbanking")}
                  style={[
                    styles.paymentCard,
                    paymentMethod === "netbanking" && styles.paymentCardActive,
                  ]}
                >
                  <View style={styles.paymentLeft}>
                    <Text style={styles.paymentTitle}>
                      Netbanking / Online Banking
                    </Text>
                    <Text style={styles.paymentSubtitle}>
                      Bank transfer, UPI and secure online payment gateway
                    </Text>
                  </View>
                  <View style={styles.paymentCheckBox}>
                    <Text style={styles.paymentCheckText}>
                      {paymentMethod === "netbanking" ? "✓" : "+"}
                    </Text>
                  </View>
                </TouchableOpacity>

                <View style={styles.summaryBox}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Available balance</Text>
                    <Text style={styles.summaryValue}>
                      {formatCurrency(availableBalance)}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Pending withdrawal</Text>
                    <Text style={styles.summaryValue}>
                      {formatCurrency(pendingWithdrawalBalance)}
                    </Text>
                  </View>
                  <View style={styles.summaryRowStrong}>
                    <Text style={styles.summaryLabelStrong}>Top-up</Text>
                    <Text style={styles.summaryValueStrong}>
                      {formattedAmount}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => {
                    setTopupError("");
                    setIsTopupModalOpen(true);
                  }}
                  style={styles.payButton}
                >
                  <Text style={styles.payButtonText}>Pay Now</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.historyWrap}>
              <View style={styles.historyHeader}>
                <Text style={styles.sectionTitle}>Wallet history</Text>
                <View style={styles.historyBadge}>
                  <Text style={styles.historyBadgeText}>
                    {loadingHistory
                      ? "Loading..."
                      : `${walletHistory.length} entries`}
                  </Text>
                </View>
              </View>

              {loadingHistory ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>
                    Loading wallet history...
                  </Text>
                </View>
              ) : walletHistory.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No transactions yet</Text>
                </View>
              ) : (
                <View style={styles.historyList}>
                  {walletHistory.map((transaction) => {
                    const amountValue = Number(transaction.amount || 0);
                    const balanceAfterValue = Number(
                      transaction.balance_after || 0,
                    );
                    const referenceValue =
                      transaction.reference_id !== null &&
                      transaction.reference_type
                        ? `${transaction.reference_type} #${transaction.reference_id}`
                        : transaction.reference_type || "N/A";
                    const displayType =
                      transaction.type === "topup"
                        ? "Top-up"
                        : transaction.type === "prize_credit"
                          ? "Prize credit"
                          : transaction.type.replace(/_/g, " ");

                    return (
                      <View key={transaction.id} style={styles.historyItem}>
                        <Text style={styles.historyDate}>
                          {formatDateTime(transaction.created_at)}
                        </Text>
                        <View style={styles.historyMetaRow}>
                          <Text style={styles.historyType}>{displayType}</Text>
                          <Text style={styles.historyReference}>
                            {referenceValue}
                          </Text>
                        </View>
                        <View style={styles.historyMetaRow}>
                          <Text style={styles.historyBalance}>
                            Balance after: {formatCurrency(balanceAfterValue)}
                          </Text>
                          <Text
                            style={[
                              styles.historyAmount,
                              amountValue >= 0
                                ? styles.positiveAmount
                                : styles.negativeAmount,
                            ]}
                          >
                            {amountValue >= 0 ? "+" : "-"}
                            {formatCurrency(Math.abs(amountValue))}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        transparent
        visible={isTopupModalOpen}
        animationType="fade"
        onRequestClose={() => setIsTopupModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalEyebrow}>Confirm top-up</Text>
                <Text style={styles.modalAmount}>{formattedAmount}</Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  setIsTopupModalOpen(false);
                  setTopupError("");
                }}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalNotice}>
              <Text style={styles.modalNoticeText}>
                This top-up is only for development purposes. It will be
                replaced later with a real payment gateway integration.
              </Text>
            </View>

            {topupError ? (
              <Text style={styles.modalError}>{topupError}</Text>
            ) : null}

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => {
                  setIsTopupModalOpen(false);
                  setTopupError("");
                }}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => void handleConfirmTopup()}
                disabled={isProcessingTopup}
                style={[
                  styles.confirmButton,
                  isProcessingTopup && styles.confirmButtonDisabled,
                ]}
              >
                <Text style={styles.confirmButtonText}>
                  {isProcessingTopup ? "Processing..." : "Confirm"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f9f5f0",
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 36,
  },
  topRow: {
    flexDirection: "column",
    gap: 10,
    marginBottom: 10,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "900",
    textTransform: "uppercase",
    color: "#171310",
    letterSpacing: -0.8,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#f1efed",
    borderWidth: 3,
    borderColor: "#171310",
    borderRadius: 16,
    padding: 4,
    shadowColor: "#171310",
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  tabButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  tabButtonActive: {
    backgroundColor: "#2d59f3",
    borderWidth: 2,
    borderColor: "#171310",
  },
  tabText: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: "#171310",
  },
  tabTextActive: {
    color: "#fff",
  },
  balanceCard: {
    backgroundColor: "#ff3c8c",
    borderWidth: 3,
    borderColor: "#171310",
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 16,
    shadowColor: "#171310",
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
    minHeight: 100,
    justifyContent: "center",
  },
  balanceLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.8)",
  },
  balanceRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
  },
  currencyText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#fff",
  },
  balanceText: {
    fontSize: 30,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -1,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 6,
    marginTop: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 3,
    borderColor: "#171310",
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 8,
    minHeight: 60,
    justifyContent: "center",
    shadowColor: "#171310",
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  statBoxAlt: {
    backgroundColor: "#fff7dc",
  },
  statBoxSoft: {
    backgroundColor: "#eafaf3",
  },
  statLabel: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "#17131099",
  },
  statValue: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "900",
    color: "#171310",
    textAlign: "left",
  },
  panel: {
    marginTop: 14,

    minHeight: 420,
  },
  topupGrid: {
    gap: 12,
  },
  cardSection: {
    backgroundColor: "#f8f8f8",
    borderWidth: 3,
    borderColor: "#171310",
    borderRadius: 18,
    padding: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    textTransform: "uppercase",
    color: "#171310",
    letterSpacing: -0.5,
  },
  amountGrid: {
    marginTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  amountButton: {
    width: "30%",
    borderWidth: 3,
    borderColor: "#d7d2cf",
    borderRadius: 14,
    backgroundColor: "#fff",
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#171310",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  amountButtonActive: {
    borderColor: "#2d59f3",
    backgroundColor: "#eef3ff",
    shadowColor: "#171310",
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  amountButtonText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#171310",
    textTransform: "uppercase",
  },
  amountButtonTextActive: {
    color: "#171310",
  },
  inputLabel: {
    marginTop: 14,
    fontSize: 12,
    fontWeight: "700",
    color: "#17131099",
    fontStyle: "italic",
  },
  input: {
    marginTop: 8,
    height: 48,
    borderWidth: 3,
    borderColor: "#171310",
    borderRadius: 14,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    fontSize: 16,
    color: "#171310",
    fontWeight: "600",
  },
  paymentCard: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 3,
    borderColor: "#d7d2cf",
    borderRadius: 16,
    backgroundColor: "#fff",
    padding: 12,
  },
  paymentCardActive: {
    borderColor: "#2d59f3",
    backgroundColor: "#edf3ff",
    shadowColor: "#171310",
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  paymentLeft: {
    flex: 1,
    paddingRight: 6,
  },
  paymentTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#171310",
  },
  paymentSubtitle: {
    marginTop: 4,
    fontSize: 11,
    color: "#17131099",
    lineHeight: 15,
  },
  paymentCheckBox: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 3,
    borderColor: "#171310",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  paymentCheckText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#171310",
  },
  summaryBox: {
    marginTop: 12,
    borderWidth: 3,
    borderColor: "#171310",
    borderRadius: 14,
    backgroundColor: "#fff7dc",
    padding: 10,
    shadowColor: "#171310",
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  summaryRowStrong: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "#17131088",
  },
  summaryValue: {
    fontSize: 10,
    fontWeight: "800",
    color: "#171310",
  },
  summaryLabelStrong: {
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    color: "#171310",
  },
  summaryValueStrong: {
    fontSize: 14,
    fontWeight: "900",
    color: "#171310",
  },
  payButton: {
    marginTop: 14,
    height: 52,
    borderWidth: 3,
    borderColor: "#171310",
    borderRadius: 14,
    backgroundColor: "#ff3c8c",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#171310",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: "#fff",
  },
  historyWrap: {
    gap: 10,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  historyBadge: {
    borderWidth: 3,
    borderColor: "#171310",
    borderRadius: 999,
    backgroundColor: "#f6d857",
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  historyBadgeText: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "#171310",
  },
  emptyState: {
    minHeight: 220,
    borderWidth: 3,
    borderColor: "#171310",
    borderRadius: 16,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  emptyStateText: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: "#17131088",
    textAlign: "center",
  },
  historyList: {
    gap: 8,
  },
  historyItem: {
    borderWidth: 3,
    borderColor: "#171310",
    borderRadius: 14,
    backgroundColor: "#fff",
    padding: 12,
  },
  historyDate: {
    fontSize: 11,
    fontWeight: "800",
    color: "#171310",
  },
  historyMetaRow: {
    marginTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  historyType: {
    flex: 1,
    fontSize: 12,
    fontWeight: "900",
    color: "#171310",
    textTransform: "capitalize",
  },
  historyReference: {
    flex: 1,
    fontSize: 10,
    fontWeight: "800",
    color: "#17131088",
    textAlign: "right",
  },
  historyBalance: {
    flex: 1,
    fontSize: 10,
    fontWeight: "800",
    color: "#17131088",
  },
  loginRequiredCard: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    backgroundColor: "#fffaf7",
  },
  loginRequiredTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: "#171310",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  loginRequiredText: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 20,
    color: "#17131099",
    textAlign: "center",
  },
  loginButton: {
    marginTop: 18,
    borderWidth: 3,
    borderColor: "#171310",
    borderRadius: 14,
    backgroundColor: "#ff3c8c",
    paddingHorizontal: 18,
    paddingVertical: 12,
    shadowColor: "#171310",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
  loginButtonText: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: "#fff",
  },
  lockBadge: {
    backgroundColor: "#171310",
    borderWidth: 3,
    borderColor: "#171310",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 14,
    shadowColor: "#171310",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  },
  lockBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.8,
    textTransform: "uppercase",
  },
  featureList: {
    width: "100%",
    marginTop: 18,
    gap: 10,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 4,
  },
  featureDot: {
    fontSize: 22,
    lineHeight: 22,
    color: "#ff3c8c",
    fontWeight: "900",
  },
  featureText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: "#171310",
    fontWeight: "700",
  },
  actionRow: {
    width: "100%",
    marginTop: 22,
  },
  primaryLoginButton: {
    backgroundColor: "#ff3c8c",
    borderWidth: 3,
    borderColor: "#171310",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#171310",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  },
  primaryLoginButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.8,
    textTransform: "uppercase",
  },
  historyAmount: {
    fontSize: 12,
    fontWeight: "900",
  },
  positiveAmount: {
    color: "#1b9d61",
  },
  negativeAmount: {
    color: "#d03552",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "#17131066",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 22,
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#fffaf7",
    borderWidth: 3,
    borderColor: "#171310",
    borderRadius: 22,
    padding: 18,
    shadowColor: "#171310",
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  modalEyebrow: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: "#17131088",
  },
  modalAmount: {
    marginTop: 6,
    fontSize: 32,
    fontWeight: "900",
    color: "#171310",
    letterSpacing: -1,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderWidth: 3,
    borderColor: "#171310",
    borderRadius: 17,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    fontSize: 24,
    fontWeight: "900",
    color: "#171310",
    lineHeight: 24,
  },
  modalNotice: {
    marginTop: 16,
    borderWidth: 3,
    borderColor: "#171310",
    borderRadius: 14,
    backgroundColor: "#fff7dc",
    padding: 12,
  },
  modalNoticeText: {
    fontSize: 12,
    lineHeight: 18,
    color: "#171310",
    fontWeight: "600",
  },
  modalError: {
    marginTop: 12,
    borderWidth: 2,
    borderColor: "#d03552",
    borderRadius: 10,
    backgroundColor: "#ffe8ec",
    padding: 10,
    color: "#8d1d2f",
    fontSize: 12,
    fontWeight: "700",
  },
  modalActionRow: {
    marginTop: 18,
    flexDirection: "row",
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 3,
    borderColor: "#171310",
    borderRadius: 12,
    backgroundColor: "#fff",
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: "#171310",
  },
  confirmButton: {
    flex: 1,
    borderWidth: 3,
    borderColor: "#171310",
    borderRadius: 12,
    backgroundColor: "#ff3c8c",
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmButtonDisabled: {
    opacity: 0.7,
  },
  confirmButtonText: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: "#fff",
  },
});

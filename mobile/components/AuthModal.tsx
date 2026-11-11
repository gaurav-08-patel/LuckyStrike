import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useAuth } from "../context/AuthContext";

const countryCodes = [
  { label: "India (+91)", value: "+91" },
  { label: "United States (+1)", value: "+1" },
  { label: "United Kingdom (+44)", value: "+44" },
  { label: "UAE (+971)", value: "+971" },
  { label: "Australia (+61)", value: "+61" },
  { label: "Germany (+49)", value: "+49" },
  { label: "France (+33)", value: "+33" },
  { label: "Spain (+34)", value: "+34" },
  { label: "Italy (+39)", value: "+39" },
  { label: "Netherlands (+31)", value: "+31" },
  { label: "Singapore (+65)", value: "+65" },
  { label: "Malaysia (+60)", value: "+60" },
  { label: "Pakistan (+92)", value: "+92" },
  { label: "Bangladesh (+880)", value: "+880" },
  { label: "Sri Lanka (+94)", value: "+94" },
  { label: "Nepal (+977)", value: "+977" },
  { label: "Japan (+81)", value: "+81" },
  { label: "South Korea (+82)", value: "+82" },
  { label: "Thailand (+66)", value: "+66" },
  { label: "Indonesia (+62)", value: "+62" },
  { label: "Philippines (+63)", value: "+63" },
  { label: "Vietnam (+84)", value: "+84" },
  { label: "Brazil (+55)", value: "+55" },
  { label: "Argentina (+54)", value: "+54" },
  { label: "Mexico (+52)", value: "+52" },
  { label: "South Africa (+27)", value: "+27" },
  { label: "Egypt (+20)", value: "+20" },
  { label: "Nigeria (+234)", value: "+234" },
  { label: "Kenya (+254)", value: "+254" },
  { label: "Saudi Arabia (+966)", value: "+966" },
  { label: "Qatar (+974)", value: "+974" },
  { label: "Turkey (+90)", value: "+90" },
  { label: "Greece (+30)", value: "+30" },
  { label: "Portugal (+351)", value: "+351" },
  { label: "Sweden (+46)", value: "+46" },
  { label: "Norway (+47)", value: "+47" },
  { label: "Finland (+358)", value: "+358" },
  { label: "Denmark (+45)", value: "+45" },
  { label: "Belgium (+32)", value: "+32" },
  { label: "Switzerland (+41)", value: "+41" },
  { label: "Austria (+43)", value: "+43" },
  { label: "Ireland (+353)", value: "+353" },
  { label: "New Zealand (+64)", value: "+64" },
];

type AuthModalProps = {
  isOpen: boolean;
  onClose: () => void;
  redirectAfterLogin?: string;
};

const DEFAULT_API_URL =
  Platform.OS === "android" ? "http://10.0.2.2:5000" : "http://localhost:5000";
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL;

export function AuthModal({
  isOpen,
  onClose,
  redirectAfterLogin,
}: AuthModalProps) {
  const router = useRouter();
  const { setUser } = useAuth();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCountdown, setResendCountdown] = useState(52);
  const [previewOtp, setPreviewOtp] = useState<string | null>(null);
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setStep("phone");
      setOtp("");
      setError("");
      setLoading(false);
      setResendCountdown(52);
      setPreviewOtp(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (step !== "otp" || resendCountdown <= 0) return;

    const timer = setTimeout(() => {
      setResendCountdown((current) => current - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [step, resendCountdown]);

  const fullPhone = useMemo(
    () => `${countryCode}${phoneNumber.replace(/\D/g, "")}`,
    [countryCode, phoneNumber],
  );

  const requestOtp = async () => {
    const cleanPhone = phoneNumber.replace(/\D/g, "");

    if (!cleanPhone || cleanPhone.length < 8) {
      setError("Please enter a valid phone number.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: fullPhone }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to send OTP.");
      }

      setStep("otp");
      setResendCountdown(52);
      setPreviewOtp(data?.otp ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCountdown > 0) return;
    await requestOtp();
  };

  const verifyOtp = async () => {
    if (otp.length !== 6) {
      setError("Please enter the 6-digit OTP.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login-signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: fullPhone, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "OTP verification failed.");
      }

      await setUser(data.user, data.token ?? null);
      onClose();

      if (redirectAfterLogin) {
        router.push(redirectAfterLogin as any);
        return;
      }

      if (data.redirectUrl) {
        router.push(data.redirectUrl as any);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.keyboardView}
        >
          <Pressable style={styles.modalCard} onPress={() => undefined}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>

            <View style={styles.hero}>
              <Text style={styles.heroTitle}>SIGN-UP NOW</Text>
              <Text style={styles.heroSubtitle}>GET A ENTRY TO</Text>
              <View style={styles.prizeBox}>
                <Text style={styles.prizeText}>WIN ₹10,000</Text>
              </View>
              <Text style={styles.heroOffer}>LIMITED TIME OFFER</Text>
            </View>

            {step === "phone" ? (
              <View style={styles.panel}>
                <Text style={styles.panelTitle}>ENTER MOBILE NO.</Text>

                <View style={styles.phoneRow}>
                  <TouchableOpacity
                    style={styles.countrySelect}
                    onPress={() => setCountryPickerVisible(true)}
                  >
                    <Text style={styles.countrySelectText}>{countryCode}</Text>
                  </TouchableOpacity>

                  <TextInput
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    placeholder="Mobile Number"
                    placeholderTextColor="#17131066"
                    keyboardType="phone-pad"
                    style={styles.phoneInput}
                  />
                </View>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={requestOtp}
                  disabled={loading}
                >
                  <Text style={styles.primaryButtonText}>
                    {loading ? "SENDING..." : "SEND OTP"}
                  </Text>
                </TouchableOpacity>

                <Text style={styles.disclaimerText}>
                  <Text style={styles.disclaimerAccent}>*</Text>Offer valid for
                  new users. Existing users will be logged in normally.
                </Text>
              </View>
            ) : (
              <View style={styles.panel}>
                <Text style={styles.otpLabel}>
                  Enter the 8 digit OTP sent to
                </Text>
                <Text style={styles.phoneDisplay}>
                  +{fullPhone.replace(/\D/g, "")}
                </Text>

                {previewOtp ? (
                  <View style={styles.previewBox}>
                    <Text style={styles.previewTitle}>DEV OTP (preview)</Text>
                    <Text style={styles.previewOtp}>{previewOtp}</Text>
                  </View>
                ) : null}

                <TextInput
                  value={otp}
                  onChangeText={setOtp}
                  placeholder="Enter OTP"
                  placeholderTextColor="#17131066"
                  keyboardType="number-pad"
                  maxLength={6}
                  style={styles.otpInput}
                />

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={verifyOtp}
                  disabled={loading}
                >
                  <Text style={styles.primaryButtonText}>
                    {loading ? "VERIFYING..." : "VERIFY OTP"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.resendButton}
                  onPress={handleResendOtp}
                  disabled={resendCountdown > 0}
                >
                  <Text
                    style={[
                      styles.resendButtonText,
                      resendCountdown > 0 && styles.resendButtonTextDisabled,
                    ]}
                  >
                    {resendCountdown > 0
                      ? `Resend OTP in ${resendCountdown}s`
                      : "Resend OTP"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>

      <Modal
        visible={countryPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCountryPickerVisible(false)}
      >
        <Pressable
          style={styles.overlay}
          onPress={() => setCountryPickerVisible(false)}
        >
          <Pressable style={styles.countryPickerCard} onPress={() => undefined}>
            <Text style={styles.countryPickerTitle}>Select country code</Text>
            <ScrollView
              style={styles.countryList}
              contentContainerStyle={styles.countryListContent}
            >
              {countryCodes.map((country) => (
                <TouchableOpacity
                  key={country.value}
                  style={[
                    styles.countryOption,
                    countryCode === country.value &&
                      styles.countryOptionSelected,
                  ]}
                  onPress={() => {
                    setCountryCode(country.value);
                    setCountryPickerVisible(false);
                  }}
                >
                  <Text style={styles.countryOptionText}>{country.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(23, 19, 16, 0.35)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  keyboardView: {
    width: "100%",
    maxWidth: 620,
    alignItems: "center",
  },
  modalCard: {
    position: "relative",
    width: "100%",
    maxWidth: 620,
    backgroundColor: "#e8e8e8",
    borderWidth: 3,
    borderColor: "#171310",
    borderRadius: 30,
    padding: 12,
    shadowColor: "#171310",
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 12,
  },
  closeButton: {
    position: "absolute",
    top: -14,
    right: -8,
    zIndex: 10,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#f7f7f7",
    borderWidth: 3,
    borderColor: "#171310",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#171310",
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  },
  closeButtonText: {
    fontSize: 28,
    color: "#171310",
    fontWeight: "900",
    lineHeight: 28,
  },
  hero: {
    backgroundColor: "#ff2d78",
    borderWidth: 3,
    borderColor: "#171310",
    borderRadius: 30,
    paddingVertical: 20,
    paddingHorizontal: 18,
    alignItems: "center",
    shadowColor: "#171310",
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -1,
    textTransform: "uppercase",
  },
  heroSubtitle: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: "900",
    color: "#fff",
    opacity: 0.95,
    textTransform: "uppercase",
  },
  prizeBox: {
    marginTop: 12,
    backgroundColor: "#171310",
    borderWidth: 3,
    borderColor: "#171310",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: "#171310",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
  prizeText: {
    fontSize: 28,
    fontWeight: "900",
    color: "#fff",
    textTransform: "uppercase",
  },
  heroOffer: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  panel: {
    marginTop: 18,
    backgroundColor: "#dfe0e0",
    borderWidth: 3,
    borderColor: "#171310",
    borderRadius: 26,
    padding: 16,
  },
  panelTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#171310",
    textTransform: "uppercase",
    textAlign: "center",
    letterSpacing: -0.5,
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 18,
  },
  countrySelect: {
    width: 84,
    height: 54,
    borderWidth: 3,
    borderColor: "#171310",
    borderRadius: 14,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#171310",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  countrySelectText: {
    color: "#171310",
    fontWeight: "900",
    fontSize: 15,
  },
  phoneInput: {
    flex: 1,
    height: 54,
    borderWidth: 3,
    borderColor: "#171310",
    borderRadius: 14,
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    fontSize: 17,
    color: "#171310",
    fontWeight: "700",
  },
  errorText: {
    marginTop: 10,
    color: "#ff3b30",
    fontWeight: "800",
    fontSize: 13,
  },
  primaryButton: {
    marginTop: 18,
    height: 58,
    borderWidth: 3,
    borderColor: "#171310",
    borderRadius: 16,
    backgroundColor: "#3f57d8",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#171310",
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
  primaryButtonText: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "900",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  disclaimerText: {
    marginTop: 16,
    fontSize: 12,
    color: "#171310",
    fontWeight: "700",
    textAlign: "center",
  },
  disclaimerAccent: {
    color: "#ff3b30",
  },
  otpLabel: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "800",
    color: "#171310",
  },
  phoneDisplay: {
    marginTop: 8,
    textAlign: "center",
    fontSize: 26,
    fontWeight: "900",
    color: "#4a4ae6",
  },
  previewBox: {
    marginTop: 12,
    borderWidth: 2,
    borderColor: "#171310",
    borderRadius: 12,
    backgroundColor: "#fff",
    padding: 12,
    alignItems: "center",
  },
  previewTitle: {
    color: "#171310",
    fontWeight: "800",
    fontSize: 12,
  },
  previewOtp: {
    marginTop: 4,
    fontSize: 24,
    letterSpacing: 3,
    fontWeight: "900",
    color: "#171310",
  },
  otpInput: {
    marginTop: 16,
    height: 58,
    borderWidth: 3,
    borderColor: "#171310",
    borderRadius: 16,
    backgroundColor: "#f7f7f7",
    paddingHorizontal: 14,
    fontSize: 20,
    color: "#171310",
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 2,
  },
  resendButton: {
    marginTop: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  resendButtonText: {
    color: "#171310",
    fontWeight: "900",
    fontSize: 12,
    textTransform: "uppercase",
  },
  resendButtonTextDisabled: {
    opacity: 0.5,
  },
  countryPickerCard: {
    width: "92%",
    maxWidth: 420,
    maxHeight: "70%",
    backgroundColor: "#fff",
    borderWidth: 3,
    borderColor: "#171310",
    borderRadius: 24,
    padding: 12,
    shadowColor: "#171310",
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 10,
  },
  countryPickerTitle: {
    fontSize: 18,
    color: "#171310",
    fontWeight: "900",
    textTransform: "uppercase",
    textAlign: "center",
    marginBottom: 10,
  },
  countryList: {
    maxHeight: 360,
  },
  countryListContent: {
    paddingBottom: 6,
  },
  countryOption: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#17131022",
  },
  countryOptionSelected: {
    backgroundColor: "#ffe3ef",
  },
  countryOptionText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#171310",
  },
});

export default AuthModal;

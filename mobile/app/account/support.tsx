import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { toast } from '../../components/Toast';

export default function SupportScreen() {
  const router = useRouter();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmedSubject = subject.trim();
    const trimmedMessage = message.trim();

    if (!trimmedSubject || !trimmedMessage) {
      toast.error('Missing details', 'Please add both a subject and a message.');
      return;
    }

    setIsSubmitting(true);

    try {
      setSubject('');
      setMessage('');
      toast.success('Submitted successfully', 'Your support request has been sent.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.contentContainer}>
      <View style={styles.topRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name='arrow-back' size={22} color='#171310' />
        </TouchableOpacity>
        <Text style={styles.heading}>Support</Text>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>Contact support</Text>

        <View style={styles.fieldGroup}>
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Subject</Text>
            <TextInput
              value={subject}
              onChangeText={setSubject}
              placeholder='Subject'
              style={styles.input}
              editable={!isSubmitting}
            />
          </View>

          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Message</Text>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder='Tell us what you need help with'
              multiline
              style={[styles.input, styles.textArea]}
              editable={!isSubmitting}
            />
          </View>

          <TouchableOpacity
            activeOpacity={0.9}
            style={[styles.primaryButton, isSubmitting && styles.primaryButtonDisabled]}
            onPress={() => void handleSubmit()}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <View style={styles.buttonLoadingRow}>
                <ActivityIndicator size='small' color='#ffffff' />
                <Text style={styles.primaryButtonText}>Sending...</Text>
              </View>
            ) : (
              <Text style={styles.primaryButtonText}>Send request</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.sectionTitle}>Need help fast?</Text>
        <Text style={styles.infoText}>Reach out via the main app support flow or use the WhatsApp support option for urgent help.</Text>
      </View>
    </ScrollView>
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
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#171310',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
    borderRadius: 0,
  },
  heading: {
    fontSize: 28,
    fontWeight: '900',
    color: '#171310',
    textTransform: 'uppercase',
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
  fieldGroup: {
    marginTop: 16,
    gap: 12,
  },
  fieldWrap: {
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    color: '#171310',
    textTransform: 'uppercase',
    letterSpacing: 1,
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
    minHeight: 120,
    textAlignVertical: 'top',
  },
  primaryButton: {
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
    opacity: 0.7,
  },
  buttonLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  primaryButtonText: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.8,
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  infoCard: {
    marginTop: 24,
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
  infoText: {
    marginTop: 8,
    fontSize: 14,
    color: '#171310b3',
    lineHeight: 20,
  },
});

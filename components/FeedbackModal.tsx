import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../app/lib/supabase';

const CATEGORIES = [
  { key: 'bug',     label: '🐛 Bug',     },
  { key: 'feature', label: '💡 Feature', },
  { key: 'general', label: '👍 General', },
];

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function FeedbackModal({ visible, onClose }: Props) {
  const [category, setCategory] = useState('general');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const reset = () => {
    setCategory('general');
    setMessage('');
    setLoading(false);
    setSubmitted(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('feedback').insert({
        user_id: user?.id ?? null,
        category,
        message: message.trim(),
      });

      if (error) throw error;

      // Fire-and-forget email notification — don't block on it
      supabase.functions.invoke('send-feedback', {
        body: {
          category,
          message: message.trim(),
          userEmail: user?.email ?? null,
          userId: user?.id ?? null,
        },
      }).catch(() => {});

      setSubmitted(true);
      setTimeout(() => {
        handleClose();
      }, 1800);
    } catch (err) {
      console.error('Feedback error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />

        <View style={styles.sheet}>
          {submitted ? (
            <View style={styles.successContainer}>
              <Text style={styles.successEmoji}>🙏</Text>
              <Text style={styles.successTitle}>Thanks for your feedback!</Text>
              <Text style={styles.successSub}>We read every message.</Text>
            </View>
          ) : (
            <>
              <View style={styles.header}>
                <Text style={styles.title}>Send Feedback</Text>
                <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                  <Text style={styles.closeText}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.sectionLabel}>CATEGORY</Text>
              <View style={styles.chips}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat.key}
                    style={[styles.chip, category === cat.key && styles.chipActive]}
                    onPress={() => setCategory(cat.key)}
                  >
                    <Text style={[styles.chipText, category === cat.key && styles.chipTextActive]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.sectionLabel}>MESSAGE</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Tell us what's on your mind…"
                placeholderTextColor="#555"
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                autoFocus
              />

              <TouchableOpacity
                style={[styles.submitButton, (!message.trim() || loading) && styles.submitDisabled]}
                onPress={handleSubmit}
                disabled={!message.trim() || loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.submitText}>Send Feedback</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  closeText: {
    color: '#8E8E93',
    fontSize: 18,
  },
  sectionLabel: {
    color: '#8E8E93',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 10,
  },
  chips: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#2C2C2E',
    borderWidth: 1,
    borderColor: '#3C3C3E',
  },
  chipActive: {
    backgroundColor: '#FF6B3520',
    borderColor: '#FF6B35',
  },
  chipText: {
    color: '#8E8E93',
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#FF6B35',
  },
  textInput: {
    backgroundColor: '#2C2C2E',
    borderRadius: 10,
    padding: 14,
    color: '#FFF',
    fontSize: 15,
    minHeight: 120,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#3C3C3E',
  },
  submitButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  submitDisabled: {
    opacity: 0.4,
  },
  submitText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  successEmoji: {
    fontSize: 52,
    marginBottom: 16,
  },
  successTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  successSub: {
    color: '#8E8E93',
    fontSize: 15,
  },
});

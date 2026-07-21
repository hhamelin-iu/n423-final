import { View, Text, StyleSheet, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useState } from 'react';

import { useTheme } from '../styles/theme';
import { useDevice } from '../app/device-context';

import Footer from '../components/Footer';
import AnimatedButton from '../components/AnimatedButton';
import { useAlert } from '../src/context/AlertContext';

export default function ContactScreen() {
  const { isDesktopWeb } = useDevice();
  const { colors, styles: themeStyles } = useTheme();
  const { showAlert } = useAlert();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const handleSubmit = async () => {
    setError('');
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError('Please fill in all fields before sending.');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setSubmitted(true);
    await showAlert('Message Sent!', 'Thank you for reaching out. We will get back to you soon!', 'success');
    setName('');
    setEmail('');
    setMessage('');
  };

  const styles = StyleSheet.create({
    formWrap: {
      width: '100%',
      maxWidth: 640,
      alignSelf: 'center',
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 20,
      padding: 28,
      gap: 16,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 4,
      marginTop: isDesktopWeb ? 10 : 0,
    },
    label: {
      fontWeight: '700',
      fontSize: 15,
      color: colors.text,
      marginBottom: -4,
    },
    input: {
      width: '100%',
      padding: 12,
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 12,
      fontSize: 15,
      borderWidth: 1,
      borderColor: colors.border,
      color: colors.text,
    },
    inputFocused: {
      borderColor: colors.primary,
      backgroundColor: colors.surface,
      ...Platform.select({
        web: {
          outlineStyle: 'none',
          boxShadow: `0 0 0 3px ${colors.badgeBorder}`,
        },
      }),
    },
    textarea: {
      minHeight: 120,
      textAlignVertical: 'top',
    },
    errorText: {
      color: '#EF4444',
      fontWeight: '600',
      fontSize: 14,
    },
    successText: {
      color: '#10B981',
      fontWeight: '600',
      fontSize: 15,
    },
  });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={themeStyles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={themeStyles.mainContainer}>
          <Text style={[themeStyles.title, { textAlign: 'center' }]}>Reach Out To Us!</Text>

          <View style={styles.formWrap}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              value={name}
              onChangeText={(t) => {
                setName(t);
                setError('');
                setSubmitted(false);
              }}
              onFocus={() => setFocusedField('name')}
              onBlur={() => setFocusedField(null)}
              placeholder="Your Name"
              placeholderTextColor={colors.textLight}
              returnKeyType="next"
              style={[styles.input, focusedField === 'name' && styles.inputFocused]}
            />

            <Text style={styles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                setError('');
                setSubmitted(false);
              }}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              placeholder="user@example.com"
              placeholderTextColor={colors.textLight}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
              style={[styles.input, focusedField === 'email' && styles.inputFocused]}
            />

            <Text style={styles.label}>Message</Text>
            <TextInput
              value={message}
              onChangeText={(t) => {
                setMessage(t);
                setError('');
                setSubmitted(false);
              }}
              onFocus={() => setFocusedField('message')}
              onBlur={() => setFocusedField(null)}
              placeholder="Your Message..."
              placeholderTextColor={colors.textLight}
              multiline
              style={[styles.input, styles.textarea, focusedField === 'message' && styles.inputFocused]}
            />

            {!!error && <Text style={styles.errorText}>{error}</Text>}
            {submitted && <Text style={styles.successText}>✓ Message received!</Text>}

            <AnimatedButton title="Send Message" onPress={handleSubmit} />
          </View>
        </View>

        {isDesktopWeb && <Footer />}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}


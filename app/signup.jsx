import { View, Text, StyleSheet, ScrollView, TextInput, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../src/firebase/firebaseConfig';
import { useAuth } from '../src/auth/AuthContext';
import { isFirebaseConfigured } from '../src/services/dataService';
import { useTheme } from '../styles/theme';
import Footer from '../components/Footer';
import { useDevice } from '../app/device-context';
import AnimatedButton from '../components/AnimatedButton';

export default function SignupScreen() {
  const { isDesktopWeb } = useDevice();
  const { colors, styles: themeStyles } = useTheme();
  const router = useRouter();
  const { user, loading, signInAsDemo } = useAuth();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const hasFirebase = isFirebaseConfigured();

  useEffect(() => {
    if (user) {
      router.replace('/');
    }
  }, [user, router]);

  const goToLogin = () => {
    router.replace('/login');
  };

  const handleDemoSignup = () => {
    const cleanName = username.trim() || 'Demo Player';
    signInAsDemo({
      displayName: cleanName,
      username: cleanName.replace(/\s+/g, ''),
      email: email.trim() || 'demo@loreboards.dev',
    });
    router.replace('/');
  };

  const handleSignup = async () => {
    if (submitting || loading) return;
    setError('');

    if (!hasFirebase) {
      handleDemoSignup();
      return;
    }

    if (!username.trim() || !email.trim() || !password) {
      setError('Please enter a username, email, and password.');
      return;
    }

    try {
      setSubmitting(true);
      const cleanUsername = username.trim();
      const usernameKey = cleanUsername.toLowerCase();
      const cleanEmail = email.trim();

      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      await updateProfile(cred.user, { displayName: cleanUsername });
      await setDoc(
        doc(db, 'profiles', cred.user.uid),
        { username: cleanUsername, email: cleanEmail },
        { merge: true }
      );
      await setDoc(
        doc(db, 'usernames', usernameKey),
        { uid: cred.user.uid, email: cleanEmail, username: cleanUsername },
        { merge: true }
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const styles = StyleSheet.create({
    formWrap: {
      width: '100%',
      maxWidth: 480,
      alignSelf: 'center',
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 20,
      padding: 28,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 4,
      gap: 20,
    },
    formFields: {
      gap: 14,
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
    error: {
      color: '#EF4444',
      fontWeight: '600',
      fontSize: 14,
      marginTop: 2,
    },
    helperText: {
      marginTop: 4,
      fontSize: 14,
      color: colors.textMuted,
      textAlign: 'center',
    },
    link: {
      color: colors.primary,
      fontWeight: '700',
    },
    demoButton: {
      backgroundColor: colors.surfaceSecondary,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 16,
      alignItems: 'center',
      marginTop: 6,
    },
    demoButtonText: {
      color: colors.text,
      fontWeight: '700',
      fontSize: 14,
    },
  });

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={themeStyles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={themeStyles.mainContainer}>
          <Text style={[themeStyles.title, { textAlign: 'center' }]}>Create your Account</Text>
          <View style={styles.formWrap}>
            <View style={styles.formFields}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                value={username}
                onChangeText={setUsername}
                placeholder="Username"
                placeholderTextColor={colors.textLight}
                returnKeyType="next"
                onSubmitEditing={handleSignup}
                style={styles.input}
              />
              <Text style={styles.label}>Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="user@example.com"
                placeholderTextColor={colors.textLight}
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="next"
                onSubmitEditing={handleSignup}
                style={styles.input}
              />
              <Text style={styles.label}>Password</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                placeholderTextColor={colors.textLight}
                secureTextEntry
                returnKeyType="go"
                onSubmitEditing={handleSignup}
                style={styles.input}
              />
              {!!error && <Text style={styles.error}>{error}</Text>}

              <Pressable style={styles.demoButton} onPress={handleDemoSignup}>
                <Text style={styles.demoButtonText}>⚡ Quick Demo Access</Text>
              </Pressable>
            </View>

            <AnimatedButton
              title={submitting ? 'Creating...' : 'Create Account'}
              onPress={handleSignup}
            />

            <Text style={styles.helperText}>
              Already have an account?{' '}
              <Text style={styles.link} onPress={goToLogin}>
                Log in
              </Text>
            </Text>
          </View>
        </View>
        {isDesktopWeb && <Footer />}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

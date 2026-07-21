import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, KeyboardAvoidingView, Platform, Alert, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { auth, db } from '../src/firebase/firebaseConfig';
import { useAuth } from '../src/auth/AuthContext';
import { isFirebaseConfigured } from '../src/services/dataService';
import { useTheme } from '../styles/theme';
import Footer from '../components/Footer';
import { useDevice } from '../app/device-context';
import AnimatedButton from '../components/AnimatedButton';

export default function LoginScreen() {
  const { isDesktopWeb } = useDevice();
  const { colors, styles: themeStyles } = useTheme();
  const router = useRouter();
  const { user, loading, signInAsDemo } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const hasFirebase = isFirebaseConfigured();

  const showSweetAlert = async (titleMsg, message, type = 'info') => {
    if (Platform.OS === 'web') {
      try {
        // eslint-disable-next-line global-require
        const swal = require('sweetalert');
        await swal(titleMsg, message, type);
        return;
      } catch (err) {
        console.warn('SweetAlert login notice failed, falling back to native alert', err);
      }
    }
    Alert.alert(titleMsg, message);
  };

  useEffect(() => {
    if (user) {
      router.replace('/');
    }
  }, [user, router]);

  const goToSignup = () => {
    router.replace('/signup');
  };

  const handleDemoLogin = async () => {
    signInAsDemo();
    await showSweetAlert('Demo Mode Active', 'Welcome to LOREBoards portfolio demo!', 'success');
    router.replace('/');
  };

  const handleLogin = async () => {
    if (submitting || loading) return;
    setError('');

    if (!hasFirebase) {
      handleDemoLogin();
      return;
    }

    if (!username.trim() || !password) {
      setError('Please enter your username/email and password.');
      return;
    }

    try {
      setSubmitting(true);
      const identifier = username.trim();
      let emailToUse = identifier;

      if (!identifier.includes('@')) {
        const profileQuery = query(
          collection(db, 'profiles'),
          where('username', '==', identifier),
          limit(1)
        );
        const snap = await getDocs(profileQuery);
        if (snap.empty) {
          throw new Error('Username not found. Please check your username or try your email instead.');
        }
        const data = snap.docs[0].data();
        if (!data?.email) {
          throw new Error('Username lookup missing email. Try logging in with your email.');
        }
        emailToUse = data.email;
      }

      const credential = await signInWithEmailAndPassword(auth, emailToUse, password);
      const displayName =
        credential?.user?.displayName || credential?.user?.email?.split('@')[0] || 'Player';
      await showSweetAlert('Logged in', `Welcome back, ${displayName}!`, 'success');
    } catch (e) {
      if (e?.code === 'permission-denied') {
        setError('Username lookup is blocked by Firestore rules. Please log in with your email.');
      } else {
        setError(e.message);
      }
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
          <Text style={[themeStyles.title, { textAlign: 'center' }]}>Log In</Text>

          <View style={styles.formWrap}>
            <View style={styles.formFields}>
              <Text style={styles.label}>Username or Email</Text>
              <TextInput
                value={username}
                onChangeText={setUsername}
                placeholder="Username or email"
                placeholderTextColor={colors.textLight}
                autoCapitalize="none"
                returnKeyType="next"
                onSubmitEditing={handleLogin}
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
                onSubmitEditing={handleLogin}
                style={styles.input}
              />

              {!!error && <Text style={styles.error}>{error}</Text>}

              <Pressable style={styles.demoButton} onPress={handleDemoLogin}>
                <Text style={styles.demoButtonText}>⚡ Quick Demo Access</Text>
              </Pressable>
            </View>

            <AnimatedButton title={submitting ? 'Logging in...' : 'Log In'} onPress={handleLogin} />

            <Text style={styles.helperText}>
              Don't have an account?{' '}
              <Text style={styles.link} onPress={goToSignup}>
                Sign up
              </Text>
            </Text>
          </View>
        </View>
        {isDesktopWeb && <Footer />}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

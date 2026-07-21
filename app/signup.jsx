import { View, Text, StyleSheet, ScrollView, TextInput, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../src/firebase/firebaseConfig';
import { useAuth } from '../src/auth/AuthContext';
import { isFirebaseConfigured } from '../src/services/dataService';
import { useTheme } from '../styles/theme';
import Footer from "../components/Footer";
import { useDevice } from "../app/device-context";
import AnimatedButton from '../components/AnimatedButton';

export default function SignupScreen() {
    const { isDesktopWeb } = useDevice();
    const theme = useTheme();
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

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView contentContainerStyle={theme.scrollContainer} keyboardShouldPersistTaps="handled">
                <View style={theme.mainContainer}>
                    {isDesktopWeb && (
                        <Text style={[theme.title, { textAlign: "center" }]}>Create your Account</Text>
                    )}
                    <View style={styles.formWrap}>
                        <View style={styles.formFields}>
                            <Text style={styles.label}>Username</Text>
                            <TextInput
                                value={username}
                                onChangeText={setUsername}
                                placeholder="Username"
                                placeholderTextColor="rgba(0,0,0,0.5)"
                                returnKeyType="next"
                                onSubmitEditing={handleSignup}
                                style={styles.input}
                            />
                            <Text style={styles.label}>Email</Text>
                            <TextInput
                                value={email}
                                onChangeText={setEmail}
                                placeholder="user@example.com"
                                placeholderTextColor="rgba(0,0,0,0.5)"
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
                                placeholderTextColor="rgba(0,0,0,0.5)"
                                secureTextEntry
                                returnKeyType="go"
                                onSubmitEditing={handleSignup}
                                style={styles.input}
                            />
                            {!!error && <Text style={styles.error}>{error}</Text>}
                            <Text style={styles.helperText}>
                                Already have an account?{" "}
                                <Text style={styles.link} onPress={goToLogin}>Log in</Text>
                            </Text>

                            <Pressable style={styles.demoButton} onPress={handleDemoSignup}>
                                <Text style={styles.demoButtonText}>Quick Demo Access</Text>
                            </Pressable>
                        </View>
                        <AnimatedButton
                            title={submitting ? "Creating..." : "Create Account"}
                            onPress={handleSignup}
                            buttonStyle={{ backgroundColor: "#E5954E", borderColor: "#66380F", borderWidth: 2 }}
                            textStyle={{ color: "#fff" }}
                        />
                    </View>
                </View>
                {isDesktopWeb && <Footer />}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    formWrap: {
        width: "100%",
        maxWidth: 600,
        alignSelf: "center",
        backgroundColor: "#F0F0F0",
        borderWidth: 1.5,
        borderColor: "#C5C5C5",
        borderRadius: 21,
        padding: 20,
        minHeight: 620,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
        elevation: 6,
        justifyContent: "space-between",
    },
    formFields: {
        gap: 16,
    },
    demoBanner: {
        backgroundColor: "#FEF3C7",
        borderColor: "#F59E0B",
        borderWidth: 1.5,
        borderRadius: 12,
        padding: 14,
        marginBottom: 8,
    },
    demoBannerTitle: {
        fontWeight: "700",
        fontSize: 16,
        color: "#B45309",
        marginBottom: 4,
    },
    demoBannerText: {
        fontSize: 14,
        color: "#4B5563",
        lineHeight: 20,
    },
    label: {
        fontWeight: "700",
        fontSize: 20,
    },
    input: {
        width: "100%",
        padding: 12,
        backgroundColor: "#FFF",
        borderRadius: 12,
        fontSize: 18,
        borderWidth: 1,
        borderColor: "#D0D0D0",
    },
    error: {
        color: "#B00020",
        fontWeight: "600",
        marginTop: 6,
        marginBottom: 2,
    },
    helperText: {
        marginTop: 6,
        fontSize: 14,
    },
    link: {
        color: "#0066CC",
        textDecorationLine: "underline",
    },
    demoButton: {
        backgroundColor: "#E5954E",
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 16,
        alignItems: "center",
        marginTop: 6,
    },
    demoButtonText: {
        color: "#FFFFFF",
        fontWeight: "600",
        fontSize: 16,
    },
});

import { View, Text, StyleSheet, ScrollView, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useState } from 'react';

import { useTheme } from '../styles/theme';
import { useDevice } from "../app/device-context";

import Footer from "../components/Footer";
import AnimatedButton from '../components/AnimatedButton';

export default function ContactScreen() {
    const { isDesktopWeb } = useDevice();
    const theme = useTheme();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const showSweetAlert = async (titleMsg, messageStr, type = 'info') => {
        if (Platform.OS === 'web') {
            try {
                // eslint-disable-next-line global-require
                const swal = require('sweetalert');
                await swal(titleMsg, messageStr, type);
                return;
            } catch (err) {
                console.warn('SweetAlert failed', err);
            }
        }
        Alert.alert(titleMsg, messageStr);
    };

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
        await showSweetAlert('Message Sent!', 'Thank you for reaching out. We will get back to you soon!', 'success');
        setName('');
        setEmail('');
        setMessage('');
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={theme.scrollContainer} keyboardShouldPersistTaps="handled">
                <View style={theme.mainContainer}>
                    {isDesktopWeb && (
                        <Text style={[theme.title, { textAlign: "center" }]}>
                            Reach Out To Us!
                        </Text>
                    )}

                    <View style={styles.formWrap}>
                        <Text style={styles.label}>Name</Text>
                        <TextInput
                            value={name}
                            onChangeText={(t) => { setName(t); setError(''); setSubmitted(false); }}
                            placeholder="Your Name"
                            placeholderTextColor="rgba(0,0,0,0.5)"
                            returnKeyType="next"
                            style={styles.input}
                        />

                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            value={email}
                            onChangeText={(t) => { setEmail(t); setError(''); setSubmitted(false); }}
                            placeholder="user@example.com"
                            placeholderTextColor="rgba(0,0,0,0.5)"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            returnKeyType="next"
                            style={styles.input}
                        />

                        <Text style={styles.label}>Message</Text>
                        <TextInput
                            value={message}
                            onChangeText={(t) => { setMessage(t); setError(''); setSubmitted(false); }}
                            placeholder="Your Message..."
                            placeholderTextColor="rgba(0,0,0,0.5)"
                            multiline
                            style={[styles.input, styles.textarea]}
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

const styles = StyleSheet.create({
    formWrap: {
        width: "100%",
        maxWidth: 900,
        alignSelf: "center",
        backgroundColor: "#F0F0F0",
        borderWidth: 1.5,
        borderColor: "#C5C5C5",
        borderRadius: 21,
        padding: 20,
        gap: 16,
        minHeight: 520,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
        elevation: 6,
    },
    label: {
        fontWeight: "700",
        fontSize: 18,
    },
    input: {
        width: "100%",
        padding: 12,
        backgroundColor: "#FFF",
        borderRadius: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: "#D0D0D0",
    },
    textarea: {
        minHeight: 120,
        textAlignVertical: "top",
    },
    errorText: {
        color: "#DC2626",
        fontWeight: "600",
    },
    successText: {
        color: "#16A34A",
        fontWeight: "600",
        fontSize: 16,
    },
});

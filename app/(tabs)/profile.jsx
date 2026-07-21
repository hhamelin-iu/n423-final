import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

import { useDevice } from "../../app/device-context";
import { useAuth } from '../../src/auth/AuthContext';
import { db, auth } from '../../src/firebase/firebaseConfig';
import { isFirebaseConfigured } from '../../src/services/dataService';

export default function ProfileScreen() {
    const { isDesktopWeb } = useDevice();
    const router = useRouter();
    const { signOut, user, loading, isDemoMode, signInAsDemo } = useAuth();
    const [photoData, setPhotoData] = useState(null);

    useEffect(() => {
        if (isDesktopWeb) {
            router.replace('/');
        }
    }, [isDesktopWeb, router]);

    useFocusEffect(() => {
        if (!isDesktopWeb && !loading && !user) {
            router.replace('/');
            setTimeout(() => router.push('/login'), 0);
        }
    });

    useEffect(() => {
        const loadProfile = async () => {
            if (!user) {
                setPhotoData(null);
                return;
            }
            if (user.photoData) {
                setPhotoData(user.photoData);
                return;
            }
            if (isFirebaseConfigured() && db) {
                try {
                    const snap = await getDoc(doc(db, 'profiles', user.uid));
                    const data = snap.data();
                    setPhotoData(data?.photoData || user.photoURL || null);
                    return;
                } catch {
                    // ignore
                }
            }
            setPhotoData(user?.photoURL || null);
        };
        loadProfile();
    }, [user]);

    const handlePickImage = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) return;

        const result = await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            quality: 0.8,
            aspect: [1, 1],
        });
        if (result.canceled || !result.assets?.length) return;

        const uri = result.assets[0].uri;
        try {
            const manipulated = await ImageManipulator.manipulateAsync(
                uri,
                [{ resize: { width: 128 } }],
                { compress: 0.4, format: ImageManipulator.SaveFormat.JPEG, base64: true }
            );
            if (!manipulated.base64) return;
            const dataUrl = `data:image/jpeg;base64,${manipulated.base64}`;

            setPhotoData(dataUrl);

            if (isDemoMode || !isFirebaseConfigured()) {
                signInAsDemo({ photoData: dataUrl });
            } else if (auth.currentUser && db) {
                await setDoc(doc(db, 'profiles', auth.currentUser.uid), { photoData: dataUrl }, { merge: true });
                if (dataUrl.length < 1900) {
                    await updateProfile(auth.currentUser, { photoURL: dataUrl });
                }
            }
        } catch (e) {
            console.warn('Failed to update profile photo', e);
        }
    };

    if (isDesktopWeb || loading || !user) return null;

    const displayName = user.displayName || user.email?.split('@')[0] || 'User';

    return (
        <View style={styles.container}>
            <View style={styles.profileHeader}>
                <Pressable onPress={handlePickImage}>
                    {photoData
                        ? <Image source={{ uri: photoData }} style={styles.avatar} />
                        : <Ionicons name="person-circle-outline" size={72} color="#444" />}
                    <Text style={styles.changePhotoText}>Change photo</Text>
                </Pressable>
                <Text style={styles.name}>{displayName}</Text>
                {isDemoMode && (
                    <Text style={styles.demoTag}>Demo Profile</Text>
                )}
            </View>
            <View style={styles.topList}>
                <Pressable style={styles.listItem} onPress={() => router.push('/search')}>
                    <Text style={styles.listText}>View Completions</Text>
                </Pressable>
                <Pressable style={styles.listItem} onPress={() => router.push('/submit')}>
                    <Text style={styles.listText}>Submit New Game</Text>
                </Pressable>
            </View>
            <Pressable style={styles.signOutBtn} onPress={signOut}>
                <Text style={styles.signOutText}>Sign Out</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 20,
        justifyContent: 'space-between',
    },
    profileHeader: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 30,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
    },
    changePhotoText: {
        fontSize: 12,
        color: '#6366F1',
        marginTop: 4,
        textAlign: 'center',
    },
    name: {
        fontSize: 22,
        fontWeight: 'bold',
        marginTop: 10,
    },
    demoTag: {
        fontSize: 12,
        color: '#4338CA',
        backgroundColor: '#EEF2FF',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        marginTop: 6,
        overflow: 'hidden',
    },
    topList: {
        gap: 12,
    },
    listItem: {
        padding: 16,
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
    },
    listText: {
        fontSize: 16,
        fontWeight: '600',
    },
    signOutBtn: {
        padding: 16,
        backgroundColor: '#fee2e2',
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 20,
    },
    signOutText: {
        color: '#dc2626',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

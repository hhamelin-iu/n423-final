import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

import { useDevice } from '../../app/device-context';
import { useAuth } from '../../src/auth/AuthContext';
import { db, auth } from '../../src/firebase/firebaseConfig';
import { isFirebaseConfigured } from '../../src/services/dataService';
import { useTheme } from '../../styles/theme';

export default function ProfileScreen() {
  const { isDesktopWeb } = useDevice();
  const { colors } = useTheme();
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

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: 20,
      justifyContent: 'space-between',
    },
    profileHeader: {
      alignItems: 'center',
      marginTop: 20,
      marginBottom: 30,
    },
    avatar: {
      width: 84,
      height: 84,
      borderRadius: 42,
    },
    changePhotoText: {
      fontSize: 12,
      color: colors.primary,
      fontWeight: '600',
      marginTop: 6,
      textAlign: 'center',
    },
    name: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.text,
      marginTop: 10,
    },
    demoTag: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.badgeText,
      backgroundColor: colors.badgeBg,
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: 12,
      marginTop: 6,
      overflow: 'hidden',
    },
    topList: {
      gap: 12,
    },
    listItem: {
      padding: 16,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
    },
    listText: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
    },
    signOutBtn: {
      padding: 16,
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      borderWidth: 1,
      borderColor: 'rgba(239, 68, 68, 0.3)',
      borderRadius: 14,
      alignItems: 'center',
      marginBottom: 20,
    },
    signOutText: {
      color: '#EF4444',
      fontWeight: '700',
      fontSize: 15,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.profileHeader}>
        <Pressable onPress={handlePickImage}>
          {photoData ? (
            <Image source={{ uri: photoData }} style={styles.avatar} />
          ) : (
            <Ionicons name="person-circle-outline" size={84} color={colors.primary} />
          )}
          <Text style={styles.changePhotoText}>Change photo</Text>
        </Pressable>
        <Text style={styles.name}>{displayName}</Text>
        {isDemoMode && <Text style={styles.demoTag}>Demo Profile</Text>}
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

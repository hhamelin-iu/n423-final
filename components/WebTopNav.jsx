import { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, Image, Animated, Alert, Platform } from "react-native";
import { Link, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { updateProfile } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

import { useDevice } from "../app/device-context";
import { useAuth } from "../src/auth/AuthContext";
import { auth, db } from "../src/firebase/firebaseConfig";
import { isFirebaseConfigured } from "../src/services/dataService";

export default function WebTopNav() {
  const { isDesktopWeb } = useDevice();
  const { user, signOut, isDemoMode, signInAsDemo } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const rotateAnim = useMemo(() => new Animated.Value(0), []);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [profileHovering, setProfileHovering] = useState(false);

  const username = user?.displayName || user?.email?.split("@")[0] || "User";
  const photo = profilePhoto || user?.photoData || user?.photoURL || null;

  const showSweetAlert = async (titleMsg, message, type = "info") => {
    if (Platform.OS === "web") {
      try {
        // eslint-disable-next-line global-require
        const swal = require("sweetalert");
        await swal(titleMsg, message, type);
        return;
      } catch (err) {
        console.warn("SweetAlert auth notice failed, falling back to native alert", err);
      }
    }
    Alert.alert(titleMsg, message);
  };

  useEffect(() => { if (!user) setOpen(false); }, [user]);

  useEffect(() => {
    const loadProfilePhoto = async () => {
      if (!user) {
        setProfilePhoto(null);
        return;
      }
      if (user.photoData) {
        setProfilePhoto(user.photoData);
        return;
      }
      if (isFirebaseConfigured() && db) {
        try {
          const snap = await getDoc(doc(db, "profiles", user.uid));
          const data = snap.data();
          setProfilePhoto(data?.photoData || null);
          return;
        } catch {
          // ignore
        }
      }
      setProfilePhoto(null);
    };
    loadProfilePhoto();
  }, [user]);

  const toggleOpen = () => {
    const next = !open;
    setOpen(next);
    Animated.timing(rotateAnim, {
      toValue: next ? 1 : 0,
      duration: 160,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  };

  const handleNavPress = () => {
    if (!user) {
      router.push("/login");
    } else {
      toggleOpen();
    }
  };

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
      setProfilePhoto(dataUrl);

      if (isDemoMode || !isFirebaseConfigured()) {
        signInAsDemo({ photoData: dataUrl });
      } else if (auth?.currentUser && db) {
        await setDoc(doc(db, "profiles", auth.currentUser.uid), { photoData: dataUrl }, { merge: true });
        if (dataUrl.length < 1900) {
          await updateProfile(auth.currentUser, { photoURL: dataUrl });
        }
      }
    } catch (e) {
      console.warn("Failed to update profile photo", e);
    }
  };

  const handleAvatarPress = (e) => {
    e?.stopPropagation?.();
    if (user) {
      handlePickImage();
    }
  };

  const handleLogout = async () => {
    setOpen(false);
    try {
      await signOut();
      await showSweetAlert("Logged out", "See you next time!", "success");
      router.replace("/login");
    } catch (err) {
      console.warn("Logout failed", err);
      await showSweetAlert("Error", "Could not log out. Please try again.", "error");
    }
  };

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  return (
    <View style={styles.outerContainer}>
      <View style={styles.innerContainer}>
        <View style={styles.brandWrapper}>
          <Link href="/" style={styles.brandLink}>
            <Text style={styles.brandText}>LOREBoards</Text>
          </Link>
          {isDemoMode && (
            <View style={styles.topNavDemoPill}>
              <Text style={styles.topNavDemoPillText}>DEMO</Text>
            </View>
          )}
        </View>

        <View style={styles.rightCluster}>
          <Link href="/about" style={styles.navLink}>
            <Text style={styles.navLinkText}>About</Text>
          </Link>
          <Link href="/contact" style={styles.navLink}>
            <Text style={styles.navLinkText}>Contact</Text>
          </Link>
          <Link href="/search" style={styles.navLink}>
            <Text style={styles.navLinkText}>Search</Text>
          </Link>
          <Link href="/submit" style={styles.submitLink}>
            <Text style={styles.submitText}>Submit</Text>
          </Link>

          {user ? (
            <View style={styles.profileDropdownWrap}>
              <Pressable
                onPress={handleNavPress}
                style={({ hovered }) => [
                  styles.profileButton,
                  hovered && styles.profileButtonHover,
                ]}
              >
                <Pressable
                  onPress={handleAvatarPress}
                  onHoverIn={() => setProfileHovering(true)}
                  onHoverOut={() => setProfileHovering(false)}
                  style={styles.avatarWrap}
                >
                  {photo ? (
                    <Image source={{ uri: photo }} style={styles.avatarImage} />
                  ) : (
                    <Ionicons name="person-circle" size={36} color="#4F46E5" />
                  )}
                  {profileHovering && (
                    <View style={styles.avatarOverlay}>
                      <Ionicons name="camera" size={16} color="#FFF" />
                    </View>
                  )}
                </Pressable>
                <Text style={styles.usernameText} numberOfLines={1}>
                  {username}
                </Text>
                <Animated.View style={{ transform: [{ rotate: rotation }] }}>
                  <Ionicons name="chevron-down" size={18} color="#4F46E5" />
                </Animated.View>
              </Pressable>

              {open && (
                <View style={styles.dropdownMenu}>
                  <Pressable style={styles.dropdownHeader} onPress={handlePickImage}>
                    <Text style={styles.dropdownHeaderText}>Signed in as</Text>
                    <Text style={styles.dropdownHeaderName}>{username}</Text>
                    {isDemoMode && <Text style={styles.demoTag}>Demo Mode</Text>}
                    <Text style={styles.dropdownHeaderSub}>Click avatar or here to change photo</Text>
                  </Pressable>
                  <View style={styles.dropdownDivider} />
                  <Pressable style={styles.dropdownItem} onPress={() => { setOpen(false); router.push("/search"); }}>
                    <Ionicons name="search-outline" size={18} color="#374151" />
                    <Text style={styles.dropdownItemText}>Browse Completions</Text>
                  </Pressable>
                  <Pressable style={styles.dropdownItem} onPress={() => { setOpen(false); router.push("/submit"); }}>
                    <Ionicons name="add-circle-outline" size={18} color="#374151" />
                    <Text style={styles.dropdownItemText}>Submit New Game</Text>
                  </Pressable>
                  <View style={styles.dropdownDivider} />
                  <Pressable style={styles.dropdownItemDanger} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={18} color="#DC2626" />
                    <Text style={styles.dropdownItemDangerText}>Log Out</Text>
                  </Pressable>
                </View>
              )}
            </View>
          ) : (
            <Pressable style={styles.loginBtn} onPress={() => router.push("/login")}>
              <Text style={styles.loginBtnText}>Log In</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
  },
  innerContainer: {
    width: "100%",
    paddingHorizontal: 24,
    height: 70,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  brandLink: {
    textDecorationLine: "none",
    alignSelf: "center",
  },
  topNavDemoPill: {
    backgroundColor: "rgba(107, 114, 128, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(107, 114, 128, 0.22)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  topNavDemoPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6B7280",
    letterSpacing: 0.8,
  },
  brandText: {
    fontFamily: "LexendZetta_400Regular",
    fontSize: 22,
    fontWeight: "900",
    color: "#4F46E5",
    letterSpacing: -0.5,
    textAlign: "left",
  },
  rightCluster: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  navLink: {
    textDecorationLine: "none",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  navLinkText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  submitLink: {
    textDecorationLine: "none",
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#C7D2FE",
  },
  submitText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#4338CA",
  },
  profileDropdownWrap: {
    position: "relative",
  },
  profileButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 24,
    backgroundColor: "#F3F4F6",
  },
  profileButtonHover: {
    backgroundColor: "#E5E7EB",
  },
  avatarWrap: {
    position: "relative",
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  usernameText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1F2937",
    maxWidth: 120,
  },
  dropdownMenu: {
    position: "absolute",
    top: 48,
    right: 0,
    width: 240,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    paddingVertical: 8,
    zIndex: 2000,
  },
  dropdownHeader: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  dropdownHeaderText: {
    fontSize: 12,
    color: "#6B7280",
  },
  dropdownHeaderName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginTop: 2,
  },
  demoTag: {
    fontSize: 11,
    fontWeight: "600",
    color: "#4B5563",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  dropdownHeaderSub: {
    fontSize: 11,
    color: "#6366F1",
    marginTop: 4,
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginVertical: 4,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  dropdownItemText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  dropdownItemDanger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  dropdownItemDangerText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#DC2626",
  },
  loginBtn: {
    backgroundColor: "#6366F1",
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 20,
  },
  loginBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },
});

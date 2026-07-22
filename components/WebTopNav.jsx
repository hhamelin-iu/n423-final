import { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, Image, Animated, Alert, Platform, TextInput } from "react-native";
import { Link, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { updateProfile } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

import { useDevice } from "../app/device-context";
import { useAuth } from "../src/auth/AuthContext";
import { auth, db } from "../src/firebase/firebaseConfig";
import { isFirebaseConfigured } from "../src/services/dataService";
import { useTheme } from "../styles/theme";
import { useAlert } from "../src/context/AlertContext";

export default function WebTopNav() {
  const { isDesktopWeb } = useDevice();
  const { user, signOut, isDemoMode, signInAsDemo } = useAuth();
  const { mode, toggleTheme, colors, isDark } = useTheme();
  const { showAlert } = useAlert();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const rotateAnim = useMemo(() => new Animated.Value(0), []);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [profileHovering, setProfileHovering] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchHovered, setSearchHovered] = useState(false);

  const handleSearch = () => {
    const q = searchQuery.trim();
    if (q) {
      router.push(`/search?query=${encodeURIComponent(q)}`);
      setSearchQuery("");
    } else {
      router.push("/search");
    }
  };

  const username = user?.displayName || user?.email?.split("@")[0] || "User";
  const photo = profilePhoto || user?.photoData || user?.photoURL || null;

  useEffect(() => {
    if (!user) setOpen(false);
  }, [user]);

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
      useNativeDriver: Platform.OS !== "web",
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
      await showAlert("Logged out", "See you next time!", "success");
      router.replace("/login");
    } catch (err) {
      console.warn("Logout failed", err);
      await showAlert("Error", "Could not log out. Please try again.", "error");
    }
  };

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  const styles = StyleSheet.create({
    outerContainer: {
      width: "100%",
      backgroundColor: isDark ? "rgba(15, 23, 42, 0.95)" : "rgba(255, 255, 255, 0.95)",
      borderBottomWidth: 1,
      borderBottomColor: isDark ? "rgba(255, 255, 255, 0.08)" : colors.border,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 6,
      zIndex: 1000,
    },
    innerContainer: {
      width: "100%",
      maxWidth: 1320,
      marginHorizontal: "auto",
      paddingHorizontal: isDesktopWeb ? 28 : 16,
      height: 72,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 16,
    },
    brandWrapper: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    brandIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
      overflow: "hidden",
    },
    brandLink: {
      textDecorationLine: "none",
      alignSelf: "center",
    },
    brandText: {
      fontFamily: "LexendZetta_400Regular",
      fontSize: 21,
      fontWeight: "900",
      color: colors.primary,
      letterSpacing: -0.6,
      textAlign: "left",
    },
    topNavDemoPill: {
      backgroundColor: colors.badgeBg,
      borderWidth: 1,
      borderColor: colors.badgeBorder,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
    },
    topNavDemoPillText: {
      fontSize: 10,
      fontWeight: "800",
      color: colors.badgeText,
      letterSpacing: 0.8,
    },
    rightCluster: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      flexShrink: 1,
    },
    searchBarWrap: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDark ? "rgba(255, 255, 255, 0.06)" : colors.surfaceSecondary,
      borderWidth: 1.5,
      borderColor: isDark ? "rgba(255, 255, 255, 0.12)" : colors.border,
      borderRadius: 24,
      paddingHorizontal: 14,
      height: 42,
      width: isDesktopWeb ? 280 : 180,
      transition: "all 0.2s ease",
    },
    searchBarWrapHovered: {
      borderColor: colors.primary + "88",
    },
    searchBarWrapFocused: {
      borderColor: colors.primary,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.25,
      shadowRadius: 10,
      backgroundColor: isDark ? "rgba(30, 41, 59, 0.9)" : "#FFFFFF",
      width: isDesktopWeb ? 340 : 220,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      fontWeight: "500",
      color: colors.text,
      paddingVertical: 0,
      marginLeft: 8,
      outlineStyle: "none",
    },
    searchKeyBadge: {
      backgroundColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.06)",
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      marginLeft: 6,
    },
    searchKeyBadgeText: {
      fontSize: 11,
      fontWeight: "700",
      color: colors.textMuted,
    },
    searchBtn: {
      padding: 4,
      borderRadius: 12,
      marginLeft: 4,
    },
    themeToggleBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: isDark ? "rgba(255, 255, 255, 0.06)" : colors.surfaceSecondary,
      borderWidth: 1,
      borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : colors.border,
      justifyContent: "center",
      alignItems: "center",
      cursor: "pointer",
    },
    submitLinkBtn: {
      borderRadius: 22,
      overflow: "hidden",
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.25,
      shadowRadius: 6,
      elevation: 3,
    },
    submitGradient: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 22,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    submitText: {
      fontSize: 14,
      fontWeight: "700",
      color: "#FFFFFF",
      letterSpacing: -0.2,
    },
    profileDropdownWrap: {
      position: "relative",
    },
    profileButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 24,
      backgroundColor: isDark ? "rgba(255, 255, 255, 0.06)" : colors.surfaceSecondary,
      borderWidth: 1,
      borderColor: isDark ? "rgba(255, 255, 255, 0.12)" : colors.border,
    },
    profileButtonHover: {
      borderColor: colors.primary,
    },
    avatarWrap: {
      position: "relative",
      width: 34,
      height: 34,
      borderRadius: 17,
      overflow: "hidden",
      justifyContent: "center",
      alignItems: "center",
    },
    avatarImage: {
      width: 34,
      height: 34,
      borderRadius: 17,
    },
    avatarOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    usernameText: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.text,
      maxWidth: 110,
    },
    dropdownMenu: {
      position: "absolute",
      top: 52,
      right: 0,
      width: 240,
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: isDark ? "rgba(255, 255, 255, 0.12)" : colors.border,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 20,
      elevation: 12,
      paddingVertical: 8,
      zIndex: 2000,
    },
    dropdownHeader: {
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    dropdownHeaderText: {
      fontSize: 12,
      color: colors.textMuted,
    },
    dropdownHeaderName: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.text,
      marginTop: 2,
    },
    demoTag: {
      fontSize: 11,
      fontWeight: "700",
      color: colors.badgeText,
      backgroundColor: colors.badgeBg,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      alignSelf: "flex-start",
      marginTop: 4,
    },
    dropdownHeaderSub: {
      fontSize: 11,
      color: colors.primary,
      marginTop: 4,
    },
    dropdownDivider: {
      height: 1,
      backgroundColor: colors.border,
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
      color: colors.text,
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
      color: "#EF4444",
    },
    loginBtn: {
      borderRadius: 22,
      overflow: "hidden",
    },
  });

  return (
    <View style={styles.outerContainer}>
      <View style={styles.innerContainer}>
        {/* Brand & Demo badge */}
        <View style={styles.brandWrapper}>
          <Link href="/" style={styles.brandLink}>
            <Text style={styles.brandText}>LOREBoards</Text>
          </Link>
          {isDemoMode && !isFirebaseConfigured() && (
            <View style={styles.topNavDemoPill}>
              <Text style={styles.topNavDemoPillText}>DEMO</Text>
            </View>
          )}
        </View>

        {/* Right Cluster: Search, Submit, Theme, Profile */}
        <View style={styles.rightCluster}>
          {/* Sleek Search Bar */}
          <Pressable
            onHoverIn={() => setSearchHovered(true)}
            onHoverOut={() => setSearchHovered(false)}
            style={[
              styles.searchBarWrap,
              searchHovered && styles.searchBarWrapHovered,
              searchFocused && styles.searchBarWrapFocused,
            ]}
          >
            <Ionicons
              name="search-outline"
              size={18}
              color={searchFocused ? colors.primary : colors.textMuted}
            />
            <TextInput
              style={styles.searchInput}
              placeholder={isDesktopWeb ? "Search games, completions..." : "Search..."}
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {searchQuery.length > 0 ? (
              <Pressable
                onPress={() => setSearchQuery("")}
                style={styles.searchBtn}
                accessibilityLabel="Clear search"
              >
                <Ionicons name="close-circle" size={17} color={colors.textMuted} />
              </Pressable>
            ) : isDesktopWeb ? (
              <View style={styles.searchKeyBadge}>
                <Text style={styles.searchKeyBadgeText}>↵</Text>
              </View>
            ) : null}
          </Pressable>

          {/* Submit Action */}
          <Link href="/submit" style={styles.submitLinkBtn}>
            <LinearGradient
              colors={[colors.gradientMid, colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.submitGradient}
            >
              <Ionicons name="add-circle" size={17} color="#FFFFFF" />
              <Text style={styles.submitText}>Submit</Text>
            </LinearGradient>
          </Link>

          {/* Theme Toggle Button */}
          <Pressable
            onPress={toggleTheme}
            style={({ hovered }) => [
              styles.themeToggleBtn,
              hovered && { borderColor: colors.primary },
            ]}
            accessibilityLabel="Toggle Theme"
          >
            <Ionicons
              name={isDark ? "sunny" : "moon"}
              size={19}
              color={isDark ? "#FBBF24" : colors.primary}
            />
          </Pressable>

          {/* Profile Dropdown or Login */}
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
                    <Image
                      source={typeof photo === 'number' || (typeof photo === 'object' && photo?.uri) ? photo : { uri: photo }}
                      style={styles.avatarImage}
                    />
                  ) : (
                    <Ionicons name="person-circle" size={34} color={colors.primary} />
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
                  <Ionicons name="chevron-down" size={16} color={colors.primary} />
                </Animated.View>
              </Pressable>

              {open && (
                <View style={styles.dropdownMenu}>
                  <Pressable style={styles.dropdownHeader} onPress={handlePickImage}>
                    <Text style={styles.dropdownHeaderText}>Signed in as</Text>
                    <Text style={styles.dropdownHeaderName}>{username}</Text>
                    {isDemoMode && !isFirebaseConfigured() && <Text style={styles.demoTag}>Demo Mode</Text>}
                    <Text style={styles.dropdownHeaderSub}>Click avatar to change photo</Text>
                  </Pressable>
                  <View style={styles.dropdownDivider} />
                  <Pressable
                    style={styles.dropdownItem}
                    onPress={() => {
                      setOpen(false);
                      router.push("/search");
                    }}
                  >
                    <Ionicons name="search-outline" size={18} color={colors.textMuted} />
                    <Text style={styles.dropdownItemText}>Browse Completions</Text>
                  </Pressable>
                  <Pressable
                    style={styles.dropdownItem}
                    onPress={() => {
                      setOpen(false);
                      router.push("/submit");
                    }}
                  >
                    <Ionicons name="add-circle-outline" size={18} color={colors.textMuted} />
                    <Text style={styles.dropdownItemText}>Submit New Game</Text>
                  </Pressable>
                  <View style={styles.dropdownDivider} />
                  <Pressable style={styles.dropdownItemDanger} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={18} color="#EF4444" />
                    <Text style={styles.dropdownItemDangerText}>Log Out</Text>
                  </Pressable>
                </View>
              )}
            </View>
          ) : (
            <Pressable style={styles.loginBtn} onPress={() => router.push("/login")}>
              <LinearGradient
                colors={[colors.primaryDark, colors.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.submitGradient}
              >
                <Text style={styles.submitText}>Log In</Text>
              </LinearGradient>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

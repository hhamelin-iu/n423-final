import { View, Text, StyleSheet, Pressable } from "react-native";
import { Link } from "expo-router";

import { useTheme } from "../styles/theme";
import { useDevice } from "../app/device-context";

export default function Footer() {
  const { colors, isDark } = useTheme();
  const { isDesktopWeb } = useDevice();

  const style = StyleSheet.create({
    footer: {
      width: "100%",
      backgroundColor: isDark ? "#0A0E17" : "#F3F4F6",
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingVertical: isDesktopWeb ? 14 : 16,
      paddingHorizontal: 30,
    },
    container: {
      width: "100%",
      maxWidth: 1200,
      marginHorizontal: "auto",
      flexDirection: isDesktopWeb ? "row" : "column",
      justifyContent: "space-between",
      alignItems: "center",
      gap: isDesktopWeb ? 20 : 12,
    },
    navLinksContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      justifyContent: isDesktopWeb ? "flex-start" : "center",
      gap: 4,
    },
    navLinkItem: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      cursor: "pointer",
    },
    navLinkText: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.primary,
      textDecorationLine: "none",
    },
    disabledNavLinkItem: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      cursor: "not-allowed",
      opacity: 0.5,
    },
    disabledNavLinkText: {
      fontSize: 13,
      fontWeight: "500",
      color: colors.textMuted,
      textDecorationLine: "none",
    },
    divider: {
      fontSize: 13,
      color: colors.textLight,
    },
    rightText: {
      fontSize: 13,
      color: colors.textMuted,
      textAlign: isDesktopWeb ? "right" : "center",
    },
    brandName: {
      fontWeight: "800",
      color: colors.text,
    },
    tagline: {
      fontStyle: "italic",
      color: colors.gradientMid,
    },
    copyright: {
      color: colors.textMuted,
    },
    addressText: {
      color: colors.textMuted,
    },
  });

  return (
    <View style={style.footer}>
      <View style={style.container}>
        {/* Left Section: Clickable Page Navigation Links */}
        <View style={style.navLinksContainer}>
          <Link href="/about" asChild>
            <Pressable>
              {({ hovered }) => (
                <View
                  style={[
                    style.navLinkItem,
                    hovered && { backgroundColor: isDark ? "rgba(99, 102, 241, 0.18)" : colors.primaryLight },
                  ]}
                >
                  <Text style={[style.navLinkText, hovered && { textDecorationLine: "underline" }]}>
                    About
                  </Text>
                </View>
              )}
            </Pressable>
          </Link>

          <Text style={style.divider}>·</Text>

          <Link href="/contact" asChild>
            <Pressable>
              {({ hovered }) => (
                <View
                  style={[
                    style.navLinkItem,
                    hovered && { backgroundColor: isDark ? "rgba(99, 102, 241, 0.18)" : colors.primaryLight },
                  ]}
                >
                  <Text style={[style.navLinkText, hovered && { textDecorationLine: "underline" }]}>
                    Contact
                  </Text>
                </View>
              )}
            </Pressable>
          </Link>

          <Text style={style.divider}>·</Text>

          <View style={style.disabledNavLinkItem}>
            <Text style={style.disabledNavLinkText}>Privacy Policy</Text>
          </View>

          <Text style={style.divider}>·</Text>

          <View style={style.disabledNavLinkItem}>
            <Text style={style.disabledNavLinkText}>Terms of Service</Text>
          </View>
        </View>

        {/* Right Section: Brand, Tagline, Address, Phone & Copyright */}
        <Text style={style.rightText}>
          <Text style={style.brandName}>LOREBoards</Text>{" "}
          <Text style={style.tagline}>“Playing Games to Study”</Text>
          <Text style={style.divider}> · </Text>
          <Text style={style.addressText}>9876 Place Ave. IN, 20456</Text>
          <Text style={style.divider}> · </Text>
          <Text style={style.addressText}>(555) 123-2456</Text>
          <Text style={style.divider}> · </Text>
          <Text style={style.copyright}>© {new Date().getFullYear()}</Text>
        </Text>
      </View>
    </View>
  );
}

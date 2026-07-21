import { View, Text, StyleSheet } from "react-native";
import { Link } from "expo-router";

import { useDevice } from "../app/device-context";
import { useTheme } from "../styles/theme";

export default function Footer() {
  const { isDesktopWeb } = useDevice();
  const { colors } = useTheme();

  const style = StyleSheet.create({
    footer: {
      width: "100%",
      minHeight: isDesktopWeb ? 72 : "auto",
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      flexDirection: isDesktopWeb ? "row" : "column",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: isDesktopWeb ? 16 : 20,
      paddingHorizontal: 30,
      gap: 12,
    },
    left: {
      flexDirection: "row",
      gap: 24,
      alignItems: "center",
    },
    link: {
      color: colors.primary,
      fontSize: 16,
      fontWeight: "700",
      textDecorationLine: "none",
    },
    right: {
      color: colors.textMuted,
      lineHeight: 22,
      fontSize: 13,
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
    nowrapText: {
      whiteSpace: "nowrap",
    },
  });

  return (
    <View style={style.footer}>
      <View style={style.left}>
        <Link href="/about" style={style.link}>
          About Us
        </Link>
        <Link href="/contact" style={style.link}>
          Contact
        </Link>
        <Link href="/search" style={style.link}>
          Explore
        </Link>
      </View>
      <Text style={style.right}>
        <Text style={style.brandName}>LOREBoards</Text>{" "}
        <Text style={style.tagline}>“Playing Games to Study”</Text> ·{" "}
        <Text style={style.nowrapText}>(555) 123-2456</Text> ·{" "}
        <Text style={style.nowrapText}>9876 Place Ave. IN, 20456</Text>
      </Text>
    </View>
  );
}

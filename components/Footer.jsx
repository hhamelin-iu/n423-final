import { View, Text, StyleSheet } from "react-native";

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
      gap: isDesktopWeb ? 20 : 8,
    },
    leftText: {
      fontSize: 13,
      color: colors.textMuted,
      textAlign: isDesktopWeb ? "left" : "center",
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
    divider: {
      color: colors.textLight,
    },
    copyright: {
      color: colors.textMuted,
    },
    contactItem: {
      color: colors.text,
    },
    legalLink: {
      color: colors.textMuted,
    },
  });

  return (
    <View style={style.footer}>
      <View style={style.container}>
        {/* Left Section: Brand & Copyright */}
        <Text style={style.leftText}>
          <Text style={style.brandName}>LOREBoards</Text>
          {isDesktopWeb && (
            <>
              <Text style={style.divider}> · </Text>
              <Text style={style.tagline}>“Playing Games to Study”</Text>
            </>
          )}
          <Text style={style.divider}> · </Text>
          <Text style={style.copyright}>© {new Date().getFullYear()}</Text>
        </Text>

        {/* Right Section: Contact & Policies */}
        <Text style={style.rightText}>
          <Text style={style.contactItem}>📞 (555) 123-2456</Text>
          <Text style={style.divider}> · </Text>
          <Text style={style.legalLink}>Privacy Policy</Text>
          <Text style={style.divider}> · </Text>
          <Text style={style.legalLink}>Terms of Service</Text>
        </Text>
      </View>
    </View>
  );
}

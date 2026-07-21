import { View, Text, StyleSheet, ScrollView, ImageBackground, Pressable, Platform } from 'react-native';
import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../styles/theme';
import Footer from '../components/Footer';
import { useDevice } from '../app/device-context';

import AboutImage from '../assets/about.png';

export default function AboutScreen() {
  const { isDesktopWeb } = useDevice();
  const { colors, isDark, styles: themeStyles } = useTheme();
  const [hoveredCard, setHoveredCard] = useState(null);

  const styles = StyleSheet.create({
    backgroundWrapper: {
      width: '100%',
      maxWidth: 1200,
      alignSelf: 'center',
      overflow: 'hidden',
      aspectRatio: 650 / 500,
      backgroundColor: colors.background,
    },
    backgroundImage: {
      width: '100%',
      height: '100%',
    },
    gradientOverlay: {
      width: '100%',
      height: '100%',
      paddingHorizontal: isDesktopWeb ? 40 : 16,
      paddingVertical: isDesktopWeb ? 40 : 20,
      justifyContent: 'center',
    },
    mainContainer: {
      width: '100%',
      maxWidth: 1100,
      marginHorizontal: 'auto',
    },
    title: {
      fontSize: isDesktopWeb ? 38 : 24,
      fontWeight: '900',
      color: colors.text,
      textAlign: 'center',
      marginBottom: isDesktopWeb ? 24 : 16,
      letterSpacing: -0.8,
      fontFamily: 'LexendZetta_400Regular',
    },
    leadContainer: {
      flexDirection: 'row',
      backgroundColor: isDark ? 'rgba(30, 41, 59, 0.65)' : 'rgba(255, 255, 255, 0.65)',
      borderRadius: 20,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
      padding: isDesktopWeb ? 24 : 16,
      maxWidth: 840,
      marginHorizontal: 'auto',
      marginBottom: isDesktopWeb ? 44 : 0,
      overflow: 'hidden',
      ...Platform.select({
        web: {
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
        },
      }),
    },
    leadBorderLine: {
      width: 4,
      alignSelf: 'stretch',
      borderRadius: 2,
      marginRight: isDesktopWeb ? 20 : 14,
    },
    leadText: {
      flex: 1,
      fontSize: isDesktopWeb ? 16 : 14,
      lineHeight: isDesktopWeb ? 26 : 22,
      color: colors.text,
      fontFamily: 'NotoSans_400Regular',
      textAlign: 'left',
    },
    cardSection: {
      width: '100%',
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 24,
      justifyContent: 'center',
    },
    infoCard: {
      flex: 1,
      minWidth: 280,
      backgroundColor: isDark ? 'rgba(30, 41, 59, 0.75)' : 'rgba(255, 255, 255, 0.75)',
      borderRadius: 24,
      padding: 28,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 3,
      position: 'relative',
      ...Platform.select({
        web: {
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: 'pointer',
        },
      }),
    },
    infoCardHovered: {
      borderColor: colors.primary,
      shadowColor: colors.primary,
      shadowOpacity: isDark ? 0.3 : 0.15,
      shadowRadius: 18,
      elevation: 6,
      ...Platform.select({
        web: {
          transform: 'translateY(-6px)',
          boxShadow: `0 10px 25px -5px ${isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.15)'}`,
        },
      }),
    },
    cardHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    iconCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 14,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    cardHeader: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.text,
      letterSpacing: -0.4,
      fontFamily: 'LexendZetta_400Regular',
      flex: 1,
    },
    cardBody: {
      fontSize: 14,
      color: colors.textMuted,
      lineHeight: 22,
      fontFamily: 'NotoSans_400Regular',
    },
  });

  const renderCards = () => (
    <>
      {/* Card 1: Track & Showcase */}
      <Pressable
        style={[
          styles.infoCard,
          hoveredCard === 'track' && styles.infoCardHovered,
        ]}
        onHoverIn={() => setHoveredCard('track')}
        onHoverOut={() => setHoveredCard(null)}
      >
        <View style={styles.cardHeaderRow}>
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconCircle}
          >
            <Ionicons name="game-controller" size={20} color="#FFFFFF" />
          </LinearGradient>
          <Text style={styles.cardHeader}>Track & Showcase</Text>
        </View>
        <Text style={styles.cardBody}>
          Log your finished playthroughs, 100% completion achievements, and speedrun records.
          Include developer details, platform badges, release years, and custom player notes.
        </Text>
      </Pressable>

      {/* Card 2: IGDB Integration */}
      <Pressable
        style={[
          styles.infoCard,
          hoveredCard === 'igdb' && styles.infoCardHovered,
        ]}
        onHoverIn={() => setHoveredCard('igdb')}
        onHoverOut={() => setHoveredCard(null)}
      >
        <View style={styles.cardHeaderRow}>
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconCircle}
          >
            <Ionicons name="sparkles" size={20} color="#FFFFFF" />
          </LinearGradient>
          <Text style={styles.cardHeader}>Smart IGDB Integration</Text>
        </View>
        <Text style={styles.cardBody}>
          Seamlessly auto-fill game metadata, cover art, and platform data using IGDB
          integration with offline fallback data for instant search previews.
        </Text>
      </Pressable>

      {/* Card 3: Responsive */}
      <Pressable
        style={[
          styles.infoCard,
          hoveredCard === 'responsive' && styles.infoCardHovered,
        ]}
        onHoverIn={() => setHoveredCard('responsive')}
        onHoverOut={() => setHoveredCard(null)}
      >
        <View style={styles.cardHeaderRow}>
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconCircle}
          >
            <Ionicons name="browsers" size={20} color="#FFFFFF" />
          </LinearGradient>
          <Text style={styles.cardHeader}>Responsive Design</Text>
        </View>
        <Text style={styles.cardBody}>
          Built with React Native Web and Expo Router, delivering an optimized experience across
          desktop monitors and mobile devices with fluid layout adaptations.
        </Text>
      </Pressable>
    </>
  );

  return (
    <ScrollView contentContainerStyle={themeStyles.scrollContainer}>
      {/* Centered wrapper that has a background image and a locked 1.3 aspect ratio */}
      <View style={styles.backgroundWrapper}>
        <ImageBackground
          source={AboutImage}
          style={styles.backgroundImage}
          resizeMode="cover"
        >
          <LinearGradient
            colors={[
              isDark ? 'rgba(20, 16, 38, 0.55)' : 'rgba(238, 242, 255, 0.55)',
              isDark ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.85)',
            ]}
            locations={[0, 0.9]}
            style={styles.gradientOverlay}
          >
            <View style={styles.mainContainer}>
              <Text style={styles.title}>About LOREBoards</Text>

              {/* Glassmorphic lead text quote box with vertical left gradient line */}
              <View style={styles.leadContainer}>
                <LinearGradient
                  colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]}
                  style={styles.leadBorderLine}
                />
                <Text style={styles.leadText}>
                  LOREBoards is a responsive, gaming community platform designed for gamers to track,
                  share, and showcase their game completion milestones, high scores, and personal
                  playthrough notes.
                </Text>
              </View>

              {isDesktopWeb && (
                <View style={styles.cardSection}>
                  {renderCards()}
                </View>
              )}
            </View>
          </LinearGradient>
        </ImageBackground>
      </View>

      {/* On Mobile, render cards outside the background wrapper to preserve the landscape aspect ratio */}
      {!isDesktopWeb && (
        <View style={[styles.mainContainer, { paddingHorizontal: 16, marginTop: 24, marginBottom: 40 }]}>
          <View style={styles.cardSection}>
            {renderCards()}
          </View>
        </View>
      )}

      {isDesktopWeb && <Footer />}
    </ScrollView>
  );
}

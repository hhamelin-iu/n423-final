import { View, Text, StyleSheet, ScrollView, Pressable, useWindowDimensions, LayoutAnimation, Platform, UIManager, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../styles/theme';
import Footer from '../../components/Footer';
import GameCard from '../../components/GameCard';
import { useDevice } from '../../app/device-context';
import { useAuth } from '../../src/auth/AuthContext';
import { subscribeSubmissions, deleteSubmission } from '../../src/services/dataService';

export default function HomeScreen() {
  const router = useRouter();
  const { isDesktopWeb } = useDevice();
  const { height } = useWindowDimensions();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubs, setLoadingSubs] = useState(true);
  const [subsError, setSubsError] = useState('');
  const seenIds = useRef(new Set());
  const compactHeight = height < 900;
  const heroTitleSize = Math.round((isDesktopWeb ? 34 : 24) * (compactHeight ? 0.9 : 1));
  const heroSubtitleSize = Math.round((isDesktopWeb ? 18 : 15) * (compactHeight ? 0.92 : 1));
  const sectionTitleSize = Math.round((isDesktopWeb ? 28 : 22) * (compactHeight ? 0.88 : 1));

  const styles = StyleSheet.create({
    heroContainer: {
      width: '100%',
      paddingVertical: compactHeight ? 24 : 40,
      paddingHorizontal: 20,
    },
    heroInner: {
      maxWidth: 1100,
      marginHorizontal: 'auto',
      alignItems: 'center',
    },
    heroTagline: {
      backgroundColor: 'rgba(255, 255, 255, 0.25)',
      paddingHorizontal: 14,
      paddingVertical: 5,
      borderRadius: 20,
      marginBottom: 12,
    },
    heroTaglineText: {
      fontSize: 12,
      fontWeight: '800',
      color: '#FFFFFF',
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    heroTitle: {
      fontSize: heroTitleSize,
      fontWeight: '900',
      color: '#FFFFFF',
      textAlign: 'center',
      marginBottom: 12,
      letterSpacing: -0.5,
      textShadowColor: 'rgba(0, 0, 0, 0.2)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 6,
    },
    heroSubtitle: {
      fontSize: heroSubtitleSize,
      fontWeight: '500',
      color: 'rgba(255, 255, 255, 0.95)',
      textAlign: 'center',
      maxWidth: 700,
      lineHeight: 24,
    },
    heroCtaContainer: {
      marginTop: 18,
      alignItems: 'center',
    },
    heroCtaGroup: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    heroCtaBtn: {
      backgroundColor: '#FFFFFF',
      paddingHorizontal: 22,
      paddingVertical: 12,
      borderRadius: 999,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      shadowColor: 'rgba(0, 0, 0, 0.25)',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 10,
      elevation: 5,
    },
    heroCtaBtnHover: {
      shadowOpacity: 0.35,
      shadowRadius: 14,
    },
    heroCtaBtnActive: {
      opacity: 0.9,
    },
    heroCtaBtnText: {
      fontSize: 15,
      fontWeight: '800',
      color: '#4F46E5',
      letterSpacing: -0.2,
    },
    heroCtaBtnSecondary: {
      backgroundColor: 'rgba(255, 255, 255, 0.18)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.4)',
      paddingHorizontal: 20,
      paddingVertical: 11,
      borderRadius: 999,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    heroCtaBtnSecondaryHover: {
      backgroundColor: 'rgba(255, 255, 255, 0.28)',
      borderColor: '#FFFFFF',
    },
    heroCtaBtnSecondaryText: {
      fontSize: 15,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    mainSection: {
      backgroundColor: colors.background,
      paddingTop: compactHeight ? 20 : 30,
      paddingBottom: compactHeight ? 24 : 36,
    },
    sectionHeader: {
      maxWidth: 1280,
      width: '100%',
      marginHorizontal: 'auto',
      paddingHorizontal: isDesktopWeb ? 30 : 16,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    sectionTitle: {
      fontSize: sectionTitleSize,
      fontWeight: '800',
      color: colors.text,
      letterSpacing: -0.5,
    },
    sectionAccentLine: {
      height: 4,
      width: 40,
      borderRadius: 2,
    },
    gamesContainer: {
      position: 'relative',
      overflow: 'hidden',
      maxWidth: 1280,
      width: '100%',
      marginHorizontal: 'auto',
      paddingHorizontal: isDesktopWeb ? 30 : 16,
    },
    gamesFlex: {
      flexDirection: 'row',
      gap: 18,
      alignItems: 'center',
      paddingVertical: 12,
      paddingRight: isDesktopWeb ? 220 : 140,
    },
    fadeRight: {
      position: 'absolute',
      right: 0,
      top: 0,
      bottom: 0,
      width: isDesktopWeb ? 220 : 140,
      pointerEvents: 'none',
      zIndex: 100,
    },
    emptyText: {
      color: colors.textMuted,
      fontSize: 15,
      fontStyle: 'italic',
      paddingVertical: 40,
    },
  });

  useEffect(() => {
    const isFabric = Boolean(global?.nativeFabricUIManager);
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental && !isFabric) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  useEffect(() => {
    setLoadingSubs(true);
    const unsubscribe = subscribeSubmissions(({ data, error }) => {
      if (error) {
        setSubsError(error);
      } else {
        const layoutAnim = LayoutAnimation.create(
          320,
          LayoutAnimation.Types.easeInEaseOut,
          LayoutAnimation.Properties.scaleXY
        );
        LayoutAnimation.configureNext(layoutAnim);
        setSubmissions(data || []);
        setSubsError('');
      }
      setLoadingSubs(false);
    }, 15);

    return () => unsubscribe();
  }, [user]);

  const handleDeleteSubmission = async (id, ownerId) => {
    if (!user || (user.uid !== ownerId && !user.isDemo)) {
      setSubsError('You can only delete your own submissions.');
      return;
    }
    try {
      await deleteSubmission(id, ownerId, user);
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
      setSubsError('');
    } catch (err) {
      console.warn('Failed to delete submission', err);
      setSubsError('Could not delete this submission.');
    }
  };

  const AnimatedSubmissionCard = ({ submission, onDelete, seenIds }) => {
    const initialValue = seenIds.current.has(submission.id) ? 1 : 0;
    const anim = useRef(new Animated.Value(initialValue)).current;
    const isWeb = Platform.OS === 'web';

    useEffect(() => {
      if (!seenIds.current.has(submission.id)) {
        seenIds.current.add(submission.id);
        Animated.spring(anim, {
          toValue: 1,
          friction: 7,
          tension: 90,
          useNativeDriver: Platform.OS !== 'web',
        }).start();
      } else {
        anim.setValue(1);
      }
    }, [anim, seenIds, submission.id]);

    const scale = anim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.82, 1],
    });
    const translateY = anim.interpolate({
      inputRange: [0, 1],
      outputRange: [isWeb ? 12 : 24, 0],
    });

    return (
      <Animated.View
        style={{
          transform: [{ scale }, { translateY }],
          opacity: anim,
        }}
      >
        <GameCard
          submissionId={submission.id}
          gameId={submission.gameId}
          ownerId={submission.userId}
          onDelete={() => onDelete(submission.id, submission.userId)}
          title={submission.title}
          year={submission.year}
          platform={submission.platform}
          completionType={submission.completionType}
          completionValue={submission.completionValue}
          playerNotes={submission.playerNotes}
          imageUrl={submission.imageUrl}
          userName={
            submission.userDisplayName ||
            submission.userUsername ||
            submission.userName ||
            'Player'
          }
          userPhoto={submission.userPhoto}
          manual={submission.manual}
        />
      </Animated.View>
    );
  };

  return (
    <ScrollView contentContainerStyle={{ backgroundColor: colors.background, flexGrow: 1, justifyContent: 'space-between' }}>
      <View>
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroContainer}
        >
          <View style={styles.heroInner}>
            <View style={styles.heroTagline}>
              <Text style={styles.heroTaglineText}>Video Game Completion Tracker</Text>
            </View>

            <Text style={styles.heroTitle}>Welcome to LOREBoards!</Text>

            <Text style={styles.heroSubtitle}>
              Track, showcase, and share your video game completions. Log high scores, 100% runs, and milestones across every platform.
            </Text>

            <View style={styles.heroCtaContainer}>
              {user ? (
                <Pressable
                  style={({ hovered, pressed }) => [
                    styles.heroCtaBtn,
                    hovered && styles.heroCtaBtnHover,
                    pressed && styles.heroCtaBtnActive,
                  ]}
                  onPress={() => router.push('/submit')}
                >
                  <Ionicons name="add-circle-outline" size={20} color="#4F46E5" />
                  <Text style={styles.heroCtaBtnText}>Submit a New Entry</Text>
                  <Ionicons name="arrow-forward" size={16} color="#4F46E5" />
                </Pressable>
              ) : (
                <View style={styles.heroCtaGroup}>
                  <Pressable
                    style={({ hovered, pressed }) => [
                      styles.heroCtaBtn,
                      hovered && styles.heroCtaBtnHover,
                      pressed && styles.heroCtaBtnActive,
                    ]}
                    onPress={() => router.push('/login')}
                  >
                    <Ionicons name="sparkles-outline" size={18} color="#4F46E5" />
                    <Text style={styles.heroCtaBtnText}>Explore as Demo User</Text>
                  </Pressable>
                  <Pressable
                    style={({ hovered, pressed }) => [
                      styles.heroCtaBtnSecondary,
                      hovered && styles.heroCtaBtnSecondaryHover,
                      pressed && styles.heroCtaBtnActive,
                    ]}
                    onPress={() => router.push('/signup')}
                  >
                    <Text style={styles.heroCtaBtnSecondaryText}>Create an Account</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        </LinearGradient>

        <View style={styles.mainSection}>
          <View style={styles.sectionHeader}>
            <LinearGradient
              colors={[colors.gradientMid, colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sectionAccentLine}
            />
            <Text style={styles.sectionTitle}>Latest Submissions</Text>
          </View>

          <View style={styles.gamesContainer}>
            {!!subsError && (
              <Text style={{ color: '#EF4444', marginBottom: 10, fontWeight: '600' }}>
                {subsError}
              </Text>
            )}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
              scrollEventThrottle={16}
              style={Platform.OS === 'web' ? { overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' } : undefined}
              contentContainerStyle={styles.gamesFlex}
            >
              {submissions.length === 0 && !loadingSubs && (
                <Text style={styles.emptyText}>No submissions yet. Be the first to add one!</Text>
              )}
              {submissions.map((s) => (
                <AnimatedSubmissionCard
                  key={s.id}
                  submission={s}
                  onDelete={handleDeleteSubmission}
                  seenIds={seenIds}
                />
              ))}
            </ScrollView>
            <LinearGradient
              pointerEvents="none"
              colors={[
                'rgba(0,0,0,0)',
                isDark ? 'rgba(15, 23, 42, 0.12)' : 'rgba(250, 250, 253, 0.12)',
                isDark ? 'rgba(15, 23, 42, 0.45)' : 'rgba(250, 250, 253, 0.45)',
                isDark ? 'rgba(15, 23, 42, 0.85)' : 'rgba(250, 250, 253, 0.85)',
                colors.background,
              ]}
              locations={[0, 0.3, 0.6, 0.85, 1]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.fadeRight}
            />
          </View>
        </View>
      </View>

      <Footer />
    </ScrollView>
  );
}

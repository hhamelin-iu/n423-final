import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { useTheme } from '../styles/theme';
import Footer from '../components/Footer';
import GameCard from '../components/GameCard';
import { useDevice } from '../app/device-context';
import { useAuth } from '../src/auth/AuthContext';
import { fetchSubmissions, deleteSubmission } from '../src/services/dataService';

export default function SearchScreen() {
  const { isDesktopWeb } = useDevice();
  const { colors, styles: themeStyles } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const getParam = (key) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value || '';
  };
  const initialQuery = getParam('query');
  const initialUser = getParam('user');
  const initialGameId = getParam('gameId');
  const initialIgdbId = '';
  const [queryText, setQueryText] = useState(initialQuery);
  const [userQuery, setUserQuery] = useState(initialUser);
  const [gameIdParam, setGameIdParam] = useState(initialGameId);
  const [igdbIdParam, setIgdbIdParam] = useState(initialIgdbId);
  const [sortOption, setSortOption] = useState('newest');
  const [showParameters, setShowParameters] = useState(Boolean(initialUser));
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [focusedField, setFocusedField] = useState(null);
  const [filtersHovered, setFiltersHovered] = useState(false);
  const [hoveredPill, setHoveredPill] = useState(null);

  useEffect(() => {
    const q = getParam('query');
    const u = getParam('user');
    const g = getParam('gameId');
    if (typeof q === 'string') setQueryText(q);
    if (typeof u === 'string') {
      setUserQuery(u);
      if (u.trim()) setShowParameters(true);
    }
    if (typeof g === 'string') setGameIdParam(g);
  }, [params.query, params.user, params.gameId]);

  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await fetchSubmissions(120);
        if (!cancelled) {
          setSubmissions(data || []);
        }
      } catch (err) {
        console.warn('Failed to load submissions', err);
        if (!cancelled) setError('Could not load submissions right now.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleDeleteSubmission = async (id, ownerId) => {
    if (!user || (user.uid !== ownerId && !user.isDemo)) {
      setDeleteError('You can only delete your own submissions.');
      return;
    }
    try {
      await deleteSubmission(id, ownerId, user);
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
      setDeleteError('');
    } catch (err) {
      console.warn('Failed to delete submission', err);
      setDeleteError('Could not delete this submission.');
    }
  };

  const results = useMemo(() => {
    const text = queryText.trim().toLowerCase();
    const userText = userQuery.trim().toLowerCase();
    const gameIdFilter = (gameIdParam || '').trim();
    const toMillis = (ts) => {
      if (!ts) return 0;
      if (typeof ts.toMillis === 'function') return ts.toMillis();
      if (typeof ts.seconds === 'number') return ts.seconds * 1000;
      if (typeof ts === 'number') return ts;
      if (typeof ts === 'string') return new Date(ts).getTime();
      return 0;
    };

    return submissions
      .filter((s) => {
        if (text) {
          const title = (s.title || '').toLowerCase();
          const dev = (s.developer || '').toLowerCase();
          const platform = (s.platform || '').toLowerCase();
          const notes = (s.playerNotes || '').toLowerCase();
          const match =
            title.includes(text) ||
            dev.includes(text) ||
            platform.includes(text) ||
            notes.includes(text);
          if (!match) return false;
        }

        if (userText) {
          const nameMatch = (s.userDisplayName || '').toLowerCase().includes(userText);
          const usernameMatch = (s.userUsername || '').toLowerCase().includes(userText);
          const idMatch = (s.userId || '').toLowerCase() === userText;
          if (!nameMatch && !usernameMatch && !idMatch) return false;
        }

        if (gameIdFilter && s.gameId !== gameIdFilter) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortOption === 'oldest') {
          return toMillis(a.createdAt) - toMillis(b.createdAt);
        }
        if (sortOption === 'title') {
          return (a.title || '').localeCompare(b.title || '');
        }
        if (sortOption === 'platform') {
          return (a.platform || '').localeCompare(b.platform || '');
        }
        return toMillis(b.createdAt) - toMillis(a.createdAt);
      });
  }, [submissions, queryText, userQuery, gameIdParam, sortOption]);

  const styles = StyleSheet.create({
    searchWrap: {
      width: '100%',
      maxWidth: 1200,
      alignSelf: 'center',
      paddingHorizontal: 15,
      gap: 16,
    },
    searchBarRow: {
      flexDirection: 'row',
      gap: 12,
      alignItems: 'center',
    },
    searchInput: {
      flex: 1,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      padding: 14,
      fontSize: 16,
      color: colors.text,
    },
    inputFocused: {
      borderColor: colors.primary,
      ...Platform.select({
        web: {
          outlineStyle: 'none',
          boxShadow: `0 0 0 3px ${colors.badgeBorder}`,
        },
      }),
    },
    paramToggleBtn: {
      backgroundColor: colors.primary,
      paddingHorizontal: 18,
      paddingVertical: 14,
      borderRadius: 14,
      cursor: 'pointer',
    },
    paramToggleBtnHovered: {
      backgroundColor: colors.primaryDark,
      transform: [{ scale: 1.02 }],
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
    },
    paramToggleText: {
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: 15,
    },
    paramBox: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    paramLabel: {
      fontWeight: '700',
      fontSize: 14,
      color: colors.text,
      marginBottom: 6,
    },
    paramInput: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      padding: 10,
      fontSize: 15,
      color: colors.text,
    },
    sortRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    sortPill: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 20,
      cursor: 'pointer',
    },
    sortPillHovered: {
      borderColor: colors.primary,
      transform: [{ scale: 1.03 }],
    },
    sortPillActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    sortPillText: {
      color: colors.textMuted,
      fontWeight: '600',
      fontSize: 13,
    },
    sortPillTextActive: {
      color: '#FFFFFF',
    },
    resultsContainer: {
      marginTop: 10,
    },
    resultsCount: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textMuted,
      marginBottom: 16,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 16,
    },
    emptyText: {
      textAlign: 'center',
      color: colors.textMuted,
      fontSize: 15,
      marginTop: 40,
    },
    errorText: {
      color: '#EF4444',
      marginBottom: 10,
      fontWeight: '600',
    },
  });

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={themeStyles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={themeStyles.mainContainer}>
          {isDesktopWeb && (
            <Text style={[themeStyles.title, { textAlign: 'center' }]}>Search Submissions</Text>
          )}

          <View style={styles.searchWrap}>
            <View style={styles.searchBarRow}>
              <TextInput
                value={queryText}
                onChangeText={setQueryText}
                onFocus={() => setFocusedField('search')}
                onBlur={() => setFocusedField(null)}
                placeholder="Search by game title, notes, developer, platform..."
                placeholderTextColor={colors.textLight}
                style={[styles.searchInput, focusedField === 'search' && styles.inputFocused]}
              />
              <Pressable
                style={[styles.paramToggleBtn, filtersHovered && styles.paramToggleBtnHovered]}
                onPress={() => setShowParameters((prev) => !prev)}
                onHoverIn={() => setFiltersHovered(true)}
                onHoverOut={() => setFiltersHovered(false)}
              >
                <Text style={styles.paramToggleText}>
                  {showParameters ? 'Hide Filters' : 'Filters'}
                </Text>
              </Pressable>
            </View>

            {showParameters && (
              <View style={styles.paramBox}>
                <Text style={styles.paramLabel}>Filter by User / Player Name:</Text>
                <TextInput
                  value={userQuery}
                  onChangeText={setUserQuery}
                  onFocus={() => setFocusedField('user')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Username or display name"
                  placeholderTextColor={colors.textLight}
                  style={[styles.paramInput, focusedField === 'user' && styles.inputFocused]}
                />

                <Text style={[styles.paramLabel, { marginTop: 12 }]}>Sort By:</Text>
                <View style={styles.sortRow}>
                  {[
                    { key: 'newest', label: 'Newest' },
                    { key: 'oldest', label: 'Oldest' },
                    { key: 'title', label: 'Title' },
                    { key: 'platform', label: 'Platform' },
                  ].map((opt) => (
                    <Pressable
                      key={opt.key}
                      style={[
                        styles.sortPill,
                        sortOption === opt.key && styles.sortPillActive,
                        hoveredPill === opt.key && styles.sortPillHovered,
                      ]}
                      onPress={() => setSortOption(opt.key)}
                      onHoverIn={() => setHoveredPill(opt.key)}
                      onHoverOut={() => setHoveredPill(null)}
                    >
                      <Text
                        style={[
                          styles.sortPillText,
                          sortOption === opt.key && styles.sortPillTextActive,
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {loading ? (
              <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 30 }} />
            ) : (
              <View style={styles.resultsContainer}>
                {!!error && <Text style={styles.errorText}>{error}</Text>}
                {!!deleteError && <Text style={styles.errorText}>{deleteError}</Text>}
                <Text style={styles.resultsCount}>
                  Showing {results.length} {results.length === 1 ? 'submission' : 'submissions'}
                </Text>

                <View style={styles.grid}>
                  {results.map((s) => (
                    <GameCard
                      key={s.id}
                      submissionId={s.id}
                      gameId={s.gameId}
                      ownerId={s.userId}
                      onDelete={() => handleDeleteSubmission(s.id, s.userId)}
                      title={s.title}
                      year={s.year}
                      platform={s.platform}
                      completionType={s.completionType}
                      completionValue={s.completionValue}
                      playerNotes={s.playerNotes}
                      imageUrl={s.imageUrl}
                      userName={s.userDisplayName || s.userUsername || 'Player'}
                      userPhoto={s.userPhoto}
                      manual={s.manual}
                    />
                  ))}
                </View>

                {results.length === 0 && !loading && (
                  <Text style={styles.emptyText}>No matching game submissions found.</Text>
                )}
              </View>
            )}
          </View>
        </View>
        {isDesktopWeb && <Footer />}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

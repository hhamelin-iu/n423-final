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
import Footer from "../components/Footer";
import GameCard from "../components/GameCard";
import { useDevice } from "../app/device-context";
import { useAuth } from '../src/auth/AuthContext';
import { fetchSubmissions, deleteSubmission } from '../src/services/dataService';

export default function SearchScreen() {
    const { isDesktopWeb } = useDevice();
    const theme = useTheme();
    const router = useRouter();
    const { user } = useAuth();
    const params = useLocalSearchParams();
    const getParam = (key) => {
        const value = params[key];
        return Array.isArray(value) ? value[0] : (value || '');
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
        return () => { cancelled = true; };
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
            if (typeof ts === 'string') return new Date(ts).getTime();
            if (typeof ts.toMillis === 'function') return ts.toMillis();
            if (ts.seconds != null) return (ts.seconds * 1000) + Math.round((ts.nanoseconds || 0) / 1e6);
            return 0;
        };

        return submissions.filter((s) => {
            if (text) {
                const titleMatch = (s.title || '').toLowerCase().includes(text);
                const descMatch = (s.playerNotes || '').toLowerCase().includes(text);
                const devMatch = (s.developer || '').toLowerCase().includes(text);
                const platformMatch = (s.platform || '').toLowerCase().includes(text);
                if (!titleMatch && !descMatch && !devMatch && !platformMatch) return false;
            }

            if (userText) {
                const nameMatch = (s.userDisplayName || '').toLowerCase().includes(userText);
                const usernameMatch = (s.userUsername || '').toLowerCase().includes(userText);
                const idMatch = (s.userId || '').toLowerCase() === userText;
                if (!nameMatch && !usernameMatch && !idMatch) return false;
            }

            if (gameIdFilter && s.gameId !== gameIdFilter) return false;

            return true;
        }).sort((a, b) => {
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

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView contentContainerStyle={theme.scrollContainer} keyboardShouldPersistTaps="handled">
                <View style={theme.mainContainer}>
                    {isDesktopWeb && (
                        <Text style={[theme.title, { textAlign: 'center' }]}>Search Submissions</Text>
                    )}

                    <View style={styles.searchWrap}>
                        <View style={styles.searchBarRow}>
                            <TextInput
                                value={queryText}
                                onChangeText={setQueryText}
                                placeholder="Search by game title, notes, developer, platform..."
                                placeholderTextColor="rgba(0,0,0,0.5)"
                                style={styles.searchInput}
                            />
                            <Pressable
                                style={styles.paramToggleBtn}
                                onPress={() => setShowParameters((prev) => !prev)}
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
                                    placeholder="Username or display name"
                                    placeholderTextColor="rgba(0,0,0,0.5)"
                                    style={styles.paramInput}
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
                                            ]}
                                            onPress={() => setSortOption(opt.key)}
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
                            <ActivityIndicator size="large" color="#6366F1" style={{ marginVertical: 30 }} />
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
                                    <Text style={styles.emptyText}>
                                        No matching game submissions found.
                                    </Text>
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
        backgroundColor: '#FFFFFF',
        borderWidth: 1.5,
        borderColor: '#C5C5C5',
        borderRadius: 14,
        padding: 14,
        fontSize: 18,
    },
    paramToggleBtn: {
        backgroundColor: '#6366F1',
        paddingHorizontal: 18,
        paddingVertical: 14,
        borderRadius: 14,
    },
    paramToggleText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 16,
    },
    paramBox: {
        backgroundColor: '#F3F4F6',
        borderRadius: 14,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    paramLabel: {
        fontWeight: '700',
        fontSize: 15,
        color: '#374151',
        marginBottom: 6,
    },
    paramInput: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 10,
        padding: 10,
        fontSize: 16,
    },
    sortRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    sortPill: {
        backgroundColor: '#E5E7EB',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
    },
    sortPillActive: {
        backgroundColor: '#6366F1',
    },
    sortPillText: {
        color: '#4B5563',
        fontWeight: '600',
    },
    sortPillTextActive: {
        color: '#FFFFFF',
    },
    resultsContainer: {
        marginTop: 10,
    },
    resultsCount: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6B7280',
        marginBottom: 16,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    emptyText: {
        textAlign: 'center',
        color: '#9CA3AF',
        fontSize: 16,
        marginTop: 40,
    },
    errorText: {
        color: '#EF4444',
        marginBottom: 10,
        fontWeight: '600',
    },
});

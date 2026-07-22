import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Pressable, Animated, Easing, ScrollView, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useDevice } from "../app/device-context";
import { useAuth } from '../src/auth/AuthContext';
import { useTheme } from '../styles/theme';
import { useAlert } from '../src/context/AlertContext';
import { isFirebaseConfigured } from '../src/services/dataService';

export default function GameCard({
    submissionId,
    gameId,
    title,
    year,
    platform,
    completionType,
    completionValue,
    playerNotes,
    imageUrl,
    userId,
    userDisplayName,
    userUsername,
    userPhoto,
    manual,
    source,
    onDelete,
}) {
    const { isDesktopWeb } = useDevice();
    const { user } = useAuth();
    const { colors, isDark } = useTheme();

    const infoTextNumberOfLines = 3;
    const infoTextLineHeight = isDesktopWeb ? 18 : 16;
    const infoTextMaxHeight = infoTextLineHeight * infoTextNumberOfLines;
    const expandedNotesMaxHeight = isDesktopWeb ? 230 : 190;
    const reservedNotesSpace = isDesktopWeb ? 16 : 8;
    const lowerType = (completionType || '').toLowerCase();
    const isProgress = lowerType === 'progress' || lowerType === 'completion';
    const statusLabel = isProgress ? 'Progress' : 'High Score';
    const statusColor = isProgress ? colors.gradientMid : '#10B981';
    const [isNotesHovered, setIsNotesHovered] = useState(false);
    const [isCardHovered, setIsCardHovered] = useState(false);
    const [notesOpen, setNotesOpen] = useState(false);
    const isExpanded = isDesktopWeb ? (isCardHovered || isNotesHovered) : notesOpen;
    const handleCardHoverIn = () => { if (isDesktopWeb) setIsCardHovered(true); };
    const handleCardHoverOut = () => { if (isDesktopWeb) setIsCardHovered(false); };
    const handleNotesPressIn = () => { if (isDesktopWeb) setIsNotesHovered(true); };
    const handleNotesPressOut = () => { if (isDesktopWeb) setIsNotesHovered(false); };
    const handleNotesToggle = () => {
        if (!isDesktopWeb) setNotesOpen((prev) => !prev);
    };
    const handleCardPress = () => {
        if (!isDesktopWeb && notesOpen) setNotesOpen(false);
    };

    const [fullNotesHeight, setFullNotesHeight] = useState(infoTextMaxHeight);
    const notesHeightAnim = useRef(new Animated.Value(infoTextMaxHeight)).current;

    useEffect(() => {
        const targetHeight = isExpanded
            ? Math.min(fullNotesHeight, expandedNotesMaxHeight)
            : infoTextMaxHeight;
        Animated.timing(notesHeightAnim, {
            toValue: targetHeight,
            duration: 240,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
        }).start();
    }, [isExpanded, fullNotesHeight, expandedNotesMaxHeight, infoTextMaxHeight, notesHeightAnim]);

    const handleNotesMeasure = (event) => {
        const height = event?.nativeEvent?.layout?.height;
        if (height && height > fullNotesHeight) {
            setFullNotesHeight(height);
        }
    };
    useEffect(() => {
        if (isDesktopWeb) setNotesOpen(false);
    }, [isDesktopWeb]);

    const confirmDelete = async () => {
        return await showConfirm({
            title: 'Delete submission',
            text: 'Are you sure you want to delete this submission?',
            type: 'warning',
            confirmText: 'Delete',
            cancelText: 'Cancel',
            dangerMode: true,
        });
    };

    const showDeleteResult = async (success) => {
        await showAlert(
            success ? 'Deleted' : 'Error',
            success ? 'Submission removed.' : 'Could not delete this submission.',
            success ? 'success' : 'error'
        );
    };

    const styles = useMemo(() => StyleSheet.create({
        cardSlot: {
            width: isDesktopWeb ? 280 : 220,
            backgroundColor: 'transparent',
        },
        container: {
            width: '100%',
            backgroundColor: colors.card,
            paddingTop: 8,
            paddingBottom: 10,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 3,
            overflow: 'visible',
            position: 'relative',
        },
        titleWrap: {
            height: isDesktopWeb ? 48 : 42,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 4,
            paddingHorizontal: 8,
        },
        title: {
            fontSize: isDesktopWeb ? 15 : 13,
            lineHeight: isDesktopWeb ? 20 : 17,
            fontWeight: '800',
            textAlign: 'center',
            color: colors.text,
        },
        year: {
            fontSize: isDesktopWeb ? 12 : 11,
            color: colors.textMuted,
            marginTop: 2,
        },
        yearHover: {
            color: colors.primary,
        },
        innerCard: {
            marginHorizontal: 8,
            position: 'relative',
            zIndex: 10,
        },
        imageWrap: {
            height: isDesktopWeb ? 280 : 220,
            width: '100%',
            backgroundColor: colors.surfaceSecondary,
            borderRadius: 12,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: colors.border,
        },
        imagePlaceholder: {
            backgroundColor: colors.surfaceSecondary,
            borderColor: colors.border,
            borderWidth: 1,
        },
        image: {
            width: '100%',
            height: '100%',
            resizeMode: 'cover',
        },
        imagePlaceholderInner: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
        },
        imagePlaceholderIcon: {
            opacity: 0.5,
        },
        info: {
            marginTop: 6,
            backgroundColor: colors.surfaceSecondary,
            borderRadius: 12,
            overflow: 'visible',
            position: 'relative',
            zIndex: 20,
            elevation: 8,
            borderWidth: 1,
            borderColor: colors.border,
        },
        infoBar: {
            paddingHorizontal: 8,
            paddingVertical: 6,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            backgroundColor: colors.surface,
            borderTopLeftRadius: 11,
            borderTopRightRadius: 11,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },
        statusBlock: {
            flexDirection: 'column',
            justifyContent: 'center',
        },
        statusLabelText: {
            fontSize: isDesktopWeb ? 11 : 10,
            fontWeight: '800',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
        },
        completionValueText: {
            fontSize: isDesktopWeb ? 13 : 12,
            fontWeight: '700',
            color: colors.text,
            marginTop: 1,
        },
        userProfile: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 999,
            backgroundColor: colors.surfaceSecondary,
            maxWidth: isDesktopWeb ? 140 : 110,
            flexShrink: 1,
        },
        userPic: {
            width: isDesktopWeb ? 24 : 20,
            height: isDesktopWeb ? 24 : 20,
            borderRadius: 12,
            backgroundColor: colors.border,
            flexShrink: 0,
        },
        username: {
            fontSize: isDesktopWeb ? 12 : 11,
            fontWeight: '700',
            color: colors.primary,
            flexShrink: 1,
        },
        infoTextContainer: {
            position: 'relative',
            minHeight: isDesktopWeb ? 84 : 74,
            zIndex: 50,
            justifyContent: 'flex-start',
        },
        infoText: {
            lineHeight: isDesktopWeb ? 19 : 17,
            fontSize: isDesktopWeb ? 13 : 12,
            color: colors.textMuted,
        },
        infoTextWrapper: {
            overflow: 'hidden',
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            zIndex: 900,
            backgroundColor: colors.surfaceSecondary,
            paddingBottom: 8,
            minHeight: isDesktopWeb ? 84 : 74,
            borderBottomLeftRadius: 12,
            borderBottomRightRadius: 12,
            elevation: 0,
            justifyContent: 'flex-start',
        },
        infoTextScroll: {
            paddingHorizontal: 10,
            paddingTop: 8,
            paddingBottom: 8,
        },
        hiddenMeasure: {
            position: 'absolute',
            opacity: 0,
            left: 0,
            right: 0,
            top: 0,
            zIndex: -1,
            pointerEvents: 'none',
        },
        badgeRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            marginTop: 6,
            paddingHorizontal: 10,
            justifyContent: 'center',
            position: 'relative',
            zIndex: 5,
        },
        badge: {
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 999,
            backgroundColor: colors.badgeBg,
            borderWidth: 1,
            borderColor: colors.badgeBorder,
        },
        badgeText: {
            fontSize: 10,
            fontWeight: '700',
            color: colors.badgeText,
        },
        cardHover: {
            borderColor: colors.primary,
            transform: [{ translateY: -3 }],
            shadowOpacity: 0.18,
            shadowRadius: 10,
        },
        titleHover: {
            color: colors.primary,
            textDecorationLine: 'underline',
        },
        imageHover: {
            opacity: 0.92,
        },
        userProfileHover: {
            backgroundColor: colors.border,
        },
        userProfileActive: {
            opacity: 0.8,
        },
        actionRow: {
            flexDirection: 'row',
            justifyContent: 'flex-end',
            alignItems: 'center',
            paddingHorizontal: 10,
            marginBottom: 4,
            minHeight: 32,
            gap: 8,
        },
        actionBtn: {
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 8,
            backgroundColor: colors.surfaceSecondary,
            borderWidth: 1,
            borderColor: colors.border,
        },
        actionBtnHover: {
            borderColor: colors.primary,
        },
        actionBtnActive: {
            opacity: 0.8,
        },
        actionText: {
            fontSize: 11,
            fontWeight: '800',
            color: colors.text,
        },
        actionDanger: {
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderColor: 'rgba(239, 68, 68, 0.3)',
        },
        actionDangerText: {
            color: '#EF4444',
        },
    }), [colors, isDesktopWeb]);

    const displayName = userDisplayName || userUsername || 'Player';
    const displayPhoto = userPhoto ? (typeof userPhoto === 'number' || (typeof userPhoto === 'object' && userPhoto !== null && userPhoto.uri) ? userPhoto : { uri: userPhoto }) : null;
    const completionDisplay = completionValue ? `${completionValue}` : '—';
    const hasImage = Boolean(imageUrl);
    const pushSearch = ({ query, user, gameId: gameIdParam }) => {
        const params = new URLSearchParams();
        if (query) params.set('query', query);
        if (user) params.set('user', user);
        if (gameIdParam) params.set('gameId', gameIdParam);
        const qs = params.toString();
        router.push(`/search${qs ? `?${qs}` : ''}`);
    };
    const handleOpenGameSearch = () => {
        pushSearch({ gameId: gameId || '' });
    };
    const handleOpenUserSearch = () => {
        const userQuery = displayName?.trim();
        if (userQuery) pushSearch({ user: userQuery });
    };
    const handleEdit = () => {
        if (!submissionId) return;
        router.push(`/submit?edit=${submissionId}`);
    };
    const handleDelete = async () => {
        if (!submissionId || typeof onDelete !== 'function') return;

        const confirmed = await confirmDelete();
        if (!confirmed) return;

        try {
            await onDelete(submissionId);
            await showDeleteResult(true);
        } catch (err) {
            console.warn('Failed to delete submission', err);
            await showDeleteResult(false);
        }
    };

    const canManage = Boolean(user?.uid && submissionId && userId && (user.uid === userId || user?.isDemo || !isFirebaseConfigured()));
    const actionAreaWidth = 120;

    return (
        <View style={styles.cardSlot}>
            <Pressable
                style={{ width: '100%' }}
                onHoverIn={handleCardHoverIn}
                onHoverOut={handleCardHoverOut}
                onPress={handleCardPress}
            >
                {({ hovered }) => (
                    <View
                        style={[
                            styles.container,
                            (hovered || isExpanded) && styles.cardHover,
                        ]}
                    >
                <View style={styles.actionRow}>
                    {canManage ? (
                        <>
                            <Pressable
                                accessibilityLabel="Edit submission"
                                onPress={(e) => { e?.stopPropagation?.(); handleEdit(); }}
                                style={({ hovered, pressed }) => [
                                    styles.actionBtn,
                                    hovered && styles.actionBtnHover,
                                    pressed && styles.actionBtnActive,
                                ]}
                            >
                                <Text style={styles.actionText}>Edit</Text>
                            </Pressable>
                            <Pressable
                                accessibilityLabel="Delete submission"
                                onPress={(e) => { e?.stopPropagation?.(); handleDelete(); }}
                                style={({ hovered, pressed }) => [
                                    styles.actionBtn,
                                    styles.actionDanger,
                                    hovered && styles.actionBtnHover,
                                    pressed && styles.actionBtnActive,
                                ]}
                            >
                                <Text style={[styles.actionText, styles.actionDangerText]}>Delete</Text>
                            </Pressable>
                        </>
                    ) : (
                        <View style={{ width: actionAreaWidth, height: 32 }} />
                    )}
                </View>
                <Pressable
                    style={styles.titleWrap}
                    onPress={handleOpenGameSearch}
                    onHoverIn={handleCardHoverIn}
                >
                    {({ hovered, pressed }) => (
                        <>
                            <Text
                                style={[
                                    styles.title,
                                    (hovered || pressed) && styles.titleHover,
                                ]}
                                numberOfLines={2}
                                ellipsizeMode="tail"
                            >
                                {title || 'Untitled Game'}
                            </Text>
                            <Text
                                style={[
                                    styles.year,
                                    (hovered || pressed) && styles.yearHover,
                                ]}
                            >
                                {[platform, year].filter(Boolean).join(' • ')}
                            </Text>
                        </>
                    )}
                </Pressable>
                <View style={styles.innerCard}>
                    <Pressable
                        onPress={handleOpenGameSearch}
                        onHoverIn={handleCardHoverIn}
                    >
                        {({ hovered }) => (
                            <View
                                style={[
                                    styles.imageWrap,
                                    hovered && styles.imageHover,
                                    !hasImage && styles.imagePlaceholder,
                                ]}
                            >
                                {hasImage ? (
                                    <Image
                                        source={{ uri: imageUrl }}
                                        style={styles.image}
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <View style={styles.imagePlaceholderInner}>
                                        <Ionicons
                                            name="image-outline"
                                            size={42}
                                            color="#666"
                                            style={styles.imagePlaceholderIcon}
                                        />
                                    </View>
                                )}
                            </View>
                        )}
                    </Pressable>
                    <View style={styles.info}>
                        <View style={styles.infoBar}>
                            <View style={styles.statusBlock}>
                                <Text style={[styles.statusLabelText, { color: statusColor }]}>
                                    {statusLabel}
                                </Text>
                                {!!completionDisplay && (
                                    <Text style={styles.completionValueText}>
                                        {completionDisplay}
                                    </Text>
                                )}
                            </View>
                            <Pressable
                                onPress={(event) => {
                                    event.stopPropagation();
                                    handleOpenUserSearch();
                                }}
                                style={({ hovered, pressed }) => [
                                    styles.userProfile,
                                    (hovered || pressed) && styles.userProfileHover,
                                    pressed && styles.userProfileActive,
                                ]}
                            >
                                {displayPhoto
                                    ? <Image source={displayPhoto} style={styles.userPic} />
                                    : <View style={styles.userPic} />}
                                {isDesktopWeb && (
                                    <Text
                                        style={styles.username}
                                        numberOfLines={1}
                                        ellipsizeMode="tail"
                                    >
                                        {displayName}
                                    </Text>
                                )}
                            </Pressable>
                        </View>
                        <Pressable
                            onPressIn={handleNotesPressIn}
                            onPressOut={handleNotesPressOut}
                            onHoverIn={handleCardHoverIn}
                            onPress={handleNotesToggle}
                        >
                            <View style={styles.infoTextContainer}>
                                <Animated.View style={[styles.infoTextWrapper, { maxHeight: notesHeightAnim }]}>
                                    <ScrollView
                                        scrollEnabled={isExpanded && fullNotesHeight > expandedNotesMaxHeight}
                                        showsVerticalScrollIndicator
                                        nestedScrollEnabled
                                        contentContainerStyle={styles.infoTextScroll}
                                    >
                                        <Text
                                            style={styles.infoText}
                                            numberOfLines={isExpanded ? undefined : infoTextNumberOfLines}
                                            ellipsizeMode="tail"
                                        >
                                            {playerNotes ? `“${playerNotes}”` : 'No notes yet.'}
                                        </Text>
                                    </ScrollView>
                                </Animated.View>
                                <View style={styles.hiddenMeasure} onLayout={handleNotesMeasure}>
                                    <Text style={styles.infoText}>
                                        {playerNotes ? `“${playerNotes}”` : 'No notes yet.'}
                                    </Text>
                                </View>
                            </View>
                        </Pressable>
                    </View>
                </View>
                {(manual || manual === false) && (
                    <View style={styles.badgeRow}>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>
                                {manual ? 'LOREBoards' : 'IGDB'}
                            </Text>
                        </View>
                    </View>
                )}
            </View>
        )}
    </Pressable>
</View>
    );
}

import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Platform, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../styles/theme';

const AlertContext = createContext({
  showAlert: () => Promise.resolve(),
  showConfirm: () => Promise.resolve(false),
});

export function AlertProvider({ children }) {
  const { colors, isDark } = useTheme();
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState({
    title: '',
    message: '',
    type: 'info', // 'success' | 'error' | 'warning' | 'info'
    isConfirm: false,
    confirmText: 'OK',
    cancelText: 'Cancel',
    dangerMode: false,
  });

  const promiseRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  const show = useCallback((options) => {
    return new Promise((resolve) => {
      promiseRef.current = resolve;
      setConfig({
        title: options.title || '',
        message: options.message || options.text || '',
        type: options.type || options.icon || 'info',
        isConfirm: !!options.isConfirm,
        confirmText: options.confirmText || (options.buttons && options.buttons[1]) || 'OK',
        cancelText: options.cancelText || (options.buttons && options.buttons[0]) || 'Cancel',
        dangerMode: !!options.dangerMode,
      });
      setVisible(true);

      // Animation in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 120,
          friction: 8,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();
    });
  }, [fadeAnim, scaleAnim]);

  const hide = useCallback((result) => {
    // Animation out
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 140,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 140,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start(() => {
      setVisible(false);
      if (promiseRef.current) {
        promiseRef.current(result);
        promiseRef.current = null;
      }
    });
  }, [fadeAnim, scaleAnim]);

  // Sweetalert compatibility signatures
  const showAlert = useCallback((titleOrOpts, message, type) => {
    if (typeof titleOrOpts === 'object') {
      return show({ ...titleOrOpts, isConfirm: false });
    }
    return show({ title: titleOrOpts, message, type, isConfirm: false });
  }, [show]);

  const showConfirm = useCallback((titleOrOpts, message, type) => {
    if (typeof titleOrOpts === 'object') {
      return show({ ...titleOrOpts, isConfirm: true });
    }
    return show({ title: titleOrOpts, message, type, isConfirm: true });
  }, [show]);

  const handleConfirm = () => hide(true);
  const handleCancel = () => hide(false);
  const handleBackdropPress = () => {
    if (!config.isConfirm) {
      hide(true);
    }
  };

  const getIconDetails = () => {
    switch (config.type) {
      case 'success':
        return {
          name: 'checkmark-circle',
          color: colors.successText,
          bg: colors.successBg,
          border: colors.successBorder,
        };
      case 'error':
        return {
          name: 'close-circle',
          color: '#EF4444',
          bg: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2',
          border: isDark ? 'rgba(239, 68, 68, 0.3)' : '#FCA5A5',
        };
      case 'warning':
        return {
          name: 'warning',
          color: colors.warningText,
          bg: colors.warningBg,
          border: colors.warningBorder,
        };
      case 'info':
      default:
        return {
          name: 'information-circle',
          color: colors.badgeText,
          bg: colors.badgeBg,
          border: colors.badgeBorder,
        };
    }
  };

  const iconDetails = getIconDetails();

  const styles = StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: isDark ? 'rgba(15, 23, 42, 0.75)' : 'rgba(240, 242, 245, 0.75)',
      justifyContent: 'center',
      alignItems: 'center',
      ...Platform.select({
        web: {
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        },
      }),
    },
    modalContainer: {
      width: '90%',
      maxWidth: 400,
      backgroundColor: colors.card,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 24,
      alignItems: 'center',
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: isDark ? 0.4 : 0.15,
      shadowRadius: 24,
      elevation: 10,
    },
    iconCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: iconDetails.border,
      backgroundColor: iconDetails.bg,
      marginBottom: 18,
    },
    title: {
      fontSize: 19,
      fontWeight: '800',
      color: colors.text,
      textAlign: 'center',
      fontFamily: 'LexendZetta_400Regular',
      marginBottom: 10,
      letterSpacing: -0.5,
    },
    message: {
      fontSize: 14,
      color: colors.textMuted,
      textAlign: 'center',
      lineHeight: 20,
      fontFamily: 'NotoSans_400Regular',
      marginBottom: 24,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: 12,
      width: '100%',
      justifyContent: 'center',
    },
    btn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: 'transparent',
      cursor: 'pointer',
    },
    btnConfirm: {
      backgroundColor: config.dangerMode ? '#EF4444' : colors.primary,
    },
    btnCancel: {
      backgroundColor: colors.surfaceSecondary,
      borderColor: colors.border,
    },
    btnTextConfirm: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '700',
    },
    btnTextCancel: {
      color: colors.textMuted,
      fontSize: 14,
      fontWeight: '700',
    },
  });

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      <Modal
        transparent
        visible={visible}
        animationType="none"
        onRequestClose={handleCancel}
      >
        <Pressable style={styles.backdrop} onPress={handleBackdropPress}>
          <Animated.View
            style={[
              styles.modalContainer,
              {
                transform: [{ scale: scaleAnim }],
                opacity: fadeAnim,
              },
            ]}
            onStartShouldSetResponder={() => true}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <View style={styles.iconCircle}>
              <Ionicons name={iconDetails.name} size={36} color={iconDetails.color} />
            </View>
            {!!config.title && <Text style={styles.title}>{config.title}</Text>}
            {!!config.message && <Text style={styles.message}>{config.message}</Text>}
            <View style={styles.buttonRow}>
              {config.isConfirm && (
                <Pressable
                  style={({ hovered, pressed }) => [
                    styles.btn,
                    styles.btnCancel,
                    hovered && { opacity: 0.9 },
                    pressed && { opacity: 0.8 },
                  ]}
                  onPress={handleCancel}
                >
                  <Text style={styles.btnTextCancel}>{config.cancelText}</Text>
                </Pressable>
              )}
              <Pressable
                style={({ hovered, pressed }) => [
                  styles.btn,
                  styles.btnConfirm,
                  hovered && { opacity: 0.9 },
                  pressed && { opacity: 0.8 },
                  !config.isConfirm && { maxWidth: 160 },
                ]}
                onPress={handleConfirm}
              >
                <Text style={styles.btnTextConfirm}>{config.confirmText}</Text>
              </Pressable>
            </View>
          </Animated.View>
        </Pressable>
      </Modal>
    </AlertContext.Provider>
  );
}

export const useAlert = () => useContext(AlertContext);

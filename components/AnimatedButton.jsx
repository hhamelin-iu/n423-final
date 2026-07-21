import { Animated, Pressable, Text, Platform, StyleSheet } from 'react-native';
import { useState, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../styles/theme';

export default function AnimatedButton({ title, onPress, buttonStyle, textStyle, gradientColors }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [pressed, setPressed] = useState(false);
  const { colors } = useTheme();

  const activeGradient = gradientColors || [colors.primaryDark, colors.primary];

  const onPressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: Platform.OS !== 'web',
      speed: 60,
      bounciness: 10,
      overshootClamping: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: Platform.OS !== 'web',
      speed: 30,
      bounciness: 10,
      overshootClamping: true,
    }).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, buttonStyle]}>
      <Pressable
        onPressIn={() => {
          setPressed(true);
          onPressIn();
        }}
        onPressOut={() => {
          onPressOut();
          setTimeout(() => setPressed(false), 150);
        }}
        onPress={onPress}
        android_disableSound={true}
        style={({ hovered }) => [
          styles.buttonWrapper,
          hovered && styles.hovered,
          pressed && styles.pressed,
        ]}
      >
        <LinearGradient
          colors={activeGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientContainer}
        >
          <Text style={[styles.text, textStyle]}>{title}</Text>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  buttonWrapper: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 14,
    overflow: 'hidden',
    alignSelf: 'center',
    marginTop: 10,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  hovered: {
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  pressed: {
    opacity: 0.9,
  },
  gradientContainer: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    userSelect: 'none',
    letterSpacing: 0.3,
  },
});

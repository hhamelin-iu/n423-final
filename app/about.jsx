import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';

import { useTheme } from '../styles/theme';
import Footer from "../components/Footer";
import { useDevice } from "../app/device-context";

import AboutImage from '../assets/about.png';

export default function AboutScreen() {
    const { isDesktopWeb } = useDevice();
    const theme = useTheme();

    return (
        <ScrollView contentContainerStyle={theme.scrollContainer}>
            <View style={theme.mainContainer}>
                <Text style={[theme.title, { textAlign: "center" }]}>About LOREBoards</Text>
                
                <Text style={[theme.body, styles.leadText]}>
                    LOREBoards is a responsive, gaming community platform designed for gamers to track, share, and showcase their game completion milestones, high scores, and personal playthrough notes.
                </Text>

                <View style={styles.cardSection}>
                    <View style={styles.infoCard}>
                        <Text style={styles.cardHeader}>🎮 Track & Showcase</Text>
                        <Text style={styles.cardBody}>
                            Log your finished playthroughs, 100% completion achievements, and speedrun records. Include developer details, platform badges, release years, and custom player notes.
                        </Text>
                    </View>

                    <View style={styles.infoCard}>
                        <Text style={styles.cardHeader}>🔍 Smart IGDB Integration</Text>
                        <Text style={styles.cardBody}>
                            Seamlessly auto-fill game metadata, cover art, and platform data using IGDB integration with offline fallback data for instant search previews.
                        </Text>
                    </View>

                    <View style={styles.infoCard}>
                        <Text style={styles.cardHeader}>⚡ Responsive & Cross-Platform</Text>
                        <Text style={styles.cardBody}>
                            Built with React Native Web and Expo Router, delivering an optimized experience across desktop monitors and mobile devices with fluid layout adaptations.
                        </Text>
                    </View>
                </View>

                {AboutImage && (
                    <Image
                        source={AboutImage}
                        style={styles.image}
                        resizeMode="contain"
                    />
                )}
            </View>
            {isDesktopWeb && <Footer />}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    leadText: {
        width: "100%",
        maxWidth: 900,
        marginHorizontal: "auto",
        textAlign: "center",
        fontSize: 18,
        lineHeight: 28,
        color: "#374151",
        marginBottom: 32,
    },
    cardSection: {
        width: "100%",
        maxWidth: 1000,
        marginHorizontal: "auto",
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 20,
        justifyContent: "center",
        marginBottom: 30,
    },
    infoCard: {
        flex: 1,
        minWidth: 280,
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 20,
        borderWidth: 1.5,
        borderColor: "#E5E7EB",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    cardHeader: {
        fontSize: 20,
        fontWeight: "700",
        color: "#4F46E5",
        marginBottom: 10,
    },
    cardBody: {
        fontSize: 15,
        color: "#4B5563",
        lineHeight: 22,
    },
    image: {
        aspectRatio: 650 / 500,
        width: "100%",
        maxWidth: 600,
        height: 'auto',
        marginVertical: 20,
        alignSelf: 'center',
        borderRadius: 16,
    }
});

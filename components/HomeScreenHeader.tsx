import { ASSETS } from "@/constants/assets";
import { useProfile } from "@/context/ProfileContext";
import { useTheme } from "@react-navigation/native";
import * as Haptics from 'expo-haptics';
import { Image } from "expo-image";
import { router } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function HomeScreenHeader() {
    const { profile } = useProfile();
    const theme = useTheme();
    const { top } = useSafeAreaInsets();

    const handleAvatarPress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push('/settings');
    }

    return (
        <View style={[styles.container, { paddingTop: top }]}>
            <Image source={ASSETS.logo} style={{ height: 32, width: 32 }} contentFit="contain" />

            <View style={styles.rightContainer}>
                <Text style={[styles.greeting, { color: theme.colors.text }]}>
                    Hey, <Text style={[styles.greeting, styles.greetingNickname, { color: theme.colors.text }]}>
                        {profile.nickname} 👋
                    </Text>
                </Text>
                <TouchableOpacity
                    style={[
                        styles.avatarContainer,
                        { backgroundColor: theme.colors.primary }
                    ]}
                    onPress={handleAvatarPress}
                    activeOpacity={0.8} >

                    {profile.ssoAvatarUrl && profile.ssoAvatarUrl !== '' ? (
                        <Image source={{ uri: profile.ssoAvatarUrl }}
                            style={styles.avatarImage} contentFit="contain" />
                    ) : (
                        <Text style={styles.avatarInitial}>{profile.nickname.charAt(0)}</Text>
                    )}
                </TouchableOpacity>
            </View>

        </View>
    );


}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginVertical: 12,
    },

    rightContainer: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center',
    },

    greeting: {
        fontSize: 18,
    },

    greetingNickname: {
        fontWeight: '600',
    },

    avatarContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
        width: 40,
        height: 40,
        overflow: 'hidden',
    },

    avatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: 12,
    },

    avatarInitial: {
        fontSize: 18,
        fontWeight: '600',
    },

})
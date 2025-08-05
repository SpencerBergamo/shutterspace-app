import { useProfile } from "@/context/ProfileContext";
import { useTheme } from "@/context/ThemeContext";
import * as Haptics from 'expo-haptics';
import { Image } from "expo-image";
import { router } from "expo-router";
import { Hexagon } from "lucide-react-native";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";


/*  <Image source={ASSETS.logoSimple}
                    style={{ height: 32, width: 32 }}
                    contentFit="contain" /> 
*/

export default function HomeScreenHeader() {
    const { profile } = useProfile();
    const { themeStyles } = useTheme();
    const { top } = useSafeAreaInsets();

    const handleAvatarPress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push('/settings');
    }

    return (
        <View style={[styles.container, { paddingTop: top }]}>
            <Hexagon size={32} color={themeStyles.colors.text} />

            <View style={styles.rightContainer}>
                <Text style={[styles.greeting, { color: themeStyles.colors.text }]}>
                    Hey, <Text style={[styles.greeting, styles.greetingNickname, { color: themeStyles.colors.text }]}>
                        {profile.nickname}
                    </Text>
                </Text>
                <TouchableOpacity
                    style={[
                        styles.avatarContainer,
                        { width: 48, height: 48, backgroundColor: themeStyles.colors.accent }
                    ]}
                    onPress={handleAvatarPress}
                    activeOpacity={0.8} >

                    {profile.avatarUrl && profile.avatarUrl !== '' ? (
                        <Image source={{ uri: profile.avatarUrl }}
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
        borderRadius: 16,
        overflow: 'hidden',
    },

    avatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: 16,
    },

    avatarInitial: {
        fontSize: 18,
        fontWeight: '600',
    },

})
import * as Haptics from 'expo-haptics';
import { Image } from "expo-image";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { useAppTheme } from "../context/AppThemeContext";

interface AvatarProps {
    nickname: string;
    avatarKey?: string;
    ssoAvatarUrl?: string;
    localUri?: string;
    size?: number;
    onPress?: () => void;
}

export default function Avatar({
    nickname,
    avatarKey,
    ssoAvatarUrl,
    localUri,
    onPress,
}: AvatarProps) {
    const { colors } = useAppTheme();

    const avatarBaseUrl = 'https://avatar.shutterspace.app';

    async function handlePress() {
        if (onPress) {
            await Haptics.selectionAsync();
            onPress();
        }
    }

    return (
        <TouchableOpacity onPress={handlePress} style={[styles.container, { backgroundColor: colors.secondary + '60', borderColor: colors.border }]}>
            {ssoAvatarUrl ? (
                <Image
                    source={{ uri: ssoAvatarUrl }}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                />
            ) : avatarKey ? (
                <Image
                    source={{ uri: `${avatarBaseUrl}/${avatarKey}` }}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                />
            ) : localUri ? (
                <Image
                    source={{ uri: localUri }}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                />
            ) : (
                <Text style={styles.initial}>{nickname.charAt(0)}</Text>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        width: 40,
        height: 40,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },

    initial: {
        fontSize: 18,
        fontWeight: '600',
    },

})
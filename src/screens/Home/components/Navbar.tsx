import Avatar from "@/src/components/Avatar";
import { useAppTheme } from "@/src/context/AppThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface HeaderLeftComponentProps {
    nickname: string;
    avatarKey?: string;
    onPress: () => void;
    onCompleteProfilePress: () => void;
}

export function HeaderLeftComponent({
    nickname,
    avatarKey,
    onPress,
    onCompleteProfilePress,
}: HeaderLeftComponentProps) {
    const { colors } = useAppTheme();

    return (
        <View style={styles.headerLeft}>
            <Avatar
                nickname={nickname}
                avatarKey={avatarKey}
                onPress={onPress}
            />
            <View style={styles.greetingContainer}>
                <Text style={[styles.greeting, { color: colors.text }]}>
                    Hi, {nickname}
                </Text>
                {!avatarKey && (
                    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }} onPress={onCompleteProfilePress}>

                        <Text style={[styles.completeProfile, { color: colors.primary }]}>
                            Complete profile
                        </Text>
                        <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    // Header Left
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatarContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
        width: 40,
        height: 40,
        overflow: 'hidden',
    },
    avatarInitial: {
        fontSize: 18,
        fontWeight: '600',
    },
    greetingContainer: {
        flexDirection: 'column',
        justifyContent: 'center',
    },
    greeting: {
        fontSize: 16,
        fontWeight: '500',
        lineHeight: 16,
    },
    completeProfile: {
        fontSize: 12,
        fontWeight: '500',
        lineHeight: 16,
    },

})
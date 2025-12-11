import { useAppTheme } from "@/src/context/AppThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface AddFriendsPromptProps {
    friendCount: number;
    onPress: () => void;
}

export function AddFriendsPrompt({ friendCount, onPress }: AddFriendsPromptProps) {
    const { colors } = useAppTheme();

    const getPromptText = () => {
        if (friendCount === 0) {
            return {
                title: "Add your first friend",
                description: "Share your QR code to start connecting"
            };
        }
        return {
            title: `${friendCount} ${friendCount === 1 ? 'friend' : 'friends'} added`,
            description: "Keep growing your network!"
        };
    };

    const { title, description } = getPromptText();

    return (
        <TouchableOpacity
            style={[styles.container, { borderColor: colors.border }]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <Ionicons name="people-outline" size={22} color={colors.grey1} />
                </View>

                <View style={styles.textContainer}>
                    <Text style={[styles.title, { color: colors.text }]}>
                        {title}
                    </Text>
                    <Text style={[styles.description, { color: colors.text }]} numberOfLines={1}>
                        {description}
                    </Text>
                </View>

                <View style={[styles.qrBadge, { backgroundColor: colors.background }]}>
                    <Ionicons name="chevron-forward" size={20} color={colors.grey1} />
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    textContainer: {
        flex: 1,
        gap: 2,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        lineHeight: 20,
    },
    description: {
        fontSize: 14,
        fontWeight: '400',
        lineHeight: 18,
        opacity: 0.7,
    },
    qrBadge: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

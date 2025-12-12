import { useAppTheme } from "@/src/context/AppThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Switch, Text, View } from "react-native";

interface OpenInvitesFieldProps {
    openInvites: boolean | undefined;
    onToggle: (openInvites: boolean) => void;
}

export default function OpenInvitesField({ openInvites, onToggle }: OpenInvitesFieldProps) {
    const { colors } = useAppTheme();

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <View style={styles.titleContainer}>
                    <Ionicons name="key-outline" size={16} color={colors.text} />
                    <Text style={styles.title}>Open Invites</Text>
                </View>

                <Text style={{ flexShrink: 1 }}>
                    {openInvites ?
                        'All members can invite new members'
                        : 'Only you or moderators can invite new members'}
                </Text>
            </View>

            <Switch
                value={openInvites}
                onValueChange={onToggle}
                trackColor={{ true: colors.primary }} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: 16,
        backgroundColor: '#e9ecef',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
    },

    content: {
        flex: 1,
        flexDirection: 'column',
        gap: 4,
    },

    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },

    title: {
        fontSize: 16,
        fontWeight: '600',
    }
});
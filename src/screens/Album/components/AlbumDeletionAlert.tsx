import { Ionicons } from "@expo/vector-icons";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";


interface AlbumDeletionAlertProps {
    isHost: boolean;
    deletionDate: string;
    isCancelingDeletion: boolean;
    handleCancelDeletion: () => void;
}

export default function AlbumDeletionAlert({
    isHost,
    deletionDate,
    isCancelingDeletion,
    handleCancelDeletion,
}: AlbumDeletionAlertProps) {

    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <View style={styles.iconContainer}>
                    <Ionicons name="alert-circle" size={24} color="#FF3B30" />
                </View>
                <View style={styles.headerText}>
                    <Text style={styles.title}>
                        {isHost ? 'Scheduled for Deletion' : 'Album Deleted'}
                    </Text>
                    <Text style={styles.subtitle}>
                        {isHost ? (
                            deletionDate
                                ? `Deletes on ${deletionDate}`
                                : 'Scheduled for permanent deletion'
                        ) : (
                            'Deleted by host'
                        )}
                    </Text>
                </View>
            </View>

            {isHost && (
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => {
                            Alert.alert(
                                'Restore Album',
                                'Cancel the scheduled deletion and restore full access to this album?',
                                [
                                    { text: 'Cancel', style: 'cancel' },
                                    {
                                        text: 'Restore',
                                        onPress: handleCancelDeletion,
                                    },
                                ]
                            );
                        }}
                        disabled={isCancelingDeletion}
                    >
                        <Ionicons name="arrow-undo" size={18} color="#007AFF" />
                        <Text style={styles.buttonText}>
                            {isCancelingDeletion ? 'Restoring...' : 'Restore Album'}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        margin: 16,
        marginBottom: 8,
        backgroundColor: '#FFF5F5',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#FFD0D0',
        padding: 16,
        shadowColor: '#FF3B30',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFE5E5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerText: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FF3B30',
        marginBottom: 2,
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
    },
    actions: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#FFD0D0',
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 10,
        gap: 8,
        borderWidth: 1.5,
        borderColor: '#007AFF',
    },
    buttonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#007AFF',
    },
})
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAppTheme } from "@/src/context/AppThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "convex/react";
import * as Haptics from 'expo-haptics';
import { useState } from "react";
import { ActivityIndicator, Alert, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { AlbumFriendSelector } from "./AlbumFriendSelector";
import { AlbumQRCode } from "./AlbumQRCode";

interface AddMemberModalProps {
    visible: boolean;
    albumId: Id<'albums'>;
    onClose: () => void;
}

type TabType = 'qr' | 'friends';

export function AddMemberModal({ visible, albumId, onClose }: AddMemberModalProps) {
    const { colors } = useAppTheme();
    const [activeTab, setActiveTab] = useState<TabType>('qr');
    const [selectedFriends, setSelectedFriends] = useState<Id<'profiles'>[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const addMembers = useMutation(api.albumMembers.addMembers);

    const handleAddMembers = async () => {
        if (selectedFriends.length === 0) return;

        setIsAdding(true);
        try {
            await addMembers({ albumId, newMembers: selectedFriends });
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Success', `Added ${selectedFriends.length} friend${selectedFriends.length > 1 ? 's' : ''} to the album`);
            setSelectedFriends([]);
            onClose();
        } catch (error) {
            console.error('Failed to add members:', error);
            Alert.alert('Error', 'Failed to add members. Please try again.');
        } finally {
            setIsAdding(false);
        }
    };

    const handleTabChange = (tab: TabType) => {
        setActiveTab(tab);
        Haptics.selectionAsync();
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                {/* Header */}
                <View style={[styles.header, { borderBottomColor: colors.border }]}>
                    <Pressable onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close" size={24} color={colors.text} />
                    </Pressable>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Add Members</Text>
                    <View style={styles.closeButton} />
                </View>

                {/* Tab Selector */}
                <View style={[styles.tabContainer, { borderBottomColor: colors.border }]}>
                    <Pressable
                        style={[
                            styles.tab,
                            activeTab === 'qr' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }
                        ]}
                        onPress={() => handleTabChange('qr')}
                    >
                        <Ionicons 
                            name="qr-code" 
                            size={20} 
                            color={activeTab === 'qr' ? colors.primary : colors.caption} 
                        />
                        <Text style={[
                            styles.tabText,
                            { color: activeTab === 'qr' ? colors.primary : colors.caption }
                        ]}>
                            Share Invite
                        </Text>
                    </Pressable>

                    <Pressable
                        style={[
                            styles.tab,
                            activeTab === 'friends' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }
                        ]}
                        onPress={() => handleTabChange('friends')}
                    >
                        <Ionicons 
                            name="people" 
                            size={20} 
                            color={activeTab === 'friends' ? colors.primary : colors.caption} 
                        />
                        <Text style={[
                            styles.tabText,
                            { color: activeTab === 'friends' ? colors.primary : colors.caption }
                        ]}>
                            Add Friends
                        </Text>
                    </Pressable>
                </View>

                {/* Content */}
                <View style={styles.content}>
                    {activeTab === 'qr' ? (
                        <AlbumQRCode albumId={albumId} />
                    ) : (
                        <AlbumFriendSelector 
                            albumId={albumId} 
                            onSelectedChange={setSelectedFriends}
                        />
                    )}
                </View>

                {/* Footer - Show only for friends tab */}
                {activeTab === 'friends' && (
                    <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
                        <Pressable
                            style={[
                                styles.addButton,
                                { backgroundColor: colors.primary },
                                (selectedFriends.length === 0 || isAdding) && styles.addButtonDisabled
                            ]}
                            onPress={handleAddMembers}
                            disabled={selectedFriends.length === 0 || isAdding}
                        >
                            {isAdding ? (
                                <ActivityIndicator size="small" color="white" />
                            ) : (
                                <>
                                    <Ionicons name="person-add" size={20} color="white" />
                                    <Text style={styles.addButtonText}>
                                        Add {selectedFriends.length > 0 ? `(${selectedFriends.length})` : 'Friends'}
                                    </Text>
                                </>
                            )}
                        </Pressable>
                    </View>
                )}
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    closeButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    tabContainer: {
        flexDirection: 'row',
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
    },
    tabText: {
        fontSize: 15,
        fontWeight: '600',
    },
    content: {
        flex: 1,
    },
    footer: {
        padding: 16,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        borderRadius: 12,
    },
    addButtonDisabled: {
        opacity: 0.5,
    },
    addButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});

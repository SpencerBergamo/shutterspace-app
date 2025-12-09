import { api } from "@/convex/_generated/api";
import Avatar from "@/src/components/Avatar";
import { useAppTheme } from "@/src/context/AppThemeContext";
import { useProfile } from "@/src/context/ProfileContext";
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from "convex/react";
import { BlurView } from "expo-blur";
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Animated, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";


export function ProfileInviteScreen() {
    const { colors } = useAppTheme();
    const { profile } = useProfile();
    const { code }: { code: string } = useLocalSearchParams<{ code: string }>();

    // Convex
    const user = useQuery(api.profile.getUserByShareCode, { code });
    const addFriend = useMutation(api.friendships.sendFriendRequest);
    const friendships = useQuery(api.friendships.getFriendships);
    const areFriends = friendships?.some(friendship => friendship.senderId === user?._id || friendship.recipientId === user?._id);

    // States
    const [isAddingFriend, setIsAddingFriend] = useState(false);
    const [requestSent, setRequestSent] = useState(false);

    // Animations
    const scaleAnim = useState(new Animated.Value(0))[0];
    const fadeAnim = useState(new Animated.Value(0))[0];

    useEffect(() => {
        if (user) {
            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    tension: 50,
                    friction: 7,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                })
            ]).start();
        }
    }, [user]);

    const handleAddFriend = async () => {
        if (areFriends || !user || isAddingFriend || user._id === profile?._id) return;

        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setIsAddingFriend(true);

        try {
            await addFriend({ friendId: user._id });
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setRequestSent(true);

            setTimeout(() => {
                router.back();
            }, 1500);
        } catch (e) {
            console.error(e);
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Error', 'Failed to send friend request');
            setIsAddingFriend(false);
        }
    };

    const handleClose = async () => {
        await Haptics.selectionAsync();
        router.back();
    };

    return (
        <BlurView style={StyleSheet.absoluteFillObject} intensity={80} tint="dark">
            <Pressable style={styles.overlay} onPress={handleClose}>
                <Animated.View
                    style={[
                        styles.card,
                        { backgroundColor: colors.background },
                        {
                            transform: [{ scale: scaleAnim }],
                            opacity: fadeAnim,
                        }
                    ]}
                >
                    <Pressable onPress={(e) => e.stopPropagation()}>
                        {/* Close Button */}
                        <TouchableOpacity
                            style={[styles.closeButton, { backgroundColor: colors.grey2 }]}
                            onPress={handleClose}
                        >
                            <Ionicons name="close" size={20} color={colors.text} />
                        </TouchableOpacity>

                        {user === undefined ? (
                            // Loading state
                            <View style={styles.content}>
                                <ActivityIndicator size="large" color={colors.primary} />
                            </View>
                        ) : user === null ? (
                            // User not found
                            <View style={styles.content}>
                                <Ionicons name="alert-circle-outline" size={64} color={colors.caption} />
                                <Text style={[styles.title, { color: colors.text, marginTop: 16 }]}>
                                    Profile Not Found
                                </Text>
                                <Text style={[styles.description, { color: colors.caption }]}>
                                    This invite code is invalid or expired
                                </Text>
                            </View>
                        ) : user._id === profile?._id ? (
                            // User is the same as the current user
                            <View style={styles.content}>
                                <Text style={[styles.title, { color: colors.text, marginTop: 16 }]}>
                                    You cannot add yourself as a friend, silly!
                                </Text>
                            </View>
                        ) : (
                            // User found
                            <View style={styles.content}>
                                {/* Avatar with glow effect */}
                                <View style={[styles.avatarContainer, { shadowColor: colors.primary }]}>
                                    <View style={{ transform: [{ scale: 1.5 }] }}>
                                        <Avatar
                                            nickname={user.nickname}
                                            avatarKey={user.avatarKey}
                                            ssoAvatarUrl={user.ssoAvatarUrl}
                                        />
                                    </View>
                                </View>

                                {/* User Info */}
                                <View style={styles.userInfo}>
                                    <Text style={[styles.nickname, { color: colors.text }]}>
                                        {user.nickname}
                                    </Text>
                                    <Text style={[styles.label, { color: colors.caption }]}>
                                        wants to connect on ShutterSpace
                                    </Text>
                                </View>

                                {/* Action Buttons */}
                                <View style={styles.actions}>
                                    {areFriends ? (
                                        <View style={[styles.statusBadge, { backgroundColor: colors.secondary + '40', borderColor: colors.border }]}>
                                            <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                                            <Text style={[styles.statusText, { color: colors.text }]}>
                                                Already Friends
                                            </Text>
                                        </View>
                                    ) : requestSent ? (
                                        <View style={[styles.statusBadge, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}>
                                            <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                                            <Text style={[styles.statusText, { color: colors.primary }]}>
                                                Friend Request Sent!
                                            </Text>
                                        </View>
                                    ) : (
                                        <>
                                            <TouchableOpacity
                                                style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                                                onPress={handleAddFriend}
                                                disabled={isAddingFriend}
                                            >
                                                {isAddingFriend ? (
                                                    <ActivityIndicator size="small" color="white" />
                                                ) : (
                                                    <>
                                                        <Ionicons name="person-add" size={20} color="white" />
                                                        <Text style={styles.primaryButtonText}>
                                                            Send Friend Request
                                                        </Text>
                                                    </>
                                                )}
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                style={[styles.secondaryButton, { backgroundColor: colors.grey2 }]}
                                                onPress={handleClose}
                                            >
                                                <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
                                                    Maybe Later
                                                </Text>
                                            </TouchableOpacity>
                                        </>
                                    )}
                                </View>
                            </View>
                        )}
                    </Pressable>
                </Animated.View>
            </Pressable>
        </BlurView>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    card: {
        borderRadius: 24,
        width: '100%',
        maxWidth: 400,
        paddingVertical: 32,
        paddingHorizontal: 24,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 12,
    },
    closeButton: {
        position: 'absolute',
        top: -8,
        right: -8,
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    content: {
        alignItems: 'center',
        gap: 20,
    },
    avatarContainer: {
        marginTop: 8,
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    userInfo: {
        alignItems: 'center',
        gap: 6,
    },
    nickname: {
        fontSize: 28,
        fontWeight: '700',
        letterSpacing: -0.5,
    },
    label: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
    },
    description: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 20,
        paddingHorizontal: 16,
    },
    actions: {
        width: '100%',
        gap: 12,
        marginTop: 8,
    },
    primaryButton: {
        width: '100%',
        flexDirection: 'row',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    primaryButtonText: {
        color: 'white',
        fontSize: 17,
        fontWeight: '600',
    },
    secondaryButton: {
        width: '100%',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        borderWidth: 1,
    },
    statusText: {
        fontSize: 17,
        fontWeight: '600',
    },
});

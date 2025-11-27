import { useFriends } from "@/context/FriendsContext";
import { api } from "@/convex/_generated/api";
import useAppStyles from "@/hooks/useAppStyles";
import { useMutation, useQuery } from "convex/react";
import { BlurView } from "expo-blur";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from "react-native-reanimated";

const SPRING_CONFIG = {
    damping: 20,
    stiffness: 300,
};

const DISMISS_THRESHOLD = 100;

export default function ShareIdScreen() {
    const { colorScheme } = useAppStyles();
    const { code }: { code: string } = useLocalSearchParams<{ code: string }>();
    const { friendships } = useFriends();

    const areFriends = friendships?.some(friendship => friendship.senderId === user?._id || friendship.recipientId === user?._id);

    // States
    const [isAddingFriend, setIsAddingFriend] = useState(false);

    // Animation values
    const translateY = useSharedValue(500);
    const opacity = useSharedValue(0);

    // Convex
    const user = useQuery(api.profile.getUserByShareCode, { code });
    const addFriend = useMutation(api.friendships.sendFriendRequest);

    useEffect(() => {
        translateY.value = withSpring(0, SPRING_CONFIG);
        opacity.value = withTiming(1, { duration: 200 });
    }, []);

    const handleClose = () => {
        translateY.value = withTiming(500, { duration: 250 });
        opacity.value = withTiming(0, { duration: 200 });
        setTimeout(() => router.back(), 250);
    };

    const panGesture = Gesture.Pan()
        .onUpdate((event) => {
            if (event.translationY > 0) {
                translateY.value = event.translationY;
            }
        })
        .onEnd((event) => {
            if (event.translationY > DISMISS_THRESHOLD) {
                translateY.value = withTiming(500, { duration: 250 });
                opacity.value = withTiming(0, { duration: 200 });
                runOnJS(setTimeout)(() => router.back(), 250);
            } else {
                translateY.value = withSpring(0, SPRING_CONFIG);
            }
        });

    const tapGesture = Gesture.Tap().onEnd(() => {
        runOnJS(handleClose)();
    });

    const animatedBackdrop = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    const animatedSheet = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    const handleAddFriend = async () => {
        if (areFriends || !user) return;
        setIsAddingFriend(true);

        try {
            await addFriend({ friendId: user._id });
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Failed to add friend');
        } finally {
            setIsAddingFriend(false);
            setTimeout(() => router.back(), 300);
        }
    };

    return (
        <View style={styles.overlay}>
            <GestureDetector gesture={tapGesture}>
                <Animated.View style={[styles.backdrop, animatedBackdrop]}>
                    <BlurView intensity={20} style={StyleSheet.absoluteFillObject} />
                </Animated.View>
            </GestureDetector>

            <GestureDetector gesture={panGesture}>
                <Animated.View style={[styles.sheetContainer, animatedSheet]}>
                    <View style={[styles.sheet, { backgroundColor: colorScheme.background }]}>
                        {/* Drag handle */}
                        <View style={styles.handleContainer}>
                            <View style={[styles.handle, { backgroundColor: colorScheme.border }]} />
                        </View>

                        {/* Content */}
                        {user === undefined ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color={colorScheme.primary} />
                            </View>
                        ) : user === null ? (
                            <View style={styles.contentContainer}>
                                <Text style={[styles.errorText, { color: colorScheme.text }]}>
                                    User not found
                                </Text>
                            </View>
                        ) : (
                            <View style={styles.contentContainer}>
                                {/* Avatar */}
                                <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: colorScheme.border }]}>
                                    <Text style={[styles.avatarInitial, { color: colorScheme.text }]}>
                                        {user.nickname?.charAt(0).toUpperCase() || '?'}
                                    </Text>
                                </View>

                                {/* Nickname */}
                                <Text style={[styles.nickname, { color: colorScheme.text }]}>
                                    {user.nickname || 'Unknown User'}
                                </Text>

                                {/* Add Friend Button */}
                                <Pressable
                                    style={({ pressed }) => [
                                        styles.addButton,
                                        { backgroundColor: colorScheme.primary, opacity: pressed ? 0.8 : 1 },
                                    ]}
                                    onPress={handleAddFriend}
                                    disabled={isAddingFriend}
                                >
                                    {isAddingFriend ? (
                                        <ActivityIndicator size="small" color="white" />
                                    ) : (
                                        <Text style={styles.addButtonText}>{areFriends ? 'Already Friends' : 'Add Friend'}</Text>
                                    )}
                                </Pressable>
                            </View>
                        )}
                    </View>
                </Animated.View>
            </GestureDetector>
        </View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    sheetContainer: {
        paddingHorizontal: 16,
        paddingBottom: 40,
    },
    sheet: {
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 5,
    },
    handleContainer: {
        alignItems: 'center',
        paddingTop: 12,
        paddingBottom: 8,
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
    },
    loadingContainer: {
        padding: 60,
        alignItems: 'center',
        justifyContent: 'center',
    },
    contentContainer: {
        padding: 32,
        alignItems: 'center',
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 16,
    },
    avatarPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitial: {
        fontSize: 40,
        fontWeight: '600',
    },
    nickname: {
        fontSize: 24,
        fontWeight: '600',
        marginBottom: 24,
    },
    addButton: {
        paddingVertical: 14,
        paddingHorizontal: 48,
        borderRadius: 12,
        minWidth: 200,
        alignItems: 'center',
    },
    addButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    errorText: {
        fontSize: 18,
        textAlign: 'center',
        paddingVertical: 40,
    },
});

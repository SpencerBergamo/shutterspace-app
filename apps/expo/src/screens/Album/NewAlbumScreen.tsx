import { api } from "@shutterspace/backend/convex/_generated/api";
import { Id } from "@shutterspace/backend/convex/_generated/dataModel";
import Avatar from "@/src/components/Avatar";
import FloatingActionButton from "@/src/components/FloatingActionButton";
import { TextInputStyles } from "@/src/constants/styles";
import { useAppTheme } from "@/src/context/AppThemeContext";
import { Friend } from "@/src/types/Friend";
import { validateAlbumTitle } from "@/src/utils/validators";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@react-navigation/native";
import { useMutation, useQuery } from "convex/react";
import { router, Stack } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";

type FormData = {
    title: string;
    description: string | undefined;
    openInvites: boolean;
}

export function NewAlbumScreen() {
    const theme = useTheme();
    const { colors } = useAppTheme();

    // Data
    const friends = useQuery(api.friendships.getListOfFriends);
    const createNewAlbum = useMutation(api.albums.createNewAlbum);

    const titleInputRef = useRef<TextInput>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFriendIds, setSelectedFriendIds] = useState<Set<Id<'profiles'>>>(new Set());

    const {
        control,
        handleSubmit,
        formState: { errors, isValid },
        reset,
    } = useForm<FormData>({
        mode: 'onChange',
        defaultValues: {
            title: '',
            description: '',
            openInvites: true,
        }
    });

    // focus title input manually
    useEffect(() => {
        setTimeout(() => {
            titleInputRef.current?.focus();
        }, 600);
    }, [titleInputRef]);

    // Filter friends based on search query
    const filteredFriends = friends?.filter((friend) =>
        friend.nickname.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const toggleFriendSelection = (friendId: Id<'profiles'>) => {
        setSelectedFriendIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(friendId)) {
                newSet.delete(friendId);
            } else {
                newSet.add(friendId);
            }
            return newSet;
        });
    };

    const handleCreate = useCallback(async (data: FormData) => {
        setIsLoading(true);

        try {
            const albumId = await createNewAlbum({
                title: data.title,
                description: data.description,
                members: Array.from(selectedFriendIds),
            });

            router.replace(`/album/${albumId}`);
        } catch (e) {
            console.error("Failed to create album", e);
            Alert.alert("Failed to create album", "Please try again.");
        } finally {
            reset();
            setIsLoading(false);
        }
    }, [selectedFriendIds, createNewAlbum, reset]);

    const renderFriendItem = ({ item }: { item: Friend }) => {
        const isSelected = selectedFriendIds.has(item._id);

        const avatarUrl = item.ssoAvatarUrl || (item.avatarKey ? `https://avatar.shutterspace.app/${item.avatarKey}` : null);

        return (
            <Pressable
                style={[styles.friendTile, {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                }]}
                onPress={() => toggleFriendSelection(item._id)}
            >
                <View style={styles.friendInfo}>
                    {avatarUrl ? (
                        <View style={{ marginRight: 12 }}>
                            <Avatar
                                nickname={item.nickname}
                                avatarKey={item.avatarKey}
                                ssoAvatarUrl={item.ssoAvatarUrl}
                                size={40}
                            />
                        </View>
                    ) : (
                        <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
                            <Text style={[styles.avatarText, { color: colors.primary }]}>
                                {item.nickname.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                    )}
                    <Text style={[styles.friendName, { color: colors.text }]}>
                        {item.nickname}
                    </Text>
                </View>
                <View style={[styles.checkbox, {
                    backgroundColor: isSelected ? colors.primary : 'transparent',
                    borderColor: isSelected ? colors.primary : colors.border,
                }]}>
                    {isSelected && (
                        <Ionicons name="checkmark" size={18} color="white" />
                    )}
                </View>
            </Pressable>
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <Stack.Screen options={{
                headerTitle: 'New Album',
            }} />

            <KeyboardAvoidingView
                behavior={"padding"}
                style={{ flex: 1 }}
                keyboardVerticalOffset={100}
            >
                <View style={{ flex: 1 }}>
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Title Input */}
                        <Text style={[styles.inputLabel, { color: colors.text }]}>
                            Album Title
                        </Text>
                        <Controller
                            control={control}
                            name="title"
                            rules={{
                                required: "Title is required",
                                validate: validateAlbumTitle,
                            }}
                            render={({ field: { onChange, onBlur, value } }) => (
                                <TextInput
                                    ref={titleInputRef}
                                    placeholder="What's this album for?"
                                    value={value}
                                    autoCapitalize="words"
                                    autoCorrect={false}
                                    spellCheck={false}
                                    textAlign="left"
                                    keyboardType="default"
                                    returnKeyType="done"
                                    selectionColor={colors.primary}
                                    onChangeText={onChange}
                                    placeholderTextColor={colors.caption}
                                    onBlur={onBlur}
                                    onSubmitEditing={handleSubmit(handleCreate)}
                                    style={[TextInputStyles, {
                                        backgroundColor: colors.background,
                                        borderColor: colors.border,
                                        color: colors.text,
                                        marginBottom: 8
                                    }]} />
                            )}
                        />
                        {errors.title && (
                            <View style={styles.errorTextView}>
                                <Text style={{ color: "#FF3B30" }}>{errors.title.message}</Text>
                            </View>
                        )}

                        {/* Friends Section */}
                        <View style={styles.friendsSection}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                Add Friends
                            </Text>
                            <Text style={[styles.sectionSubtitle, { color: colors.caption }]}>
                                {selectedFriendIds.size} selected
                            </Text>
                        </View>

                        {/* Search Input */}
                        <TextInput
                            placeholder="Search friends..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            autoCapitalize="none"
                            autoCorrect={false}
                            returnKeyType="done"
                            selectionColor={theme.colors.primary}
                            placeholderTextColor={colors.caption}
                            style={{
                                borderWidth: 1,
                                borderRadius: 12,
                                backgroundColor: colors.background,
                                borderColor: colors.border,
                                color: colors.text,
                                fontSize: 12,
                                marginBottom: 12,
                                paddingHorizontal: 12,
                                paddingVertical: 8,
                            }}
                        />

                        <FlatList
                            data={filteredFriends ?? []}
                            renderItem={renderFriendItem}
                            keyExtractor={(item) => item._id}
                            scrollEnabled={false}
                            ListEmptyComponent={
                                !friends ? (
                                    <View style={styles.loadingState}>
                                        <Text style={[styles.emptyText, { color: colors.caption }]}>
                                            Nothing to show here
                                        </Text>
                                    </View>
                                ) : friends === undefined ? (
                                    <View style={styles.loadingState}>
                                        <Text style={[styles.emptyText, { color: colors.caption }]}>
                                            Loading friends...
                                        </Text>
                                    </View>
                                ) : (
                                    <View style={styles.loadingState}>

                                    </View>
                                )
                            }
                        />
                    </ScrollView>

                    <FloatingActionButton
                        selectIcon="checkmark"
                        onPress={handleSubmit(handleCreate)}
                        disabled={!isValid}
                        isLoading={isLoading}
                    />
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 32,
    },

    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },

    errorTextView: {
        height: 21,
        justifyContent: 'center',
        paddingHorizontal: 8,
        marginBottom: 8,
    },

    friendsSection: {
        marginTop: 8,
        marginBottom: 16,
    },

    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 4,
    },

    sectionSubtitle: {
        fontSize: 14,
    },

    friendTile: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 8,
    },

    friendInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },

    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },

    avatarText: {
        fontSize: 18,
        fontWeight: '600',
    },

    friendName: {
        fontSize: 16,
        fontWeight: '500',
    },

    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },

    loadingState: {
        paddingVertical: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },

    emptyText: {
        fontSize: 16,
    },
});

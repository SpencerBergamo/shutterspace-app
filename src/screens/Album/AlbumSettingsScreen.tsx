import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import FloatingActionButton from "@/src/components/FloatingActionButton";
import { TextInputStyles } from "@/src/constants/styles";
import { useAppTheme } from "@/src/context/AppThemeContext";
import { validateAlbumTitle } from "@/src/utils/validators";
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAction, useMutation, useQuery } from "convex/react";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { KeyboardAvoidingView, KeyboardAwareScrollView } from "react-native-keyboard-controller";
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { AlbumMemberCard } from "./components/AlbumMemberCard";

type FormData = {
    title: string;
    description: string | undefined;
    openInvites: boolean;
}

export function AlbumSettingsScreen() {
    const { albumId } = useLocalSearchParams<{ albumId: Id<'albums'> }>();
    const { colors } = useAppTheme();
    const profile = useQuery(api.profile.getUserProfile);
    const album = useQuery(api.albums.queryAlbum, { albumId });
    const albumMembers = useQuery(api.albumMembers.queryAllMemberships, { albumId });
    if (!profile || !album) return null;

    const updateAlbum = useMutation(api.albums.updateAlbum);
    const leaveAlbum = useMutation(api.albumMembers.leaveAlbum);
    const deleteAlbum = useAction(api.albums.deleteAlbum);

    const titleInputRef = useRef<TextInput>(null);
    const descriptionInputRef = useRef<TextInput>(null);
    const [isLeavingAlbum, setIsLeavingAlbum] = useState(false);
    const [isDeletingAlbum, setIsDeletingAlbum] = useState(false);

    const toastTranslateY = useSharedValue(-150);
    const toastOpacity = useSharedValue(0);

    const {
        control,
        handleSubmit,
        formState: { errors, isValid, isDirty },
        reset,
    } = useForm<FormData>({
        mode: 'onChange',
        defaultValues: {
            title: album.title,
            description: album.description,
            openInvites: album.openInvites,
        }
    })

    const handleLeaveAlbum = useCallback(async () => {
        if (!album || album.isDeleted) return;
        setIsLeavingAlbum(true);

        try {
            await leaveAlbum({ albumId });
        } catch (e) {
            console.error("Failed to leave album: ", e);
            Alert.alert("Error", "Failed to leave album. Please try again.");
        } finally {
            router.back();
            setIsLeavingAlbum(false);
        }
    }, []);

    const handleDeleteAlbum = useCallback(async () => {
        if (!album || album.isDeleted) return;
        setIsDeletingAlbum(true);

        try {
            await deleteAlbum({ albumId });
        } catch (e) {
            console.error("Failed to delete album: ", e);
            Alert.alert("Error", "Failed to delete album. Please try again.");
        } finally {
            router.back();
            setIsDeletingAlbum(false);
        }
    }, []);

    const showToast = useCallback(() => {
        toastOpacity.value = withTiming(1, { duration: 200 });
        toastTranslateY.value = withSpring(8, {
            damping: 15,
            stiffness: 150,
        });

        setTimeout(() => {
            toastOpacity.value = withTiming(0, { duration: 200 });
            toastTranslateY.value = withTiming(-150, { duration: 200 });
        }, 3000);
    }, []);

    const handleSaveChanges = useCallback(async (data: FormData) => {
        if (!isValid) return;

        try {
            titleInputRef.current?.blur();
            descriptionInputRef.current?.blur();

            await updateAlbum({
                albumId,
                title: data.title,
                description: data.description,
                openInvites: data.openInvites,
            });

            reset(data);
            showToast();
        } catch (e) {
            console.error("Failed to save changes: ", e);
            Alert.alert("Error", "Failed to save changes. Please try again.");

            titleInputRef.current?.focus();
        }
    }, [control, handleSubmit, isValid, showToast]);

    const toastAnimatedStyle = useAnimatedStyle(() => {
        return {
            opacity: toastOpacity.value,
            transform: [{ translateY: toastTranslateY.value }],
        };
    });

    return (
        <KeyboardAvoidingView
            behavior={"padding"}
            style={{ flex: 1, backgroundColor: colors.background, paddingTop: 16 }}
            keyboardVerticalOffset={60}
        >
            <View style={{ flex: 1 }}>
                {/* Toast Notification */}
                <Animated.View
                    style={[
                        styles.toast,
                        { backgroundColor: colors.text },
                        toastAnimatedStyle,
                    ]}
                    pointerEvents="none"
                >
                    <Ionicons name="checkmark-circle" size={20} color={colors.background} />
                    <Text style={[styles.toastText, { color: colors.background }]}>
                        Changes Saved
                    </Text>
                </Animated.View>
                <KeyboardAwareScrollView
                    keyboardShouldPersistTaps="handled"
                    style={{ flex: 1 }}
                >
                    <View style={styles.inputSection}>
                        <Text style={[styles.inputLabel, { color: colors.caption }]}>Album Name</Text>
                        <Controller
                            control={control}
                            name="title"
                            rules={{
                                required: 'Title is required',
                                validate: validateAlbumTitle,
                            }}
                            render={({ field: { onChange, onBlur, value } }) => (
                                <TextInput
                                    ref={titleInputRef}
                                    placeholder="Enter album title"
                                    placeholderTextColor={colors.caption + '80'}
                                    value={value}
                                    autoCapitalize="words"
                                    autoCorrect={false}
                                    spellCheck={false}
                                    textAlign="left"
                                    keyboardType="default"
                                    returnKeyType="done"
                                    selectionColor={colors.primary}
                                    onChangeText={onChange}
                                    onBlur={onBlur}
                                    onSubmitEditing={() => handleSubmit(handleSaveChanges)}
                                    style={[TextInputStyles, {
                                        marginHorizontal: 16,
                                        backgroundColor: colors.background,
                                        borderColor: colors.border,
                                        color: colors.text,
                                        fontSize: 16,
                                        fontWeight: '500',
                                    }]}
                                />
                            )}
                        />
                        {errors.title && (
                            <Text style={[styles.errorText, { color: '#FF3B30' }]}>
                                {errors.title.message}
                            </Text>
                        )}
                    </View>

                    <View style={styles.inputSection}>
                        <Text style={[styles.inputLabel, { color: colors.caption }]}>Description</Text>
                        <Controller
                            control={control}
                            name="description"
                            render={({ field: { onChange, onBlur, value } }) => (
                                <TextInput
                                    ref={descriptionInputRef}
                                    placeholder="What should your members know?"
                                    placeholderTextColor={colors.caption + '80'}
                                    value={value}
                                    autoCapitalize="sentences"
                                    autoCorrect={true}
                                    spellCheck={true}
                                    textAlign="left"
                                    keyboardType="default"
                                    returnKeyType="done"
                                    multiline
                                    numberOfLines={3}
                                    selectionColor={colors.primary}
                                    onChangeText={onChange}
                                    onBlur={onBlur}
                                    onSubmitEditing={() => handleSubmit(handleSaveChanges)}
                                    style={[TextInputStyles, {
                                        marginHorizontal: 16,
                                        backgroundColor: colors.background,
                                        borderColor: colors.border,
                                        borderStyle: value ? 'solid' : 'dashed',
                                        color: colors.text,
                                        minHeight: 80,
                                        paddingTop: 12,
                                        textAlignVertical: 'top',
                                    }]}
                                />
                            )}
                        />
                    </View>

                    {/* Members Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, { color: colors.caption }]}>Members</Text>

                            <View style={styles.sectionHeaderActions}>
                                {/* <Pressable
                                    style={[styles.actionButton, { borderColor: colors.border }]}
                                    onPress={() => { }}
                                >
                                    <Ionicons name="person-add" size={16} color={colors.caption} />
                                    <Text style={[styles.actionButtonText, { color: colors.caption }]}>Add</Text>
                                </Pressable> */}

                                <Pressable
                                    style={[styles.actionButton, { borderColor: colors.border }]}
                                    onPress={() => router.push({
                                        pathname: 'album/[albumId]/qr-code',
                                        params: { albumId },
                                    })}
                                >
                                    <Ionicons name="qr-code" size={16} color={colors.caption} />
                                    <Text style={[styles.actionButtonText, { color: colors.caption }]}>QR</Text>
                                </Pressable>
                            </View>
                        </View>

                        <View style={[styles.membersContainer, { backgroundColor: colors.background }]}>
                            {albumMembers && albumMembers.length > 0 ? (
                                albumMembers.map((member, index) => (
                                    <AlbumMemberCard
                                        key={member._id}
                                        profileId={member.profileId}
                                        role={member.role}
                                    />
                                ))
                            ) : (
                                <View style={styles.emptyMembers}>
                                    <Text style={[styles.emptyMembersText, { color: colors.caption }]}>
                                        No members yet
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Album Actions */}
                    <View style={styles.section}>
                        {album.hostId !== profile._id ? (
                            <Pressable
                                style={[styles.settingsOption, { backgroundColor: colors.background }]}
                                onPress={() => {
                                    Alert.alert(
                                        'Leave Album',
                                        'Are you sure you want to leave this album? You won\'t be able to access it unless you\'re invited again.',
                                        [
                                            { text: 'Cancel', style: 'cancel' },
                                            {
                                                text: 'Leave',
                                                style: 'destructive',
                                                onPress: handleLeaveAlbum,
                                            },
                                        ]
                                    );
                                }}
                            >
                                <View style={[styles.optionIcon, { backgroundColor: colors.border }]}>
                                    <Ionicons name="exit-outline" size={20} color={colors.caption} />
                                </View>
                                <View style={styles.optionContent}>
                                    <Text style={[styles.optionTitle, { color: colors.text }]}>
                                        {isLeavingAlbum ? 'Leaving Album...' : 'Leave Album'}
                                    </Text>
                                    <Text style={[styles.optionSubtitle, { color: colors.caption }]}>
                                        Remove yourself from this album
                                    </Text>
                                </View>
                            </Pressable>
                        ) : (
                            <Pressable
                                style={[styles.settingsOption, { backgroundColor: colors.background }]}
                                onPress={() => {
                                    Alert.alert(
                                        'Delete Album',
                                        'Are you sure you want to delete this album? This action cannot be undone and all photos will be removed.',
                                        [
                                            { text: 'Cancel', style: 'cancel' },
                                            {
                                                text: 'Delete',
                                                style: 'destructive',
                                                onPress: handleDeleteAlbum,
                                            },
                                        ]
                                    );
                                }}
                            >
                                <View style={[styles.optionIcon, { backgroundColor: colors.border }]}>
                                    <Ionicons name="trash-outline" size={20} color={colors.caption} />
                                </View>
                                <View style={styles.optionContent}>
                                    <Text style={[styles.optionTitle, { color: colors.text }]}>
                                        {isDeletingAlbum ? 'Deleting Album...' : 'Delete Album'}
                                    </Text>
                                    <Text style={[styles.optionSubtitle, { color: colors.caption }]}>
                                        Delete this album and all its contents
                                    </Text>
                                </View>
                            </Pressable>
                        )}
                    </View>
                </KeyboardAwareScrollView>

                <FloatingActionButton
                    disabled={!isDirty}
                    selectIcon="checkmark"
                    onPress={handleSubmit(handleSaveChanges)}
                />
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    toast: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        marginHorizontal: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
        zIndex: 1000,
    },
    toastText: {
        fontSize: 15,
        fontWeight: '600',
    },
    inputSection: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 8,
        marginLeft: 20,
    },
    errorText: {
        fontSize: 12,
        marginTop: 4,
        marginLeft: 20,
    },
    albumInfoSection: {
        marginBottom: 24,
        paddingHorizontal: 16,
        borderRadius: 16,
    },
    albumHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
    },
    albumHeaderText: {
        flex: 1,
        marginRight: 12,
    },
    albumTitle: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 4,
        lineHeight: 30,
    },
    albumCreated: {
        fontSize: 13,
        fontWeight: '500',
    },
    editButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    descriptionContainer: {
        marginTop: 12,
        padding: 12,
        borderRadius: 12,
    },
    descriptionText: {
        fontSize: 15,
        lineHeight: 22,
    },
    addDescriptionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 12,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderStyle: 'dashed',
    },
    addDescriptionText: {
        fontSize: 14,
        fontWeight: '500',
    },
    section: {
        marginHorizontal: 16,
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
        marginLeft: 4,
    },
    sectionHeaderActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    addMemberButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    addMemberButtonText: {
        color: 'white',
        fontSize: 13,
        fontWeight: '600',
    },
    membersContainer: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    emptyMembers: {
        padding: 24,
        alignItems: 'center',
    },
    emptyMembersText: {
        fontSize: 14,
        fontWeight: '500',
    },
    settingsOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    optionTitle: {
        fontSize: 15,
        fontWeight: '500',
        marginBottom: 2,
    },
    optionContent: { flex: 1 },
    optionSubtitle: {
        fontSize: 13,
    },
    optionIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
});

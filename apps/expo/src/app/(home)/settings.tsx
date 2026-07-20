import Avatar from "@/src/components/Avatar";
import PlatformIcon from "@/src/components/PlatformIcon/platform-icon";
import type { PlatformIconName } from "@/src/components/PlatformIcon/platform-icon.types";
import { ASSETS } from "@/src/constants/assets";
import { useAppTheme } from "@/src/context/AppThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getAuth } from "@react-native-firebase/auth";
import { api } from "@shutterspace/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import Constants from "expo-constants";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { router, Stack } from "expo-router";
import * as StoreReview from "expo-store-review";
import { type ReactNode } from "react";
import {
    Alert,
    Linking,
    Pressable,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    View
} from "react-native";

export default function SettingsScreen() {
    const auth = getAuth();
    const { colors } = useAppTheme();
    const profile = useQuery(api.profile.getUserProfile);

    const iconColor = colors.text;

    const handleOpenUrl = async (url: string) => {
        const supported = await Linking.canOpenURL(url);

        if (supported) {
            await Linking.openURL(url);
            return;
        }

        Alert.alert(`Don't know how to open this URL: ${url}`);
    };

    const handleLogout = () => {
        Alert.alert("Sign Out", "Are you sure you want to sign out?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Sign Out",
                style: "destructive",
                onPress: () => {
                    auth.signOut();
                },
            },
        ]);
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            "Delete Account",
            "Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete Account",
                    style: "destructive",
                    onPress: () => {
                        console.log("Delete Account");
                    },
                },
            ],
        );
    };

    const handleClearCache = () => {
        Alert.alert(
            "Clear Cache",
            "Are you sure you want to clear the cache? This action will clear the cache from your device. All of your data will still be available in your account.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Clear",
                    style: "destructive",
                    onPress: async () => {
                        await AsyncStorage.clear();
                        Alert.alert("Cache Cleared", "The cache has been cleared successfully.");
                    },
                },
            ],
        );
    };

    const handleReviewApp = async () => {
        await StoreReview.requestReview();
    };

    const handleShareProfile = async () => {
        try {
            await Haptics.selectionAsync();
            await Share.share({
                title: "Join me on Shutterspace!",
                message: `Check out my profile: https://shutterspace.app/shareId/${profile?.shareCode}`,
                url: `https://shutterspace.app/shareId/${profile?.shareCode}`,
            });
        } catch (error) {
            console.error("Failed to share profile:", error);
        }
    };

    return (
        <>
            <Stack.Screen
                options={{
                    headerTitle: "Settings",
                    headerTitleStyle: {
                        color: colors.text,
                    }
                }}
            />

            <Stack.Toolbar placement="left">
                <Stack.Toolbar.Button icon="xmark" onPress={() => router.back()} />
            </Stack.Toolbar>

            <ScrollView
                style={[styles.screen, { backgroundColor: colors.background }]}
                contentInsetAdjustmentBehavior="automatic"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.content}
            >
                <Pressable
                    onPress={() => router.push("/(home)/profile/edit")}
                    style={({ pressed }) => [
                        styles.card,
                        styles.profileCard,
                        { backgroundColor: colors.surface },
                        pressed && styles.pressed,
                    ]}
                >
                    <Avatar
                        nickname={profile?.nickname ?? "No User"}
                        avatarKey={profile?.avatarKey}
                        size={52}
                    />
                    <View style={styles.profileContent}>
                        <Text style={[styles.profileName, { color: colors.text }]} numberOfLines={1}>
                            {profile?.nickname ?? "Your profile"}
                        </Text>
                        <Text style={[styles.profileSubtitle, { color: colors.caption }]} numberOfLines={1}>
                            {profile?.email ?? "Add your details"}
                        </Text>
                    </View>
                    <PlatformIcon name="chevronRight" size={16} color={colors.caption} />
                </Pressable>

                <Text style={[styles.sectionLabel, { color: colors.caption }]}>Account</Text>
                <SettingsCard colors={colors}>
                    <SettingsRow
                        colors={colors}
                        title="Share Profile"
                        iconName="share"
                        onPress={handleShareProfile}
                    />
                    <SettingsRow
                        colors={colors}
                        title="Friends"
                        iconName="friends"
                        onPress={() => router.push("/(home)/friends")}
                    />
                    <SettingsRow
                        colors={colors}
                        title="Shutterspace Plan"
                        icon={
                            <Image
                                source={ASSETS.logo}
                                style={styles.logoIcon}
                                contentFit="contain"
                                tintColor={iconColor}
                            />
                        }
                        disabled
                        trailing={
                            <Text style={[styles.comingSoon, { color: colors.caption }]}>Coming soon</Text>
                        }
                        isLast
                    />
                </SettingsCard>

                <Text style={[styles.sectionLabel, { color: colors.caption }]}>Support</Text>
                <SettingsCard colors={colors}>
                    <SettingsRow
                        colors={colors}
                        title="Rate Shutterspace"
                        iconName="star"
                        onPress={handleReviewApp}
                    />
                    <SettingsRow
                        colors={colors}
                        title="Report a Problem"
                        iconName="help"
                        onPress={() => router.push("/(home)/contact-us")}
                        isLast
                    />
                </SettingsCard>

                <Text style={[styles.sectionLabel, { color: colors.caption }]}>Legal</Text>
                <SettingsCard colors={colors}>
                    <SettingsRow
                        colors={colors}
                        title="Terms of Service"
                        iconName="document"
                        onPress={() => handleOpenUrl("https://shutterspace.app/terms")}
                    />
                    <SettingsRow
                        colors={colors}
                        title="Privacy Policy"
                        iconName="shield"
                        onPress={() => handleOpenUrl("https://shutterspace.app/privacy")}
                        isLast
                    />
                </SettingsCard>

                <SettingsCard colors={colors}>
                    <SettingsRow
                        colors={colors}
                        title="Sign Out"
                        iconName="logout"
                        onPress={handleLogout}
                    />
                    <SettingsRow
                        colors={colors}
                        title="Delete Account"
                        iconName="delete"
                        onPress={handleDeleteAccount}
                        destructive
                        isLast
                    />
                </SettingsCard>

                <Pressable onPress={handleClearCache} style={styles.clearCacheButton}>
                    <Text style={[styles.clearCacheText, { color: colors.caption }]}>Clear Cache</Text>
                </Pressable>

                <View style={styles.footer}>
                    <Text style={[styles.footerTitle, { color: colors.caption }]}>Shutterspace</Text>
                    <Text style={[styles.footerVersion, { color: colors.caption }]}>
                        Version {Constants.expoConfig?.version ?? "—"}
                    </Text>
                </View>
            </ScrollView>
        </>
    );
}

function SettingsCard({
    colors,
    children,
}: {
    colors: ReturnType<typeof useAppTheme>["colors"];
    children: ReactNode;
}) {
    return (
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
            {children}
        </View>
    );
}

function SettingsRow({
    title,
    iconName,
    icon,
    onPress,
    trailing,
    destructive,
    disabled,
    isLast,
    colors,
}: {
    title: string;
    iconName?: PlatformIconName;
    icon?: ReactNode;
    onPress?: () => void;
    trailing?: ReactNode;
    destructive?: boolean;
    disabled?: boolean;
    isLast?: boolean;
    colors: ReturnType<typeof useAppTheme>["colors"];
}) {
    const labelColor = destructive ? colors.danger : colors.text;
    const iconColor = destructive ? colors.danger : colors.text;

    return (
        <Pressable
            onPress={onPress}
            disabled={disabled || !onPress}
            style={({ pressed }) => [
                styles.row,
                !isLast && [styles.rowDivider, { borderBottomColor: colors.border }],
                pressed && !disabled && styles.pressed,
                disabled && styles.disabled,
            ]}
        >
            {icon ?? (
                iconName ? (
                    <PlatformIcon name={iconName} size={20} color={iconColor} />
                ) : null
            )}
            <Text
                style={[styles.rowTitle, { color: labelColor }]}
                numberOfLines={1}
            >
                {title}
            </Text>
            {trailing ?? (
                !disabled && onPress ? (
                    <PlatformIcon name="chevronRight" size={16} color={colors.caption} />
                ) : null
            )}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
    },
    content: {
        paddingHorizontal: 16,
        paddingBottom: 32,
        gap: 8,
    },
    headerButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: "center",
        alignItems: "center",
        marginLeft: 4,
    },
    card: {
        borderRadius: 16,
        borderCurve: "continuous",
        overflow: "hidden",
    },
    profileCard: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        marginBottom: 8,
    },
    profileContent: {
        flex: 1,
        gap: 2,
        marginLeft: 12,
    },
    profileName: {
        fontSize: 17,
        fontWeight: "600",
    },
    profileSubtitle: {
        fontSize: 14,
    },
    sectionLabel: {
        fontSize: 13,
        fontWeight: "500",
        marginLeft: 4,
        marginTop: 8,
        marginBottom: 4,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    rowDivider: {
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    rowTitle: {
        flex: 1,
        fontSize: 16,
        fontWeight: "500",
    },
    comingSoon: {
        fontSize: 13,
        fontWeight: "500",
    },
    logoIcon: {
        width: 20,
        height: 20,
    },
    clearCacheButton: {
        alignItems: "center",
        paddingVertical: 12,
        marginTop: 4,
    },
    clearCacheText: {
        fontSize: 15,
        fontWeight: "500",
    },
    footer: {
        alignItems: "center",
        gap: 2,
        paddingTop: 4,
    },
    footerTitle: {
        fontSize: 14,
        fontWeight: "500",
    },
    footerVersion: {
        fontSize: 12,
    },
    pressed: {
        opacity: 0.7,
    },
    disabled: {
        opacity: 0.5,
    },
});

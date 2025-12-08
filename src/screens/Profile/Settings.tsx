import { api } from '@/convex/_generated/api';
import { ASSETS } from '@/src/constants/assets';
import { useAppTheme } from '@/src/context/AppThemeContext';
import { useProfile } from '@/src/context/ProfileContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth } from '@react-native-firebase/auth';
import { useAction } from 'convex/react';
import Constants from 'expo-constants';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import * as StoreReview from 'expo-store-review';
import React, { useCallback } from 'react';
import { Alert, Linking, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export function SettingsScreen() {
    const auth = getAuth();
    const { colors } = useAppTheme();
    const { profile } = useProfile();

    // Convex
    const createShareCode = useAction(api.shareCodes.create);

    const handleOpenUrl = async (url: string) => {
        const supported = await Linking.canOpenURL(url);

        if (supported) {
            await Linking.openURL(url);
        } else {
            Alert.alert(`Don't know how to open this URL: ${url}`);
        }
    }

    const handleLogout = async () => {
        Alert.alert(
            "Sign Out",
            "Are you sure you want to sign out?",
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Sign Out', style: 'destructive', onPress: () => {
                        auth.signOut();
                    }
                },
            ]
        )
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            "Delete Account",
            "Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.",
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete Account',
                    style: 'destructive',
                    onPress: () => { console.log('Delete Account'); }
                },
            ]
        )
    }

    const handleClearCache = () => {
        Alert.alert(
            "Clear Cache",
            "Are you sure you want to clear the cache? This action will clear the cache from your device. All of your data will still be available in your account.",
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear', style: 'destructive', onPress: async () => {
                        await AsyncStorage.clear();
                        Alert.alert("Cache Cleared", "The cache has been cleared successfully.");
                    }
                },
            ]
        )
    }

    const handleShareProfile = useCallback(async () => {
        let code: string | undefined | null = profile.shareCode;

        if (code === undefined) {
            code = await createShareCode();
        }

        if (code === null) {
            Alert.alert("Error", "Failed to create share code. Please try again.");
            return;
        }

        await Share.share({
            message: 'Join me on Shutterspace!',
            url: `https://shutterspace.app/share?code=${code}`
        });
    }, [profile]);

    const handleReviewApp = async () => {
        await StoreReview.requestReview();
    }

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <ScrollView
                style={{ flex: 1, paddingHorizontal: 14 }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
            >
                {/* User Info Section */}
                <View style={[styles.section, { marginTop: 20 }]}>
                    <TouchableOpacity
                        style={styles.profileOption}
                        onPress={() => router.push('(profile)/edit')}
                    >
                        <View style={[styles.optionIcon, { backgroundColor: colors.secondary + '50' }]}>
                            <Text>{profile.nickname.charAt(0)}</Text>
                        </View>
                        <View style={styles.optionContent}>
                            <Text style={styles.optionTitle}>{profile.nickname}</Text>
                            <Text style={styles.optionSubtitle}>{profile.email}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
                    </TouchableOpacity>
                </View>

                {/* Account Management */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Management</Text>

                    <TouchableOpacity
                        style={styles.settingsOption}
                        onPress={handleShareProfile}
                    >
                        <View style={[styles.optionIcon, { backgroundColor: '#F5F5F5' }]}>
                            <Ionicons name="share-outline" size={20} color="#8E8E93" />
                        </View>
                        <View style={styles.optionContent}>
                            <Text style={styles.optionTitle}>Share</Text>
                            <Text style={styles.optionSubtitle}>Share your profile link</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.settingsOption}
                        onPress={() => router.push('friends', {

                        })}
                    >
                        <View style={[styles.optionIcon, { backgroundColor: '#F5F5F5' }]}>
                            <Ionicons name="person-outline" size={20} color="#8E8E93" />
                        </View>
                        <View style={styles.optionContent}>
                            <Text style={styles.optionTitle}>Friends</Text>
                            <Text style={styles.optionSubtitle}>Manage your friendships</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
                    </TouchableOpacity>
                </View>




                {/* Support & Feedback Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Support & Feedback</Text>

                    <TouchableOpacity
                        style={styles.settingsOption}
                        disabled
                        onPress={() => { }}
                    >
                        <View style={[styles.optionIcon, { backgroundColor: colors.primary, opacity: 0.5 }]}>
                            <Image
                                source={ASSETS.logo}
                                style={{ width: 20, height: 20 }}
                                contentFit="contain"
                                tintColor="white"
                            />
                        </View>
                        <View style={styles.optionContent}>
                            <Text style={styles.optionTitle}>Shutterspace Plan</Text>
                            <Text style={styles.optionSubtitle}>Manage your subscription</Text>
                        </View>
                        {/* <Ionicons name="chevron-forward" size={20} color="#C7C7CC" /> */}
                        <Text style={{ color: '#8E8E93', fontSize: 12, fontWeight: '600' }}>COMING SOON</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.settingsOption}
                        onPress={handleReviewApp}
                    >
                        <View style={[styles.optionIcon, { backgroundColor: '#FFF4E5' }]}>
                            <Ionicons name="star-outline" size={20} color="#FF9500" />
                        </View>
                        <View style={styles.optionContent}>
                            <Text style={styles.optionTitle}>Rate Shutterspace</Text>
                            <Text style={styles.optionSubtitle}>Share your feedback on the App Store</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.settingsOption}
                        onPress={() => router.push('./contact-us')}
                    >
                        <View style={[styles.optionIcon, { backgroundColor: '#F0E6FF' }]}>
                            <Ionicons name="help-circle-outline" size={20} color="#8E44AD" />
                        </View>
                        <View style={styles.optionContent}>
                            <Text style={styles.optionTitle}>Report a Problem</Text>
                            <Text style={styles.optionSubtitle}>Get help with an issue</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
                    </TouchableOpacity>
                </View>

                {/* Legal Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Legal</Text>

                    <TouchableOpacity
                        style={styles.settingsOption}
                        onPress={() => handleOpenUrl("https://shutterspace.app/terms")}
                    >
                        <View style={[styles.optionIcon, { backgroundColor: '#F5F5F5' }]}>
                            <Ionicons name="document-text-outline" size={20} color="#8E8E93" />
                        </View>
                        <View style={styles.optionContent}>
                            <Text style={styles.optionTitle}>Terms of Service</Text>
                            <Text style={styles.optionSubtitle}>Read our terms and conditions</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.settingsOption}
                        onPress={() => handleOpenUrl("https://shutterspace.app/privacy")}
                    >
                        <View style={[styles.optionIcon, { backgroundColor: '#F5F5F5' }]}>
                            <Ionicons name="shield-outline" size={20} color="#8E8E93" />
                        </View>
                        <View style={styles.optionContent}>
                            <Text style={styles.optionTitle}>Privacy Policy</Text>
                            <Text style={styles.optionSubtitle}>Learn how we protect your data</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
                    </TouchableOpacity>

                    {/* <TouchableOpacity
                        style={styles.settingsOption}
                        onPress={() => { }}
                    >
                        <View style={[styles.optionIcon, { backgroundColor: '#F5F5F5' }]}>
                            <Ionicons name="document-text-outline" size={20} color="#8E8E93" />
                        </View>
                        <View style={styles.optionContent}>
                            <Text style={styles.optionTitle}>Software Licenses</Text>
                            <Text style={styles.optionSubtitle}>View open source licenses</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
                    </TouchableOpacity> */}
                </View>

                {/* Danger Zone */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: '#FF3B30' }]}>Danger Zone</Text>

                    <TouchableOpacity
                        style={styles.settingsOption}
                        onPress={handleLogout}
                    >
                        <View style={[styles.optionIcon, { backgroundColor: '#F5F5F5' }]}>
                            <Ionicons name="log-out-outline" size={20} color="#8E8E93" />
                        </View>
                        <View style={styles.optionContent}>
                            <Text style={styles.optionTitle}>Sign Out</Text>
                            <Text style={styles.optionSubtitle}>Log out of your account</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.settingsOption, styles.dangerOption]}
                        onPress={handleDeleteAccount}
                    >
                        {<View style={[styles.optionIcon, { backgroundColor: '#FFE5E5' }]}>
                            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                        </View>}
                        <View style={styles.optionContent}>
                            <Text style={[styles.optionTitle, { color: '#FF3B30' }]}>Delete Account</Text>
                            <Text style={styles.optionSubtitle}>Permanently delete your account</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={{ margin: 24, alignItems: 'center' }}
                        onPress={handleClearCache}
                    >
                        <Text style={{ color: '#007AFF', fontSize: 16, fontWeight: '600' }}>Clear Cache</Text>
                    </TouchableOpacity>
                </View>

                {/* Footer */}
                <View style={styles.footer}>


                    <Text style={styles.footerTitle}>
                        Shutterspace
                    </Text>
                    <Text style={styles.footerVersion}>
                        {Constants.expoConfig?.version}
                    </Text>
                </View>

                {/* Bottom spacing */}
                <View style={{ height: 32 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    profileOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        marginBottom: 8,

    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#8E8E93',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 12,
        marginLeft: 4,
    },
    settingsOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        marginBottom: 8,
    },
    optionIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    optionContent: {
        flex: 1,
    },
    optionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
        marginBottom: 2,
    },
    optionSubtitle: {
        fontSize: 13,
        color: '#8E8E93',
    },
    dangerOption: {
        borderWidth: 1,
        borderColor: '#FFE5E5',
    },
    settingsOptionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#535252FF',
    },

    footer: {
        alignItems: 'center',
        marginTop: 20,
    },
    footerTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 4,
        color: '#000000',
    },
    footerVersion: {
        fontSize: 14,
        fontWeight: '400',
        color: '#999999',
    },
});
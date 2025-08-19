import { SettingsGroup, SettingsItem } from '@/components/SettingsGroup';
import { getAuth } from '@react-native-firebase/auth';
import { router } from 'expo-router';
import { FileText, HelpCircle, Hexagon, LogOutIcon, Shield, Signature, Star, Trash2, UserPen } from 'lucide-react-native';
import React from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function ProfileSettings() {
    const iconColor = '#666666';
    const auth = getAuth();

    const handleLogout = async () => {
        await auth.signOut();
    };

    const handleSettingsPress = (setting: string) => {
        // TODO: Implement navigation to specific settings
        console.log(`${setting} pressed`);
    };

    const handleOpenUrl = async (url: string) => {
        const supported = await Linking.canOpenURL(url);

        if (supported) {
            await Linking.openURL(url);
        } else {
            Alert.alert(`Don't know how to open this URL: ${url}`);
        }
    }

    return (
        <View style={localStyles.container}>
            <ScrollView
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 40 }} >

                {/* Account Section */}
                <SettingsGroup title="Account">
                    <SettingsItem
                        icon={<UserPen size={20} color={iconColor} />}
                        title="Edit Account"
                        onPress={() => router.push('(profile)/edit')}
                    />
                    <SettingsItem
                        icon={<Hexagon style={{ transform: [{ rotate: '30deg' }] }} size={20} color={iconColor} />}
                        title="Shutterspace Plan"
                        onPress={() => handleSettingsPress('Shutterspace Plan')}
                    />
                    <SettingsItem
                        icon={<Star size={20} color={iconColor} />}
                        title="Rate Shutterspace"
                        onPress={() => handleSettingsPress('Rate Shutterspace')}
                        isLast
                    />
                </SettingsGroup>

                {/* Preferences Section */}
                {/* <SettingsGroup title="Preferences">
                    <SettingsItem
                        icon={<Bell size={20} color="#000000" />}
                        title="Notifications"
                        onPress={() => handleSettingsPress('Notifications')}
                    />
                    <SettingsItem
                        icon={<Palette size={20} color="#000000" />}
                        title="Appearance"
                        onPress={() => handleSettingsPress('Appearance')}
                    />
                    <SettingsItem
                        icon={<Eye size={20} color="#000000" />}
                        title="Accessibility"
                        onPress={() => handleSettingsPress('Accessibility')}
                    />
                    <SettingsItem
                        icon={<Trash2 size={20} color="#000000" />}
                        title="Clear Cache"
                        onPress={() => handleSettingsPress('Clear Cache')}
                    />
                    <SettingsItem
                        icon={<Wifi size={20} color="#000000" />}
                        title="Data Saver"
                        onPress={() => handleSettingsPress('Data Saver')}
                    />
                    <SettingsItem
                        icon={<Globe size={20} color="#000000" />}
                        title="Language"
                        onPress={() => handleSettingsPress('Language')}
                        isLast
                    />
                </SettingsGroup> */}

                {/* Support & Feedback Section */}
                <SettingsGroup title="Support & Feedback">
                    <SettingsItem
                        icon={<HelpCircle size={20} color={iconColor} />}
                        title="Report a Problem"
                        onPress={() => handleSettingsPress('Report a Problem')}
                        isLast
                    />
                    {/* <SettingsItem
                        icon={<Ionicons name="help-circle-outline" size={20} color={iconColor} />}
                        title="Support (FAQ)"
                        onPress={() => handleSettingsPress('Support (FAQ)')}
                        isLast
                    /> */}
                </SettingsGroup>

                {/* Legal Section */}
                <SettingsGroup title="Legal">
                    <SettingsItem
                        icon={<Signature size={20} color={iconColor} />}
                        title="Terms of Service"
                        onPress={() => handleOpenUrl("https://shutterspace.app/terms.html")}
                    />
                    <SettingsItem
                        icon={<Shield size={20} color={iconColor} />}
                        title="Privacy Policy"
                        onPress={() => handleOpenUrl("https://shutterspace.app/privacy.html")}
                    />
                    <SettingsItem
                        icon={<FileText size={20} color={iconColor} />}
                        title="Software Licenses"
                        onPress={() => handleSettingsPress('Software Licenses')}
                        isLast
                    />
                </SettingsGroup>

                <SettingsGroup title="Danger Zone">
                    <SettingsItem
                        icon={<LogOutIcon size={20} color={iconColor} />}
                        title="Sign Out"
                        onPress={handleLogout}
                    />
                    <SettingsItem
                        icon={<Trash2 size={20} color='#FF3B30' />}
                        title="Delete Account"
                        onPress={() => { }}
                        isLast={true}
                        isDestructive={true}
                    />
                </SettingsGroup>

                {/* Footer */}
                <View style={localStyles.footer}>
                    <Text style={localStyles.footerTitle}>
                        Shutterspace
                    </Text>
                    <Text style={localStyles.footerVersion}>
                        Version 1.0.0
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}

const localStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    footer: {
        alignItems: 'center',
        marginTop: 40,
        paddingHorizontal: 16,
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
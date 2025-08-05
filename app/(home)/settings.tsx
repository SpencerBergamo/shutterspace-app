import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { FileText, HelpCircle, Hexagon, LogOut, Shield, User } from 'lucide-react-native';
import React from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface SettingsItemProps {
    icon: React.ReactNode;
    title: string;
    onPress: () => void;
    isLast?: boolean;
}

const SettingsItem: React.FC<SettingsItemProps> = ({ icon, title, onPress, isLast }) => {
    return (
        <TouchableOpacity
            style={[
                localStyles.settingsItem,
                !isLast && { borderBottomWidth: 1, borderBottomColor: '#E5E5E5' }
            ]}
            onPress={onPress}
            activeOpacity={0.7} >

            <View style={localStyles.itemContent}>
                <View style={localStyles.iconContainer}>
                    {icon}
                </View>
                <Text style={localStyles.itemTitle}>
                    {title}
                </Text>
            </View>
            <Ionicons
                name="chevron-forward"
                size={16}
                color="#999999" />

        </TouchableOpacity>
    );
};

interface SettingsGroupProps {
    title: string;
    children: React.ReactNode;
}

const SettingsGroup: React.FC<SettingsGroupProps> = ({ title, children }) => {
    return (
        <View style={localStyles.groupContainer}>
            <Text style={localStyles.groupTitle}>
                {title}
            </Text>
            <View style={[
                localStyles.groupContent,
                {
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E5E5E5',
                    borderRadius: 6
                }
            ]}>
                {children}
            </View>
        </View>
    );
};

export default function ProfileSettings() {
    const iconColor = '#666666';

    const handleLogout = () => {
        // TODO: Implement logout functionality
        console.log('Logout pressed');
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
                style={localStyles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={localStyles.scrollContent} >

                {/* Account Section */}
                <SettingsGroup title="Account">
                    <SettingsItem
                        icon={<User size={20} color="#999999" />}
                        title="Edit Account"
                        onPress={() => router.push('/(profile)/edit-profile')}
                    />
                    <SettingsItem
                        icon={<Hexagon style={{ transform: [{ rotate: '30deg' }] }} size={20} color={iconColor} />}
                        title="Shutterspace Plan"
                        onPress={() => handleSettingsPress('Shutterspace Plan')}
                    />
                    <SettingsItem
                        icon={<Ionicons name="star-outline" size={20} color={iconColor} />}
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
                    />
                    <SettingsItem
                        icon={<Ionicons name="help-circle-outline" size={20} color={iconColor} />}
                        title="Support (FAQ)"
                        onPress={() => handleSettingsPress('Support (FAQ)')}
                        isLast
                    />
                </SettingsGroup>

                {/* Legal Section */}
                <SettingsGroup title="Legal">
                    <SettingsItem
                        icon={<FileText size={20} color={iconColor} />}
                        title="Terms of Service"
                        onPress={() => handleOpenUrl("https://shutterspace.app/terms.html")}
                    />
                    <SettingsItem
                        icon={<Shield size={20} color={iconColor} />}
                        title="Privacy Policy"
                        onPress={() => handleOpenUrl("https://shutterspace.app/privacy.html")}
                    />
                    <SettingsItem
                        icon={<Ionicons name="document-text-outline" size={20} color={iconColor} />}
                        title="Software Licenses"
                        onPress={() => handleSettingsPress('Software Licenses')}
                        isLast
                    />
                </SettingsGroup>

                {/* Logout Section */}
                <View style={localStyles.groupContainer}>
                    <View style={[
                        localStyles.groupContent,
                        {
                            backgroundColor: '#FFFFFF',
                            borderColor: '#E5E5E5',
                            borderRadius: 6
                        }
                    ]}>
                        <TouchableOpacity
                            style={localStyles.logoutButton}
                            onPress={handleLogout}
                            activeOpacity={0.7}
                        >
                            <View style={localStyles.itemContent}>
                                <View style={localStyles.iconContainer}>
                                    <LogOut size={20} color="#FF3B30" />
                                </View>
                                <Text style={localStyles.logoutText}>
                                    Logout
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

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
        backgroundColor: '#F2F1F6',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    groupContainer: {
        marginTop: 24,
        paddingHorizontal: 16,
    },
    groupTitle: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 8,
        paddingHorizontal: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        color: '#666666',
    },
    groupContent: {
        borderWidth: 1,
        overflow: 'hidden',
    },
    settingsItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        minHeight: 52,
    },
    itemContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    itemIcon: {
        color: '#666666'
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: '400',
        color: '#000000',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        minHeight: 52,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '400',
        color: '#FF3B30',
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
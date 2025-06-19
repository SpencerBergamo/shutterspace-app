import { useAuth } from '@/context/AuthContext';
import { useProfile } from '@/context/ProfileContext';
import { router } from 'expo-router';
import {
    ChevronRight,
    CreditCard,
    ExternalLink,
    FileText,
    HelpCircle,
    LogOut,
    Settings,
    Shield,
    Star,
    User
} from 'lucide-react-native';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface MenuItemProps {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    onPress: () => void;
    showChevron?: boolean;
    showExternal?: boolean;
    isDestructive?: boolean;
}

function MenuItem({
    icon,
    title,
    subtitle,
    onPress,
    showChevron = true,
    showExternal = false,
    isDestructive = false
}: MenuItemProps) {
    return (
        <TouchableOpacity
            style={[styles.menuItem, isDestructive && styles.destructiveItem]}
            onPress={onPress}
        >
            <View style={styles.menuItemLeft}>
                <View style={[styles.iconContainer, isDestructive && styles.destructiveIcon]}>
                    {icon}
                </View>
                <View style={styles.menuItemText}>
                    <Text style={[styles.menuItemTitle, isDestructive && styles.destructiveText]}>
                        {title}
                    </Text>
                    {subtitle && (
                        <Text style={styles.menuItemSubtitle}>{subtitle}</Text>
                    )}
                </View>
            </View>
            <View style={styles.menuItemRight}>
                {showExternal && <ExternalLink size={16} color="#666" />}
                {showChevron && <ChevronRight size={16} color="#666" />}
            </View>
        </TouchableOpacity>
    );
}

export default function ProfileModal() {
    const { profile } = useProfile();
    const { signOut } = useAuth();

    const handleEditProfile = () => {
        router.push('../(profile)/edit');
    };

    const handleSubscription = () => {
        // Navigate to subscription management
        // router.push('/profile/subscription');
    };

    const handlePrivacyPolicy = () => {
        Linking.openURL('https://yourapp.com/privacy');
    };

    const handleTermsConditions = () => {
        Linking.openURL('https://yourapp.com/terms');
    };

    const handleSoftwareLicenses = () => {
        Linking.openURL('https://yourapp.com/licenses');
    };

    const handleRateApp = () => {
        // Open app store rating
        Linking.openURL('https://apps.apple.com/app/yourapp');
    };

    const handleHelpSupport = () => {
        // router.push('/profile/help');
    };

    const handleSettings = () => {
        // router.push('/profile/settings');
    };

    const handleSignOut = async () => {
        try {
            await signOut();
        } catch (error) {
            console.error('Sign out error:', error);
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.profileInfo}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {profile.nickname?.charAt(0)?.toUpperCase() || 'U'}
                        </Text>
                    </View>
                    <View style={styles.profileDetails}>
                        <Text style={styles.profileName}>{profile.nickname || 'User'}</Text>
                        <Text style={styles.profileEmail}>{profile.email}</Text>
                    </View>
                </View>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Profile Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Profile</Text>
                    <MenuItem
                        icon={<User size={20} color="#007AFF" />}
                        title="Edit Profile"
                        subtitle="Update your personal information"
                        onPress={handleEditProfile}
                    />
                    <MenuItem
                        icon={<Settings size={20} color="#007AFF" />}
                        title="Settings"
                        subtitle="App preferences and notifications"
                        onPress={handleSettings}
                    />
                </View>

                {/* Subscription Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Subscription</Text>
                    <MenuItem
                        icon={<CreditCard size={20} color="#34C759" />}
                        title="Manage Subscription"
                        subtitle="View and modify your plan"
                        onPress={handleSubscription}
                    />
                </View>

                {/* Support Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Support</Text>
                    <MenuItem
                        icon={<HelpCircle size={20} color="#FF9500" />}
                        title="Help & Support"
                        subtitle="Get help with the app"
                        onPress={handleHelpSupport}
                    />
                    <MenuItem
                        icon={<Star size={20} color="#FFD700" />}
                        title="Rate App"
                        subtitle="Share your feedback"
                        onPress={handleRateApp}
                        showExternal={true}
                    />
                </View>

                {/* Legal Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Legal</Text>
                    <MenuItem
                        icon={<Shield size={20} color="#8E8E93" />}
                        title="Privacy Policy"
                        subtitle="How we protect your data"
                        onPress={handlePrivacyPolicy}
                        showExternal={true}
                    />
                    <MenuItem
                        icon={<FileText size={20} color="#8E8E93" />}
                        title="Terms & Conditions"
                        subtitle="App usage terms"
                        onPress={handleTermsConditions}
                        showExternal={true}
                    />
                    <MenuItem
                        icon={<FileText size={20} color="#8E8E93" />}
                        title="Software Licenses"
                        subtitle="Open source licenses"
                        onPress={handleSoftwareLicenses}
                        showExternal={true}
                    />
                </View>

                {/* Account Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Account</Text>
                    <MenuItem
                        icon={<LogOut size={20} color="#FF3B30" />}
                        title="Sign Out"
                        subtitle="Sign out of your account"
                        onPress={handleSignOut}
                        showChevron={false}
                        isDestructive={true}
                    />
                </View>

                {/* App Version */}
                <View style={styles.versionContainer}>
                    <Text style={styles.versionText}>Version 1.0.0</Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F2F7',
    },
    header: {
        backgroundColor: '#FFFFFF',
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
    },
    profileInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    avatarText: {
        fontSize: 24,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    profileDetails: {
        flex: 1,
    },
    profileName: {
        fontSize: 20,
        fontWeight: '600',
        color: '#000000',
        marginBottom: 4,
    },
    profileEmail: {
        fontSize: 14,
        color: '#8E8E93',
    },
    content: {
        flex: 1,
    },
    section: {
        marginTop: 20,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#8E8E93',
        marginBottom: 8,
        marginLeft: 20,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    menuItem: {
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
    },
    destructiveItem: {
        backgroundColor: '#FFFFFF',
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: '#F2F2F7',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    destructiveIcon: {
        backgroundColor: '#FFE5E5',
    },
    menuItemText: {
        flex: 1,
    },
    menuItemTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#000000',
        marginBottom: 2,
    },
    destructiveText: {
        color: '#FF3B30',
    },
    menuItemSubtitle: {
        fontSize: 14,
        color: '#8E8E93',
    },
    menuItemRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    versionContainer: {
        alignItems: 'center',
        paddingVertical: 20,
        marginTop: 20,
    },
    versionText: {
        fontSize: 12,
        color: '#8E8E93',
    },
});

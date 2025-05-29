import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHaptics } from '../../context/HapticsContext';

export default function Profile() {
    const { user } = useAuth();
    const { isEnabled, toggleHaptics } = useHaptics();

    const settingsSections = [
        {
            title: 'Account',
            items: [
                { icon: 'person-outline', label: 'Edit Profile', onPress: () => { router.push('/edit-profile') } },
                { icon: 'mail-outline', label: 'Email Settings', onPress: () => { } },
                { icon: 'lock-closed-outline', label: 'Privacy & Security', onPress: () => { } },
            ]
        },
        {
            title: 'Preferences',
            items: [
                {
                    icon: 'vibrate', label: 'Vibrate', onPress: () => {
                        toggleHaptics();
                        if (isEnabled) {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }
                    }
                },
                { icon: 'notifications-outline', label: 'Notifications', onPress: () => { } },
                { icon: 'moon-outline', label: 'Appearance', onPress: () => { } },
                { icon: 'language-outline', label: 'Language', onPress: () => { } },
            ]
        },
        {
            title: 'Support',
            items: [
                { icon: 'help-circle-outline', label: 'Help Center', onPress: () => { } },
                { icon: 'information-circle-outline', label: 'About', onPress: () => { } },
            ]
        }
    ];

    return (
        <ScrollView style={styles.container}>
            <SafeAreaView edges={['bottom']}>

                <View style={styles.header}>
                    <View style={styles.profileSection}>
                        <Image
                            source={{ uri: user?.photoURL || 'https://ui-avatars.com/api/?name=User' }}
                            style={styles.profileImage}
                        />
                        <View style={styles.profileInfo}>
                            <Text style={styles.displayName}>{user?.displayName || 'User'}</Text>
                            <Text style={styles.email}>{user?.email}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.content}>
                    {settingsSections.map((section, index) => (
                        <View key={section.title} style={styles.section}>
                            <Text style={styles.sectionTitle}>{section.title}</Text>
                            <View style={styles.sectionContent}>
                                {section.items.map((item) => (
                                    <TouchableOpacity
                                        key={item.label}
                                        style={styles.settingItem}
                                        onPress={item.onPress}
                                    >
                                        <View style={styles.settingItemLeft}>
                                            <Ionicons name={item.icon as any} size={24} color="#666" />
                                            <Text style={styles.settingItemLabel}>{item.label}</Text>
                                        </View>
                                        <Ionicons name="chevron-forward" size={24} color="#666" />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    ))}

                    <TouchableOpacity style={styles.signOutButton}>
                        <Text style={styles.signOutText}>Sign Out</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>


        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F1F6',
    },
    header: {
        // backgroundColor: '#fff',
        paddingTop: 20,
        // paddingBottom: 20,
        // borderBottomWidth: 1,
        // borderBottomColor: '#E5E5E5',
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    profileImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
        marginRight: 16,
        backgroundColor: '#E5E5E5'
    },
    profileInfo: {
        flex: 1,
    },
    displayName: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    email: {
        fontSize: 16,
        color: '#666',
    },
    content: {
        padding: 20,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
        color: '#333',
    },
    sectionContent: {
        backgroundColor: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    settingItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    settingItemLabel: {
        fontSize: 16,
        marginLeft: 12,
        color: '#333',
    },
    signOutButton: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        // marginTop: 20,
    },
    signOutText: {
        color: '#FF3B30',
        fontSize: 16,
        fontWeight: '600',
    },
}); 
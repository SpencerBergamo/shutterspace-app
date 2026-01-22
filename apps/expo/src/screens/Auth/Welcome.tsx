import { api } from '@shutterspace/backend/convex/_generated/api';
import { MAX_WIDTH } from '@/src/constants/styles';
import { useAppTheme } from '@/src/context/AppThemeContext';
import { AppleAuthProvider, getAuth, GoogleAuthProvider, signInWithCredential } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useMutation } from 'convex/react';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { Link, router } from "expo-router";
import { GalleryVerticalEnd, Mail, QrCode, SmilePlus } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import 'react-native-get-random-values';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { v4 as uuidv4 } from 'uuid';

interface OnboardingSlide {
    title: string;
    description: string;
    icon: React.ReactNode;
}

const onboardingSlides: OnboardingSlide[] = [
    {
        title: "Create an Album",
        description: "Every greate memory starts with a home. Make an album for your trip, party, or just because &#8211; it's your place to collect the moments.",
        icon: <GalleryVerticalEnd size={60} color='#09ADA9' />
    },
    {
        title: "Invite Members",
        description: "The best memories aren't made alone. Share your album with friends and family so everyone can drop in their favorite shots.",
        icon: <QrCode size={60} color='#09ADA9' />
    },
    {
        title: "Engage with Uploads",
        description: "Relive the laughs, the smiles, and the 'remember when?' moments. Like, comment, and celebrate every photo together.",
        icon: <SmilePlus size={60} color='#09ADA9' />
    }
];

export function WelcomeScreen() {
    const { colors } = useAppTheme();
    const { width: screenWidth } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    const [currentSlide, setCurrentSlide] = useState<number>(0);
    const scrollViewRef = useRef<ScrollView>(null);

    const createNewProfile = useMutation(api.profile.createNewProfile);

    // Calculate slide width based on the screen paddingHorizontal:20
    const slideWidth = Math.min(screenWidth - 40, MAX_WIDTH);

    function handleScroll(event: any) {
        const contentOffset = event.nativeEvent.contentOffset.x;
        const slide = Math.floor((contentOffset + slideWidth / 2) / slideWidth);
        const clampedSlide = Math.max(0, Math.min(slide, onboardingSlides.length - 1));
        setCurrentSlide(clampedSlide);
    }

    async function handleAppleAuth() {
        try {
            const available = await AppleAuthentication.isAvailableAsync();
            if (!available) {
                console.error('Apple authentication is not available');
                return;
            }

            const nonce = uuidv4();
            const hashedNonce = await Crypto.digestStringAsync(
                Crypto.CryptoDigestAlgorithm.SHA256,
                nonce
            );

            const response = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
                nonce: hashedNonce,
            });

            if (!response) return;
            if (!response.identityToken) throw new Error('No identity token');

            const credential = AppleAuthProvider.credential(response.identityToken, nonce);
            await signInWithCredential(getAuth(), credential);

            return await createNewProfile({
                nickname: response.fullName?.toString(),
                authProvider: 'apple',
            })
        } catch (e) {
            console.error('Apple Auth FAIL', e);
        }
        finally {
            console.log('Apple Auth COMPLETED');
        }
    };

    async function handleGoogleAuth() {
        try {
            const result = await GoogleSignin.signIn();

            if (!result.data?.idToken) throw new Error('No ID Token Found');

            const credential = GoogleAuthProvider.credential(result.data.idToken);
            await signInWithCredential(getAuth(), credential);

            return await createNewProfile({
                ssoAvatar: result.data.user.photo ?? undefined,
                nickname: result.data.user.name ?? undefined,
                authProvider: 'google',
            });
        } catch (e) {
            console.error('Google auth FAIL', e);
        }
    }

    return (
        <View style={[styles.container, { backgroundColor: 'white', paddingBottom: insets.bottom }]}>
            <View style={{ flex: 1, }}>
                {/* Page View Section */}
                <ScrollView
                    ref={scrollViewRef}
                    horizontal
                    pagingEnabled={false}
                    snapToInterval={slideWidth}
                    snapToAlignment="center"
                    decelerationRate="fast"
                    showsHorizontalScrollIndicator={false}
                    style={styles.pageViewContainer}
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                >
                    {onboardingSlides.map((slide, index) => (
                        <View key={index} style={[styles.slide, { width: slideWidth, maxWidth: MAX_WIDTH }]}>
                            <View style={styles.iconContainer}>
                                {slide.icon}
                            </View>
                            <Text style={[styles.slideTitle, { color: 'black' }]}>
                                {slide.title}
                            </Text>
                            <Text style={[styles.slideDescription, { color: 'black' }]}>
                                {slide.description}
                            </Text>
                        </View>
                    ))}
                </ScrollView>

                {/* Pagination Dots */}
                <View style={styles.paginationContainer}>
                    {onboardingSlides.map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.paginationDot,
                                { backgroundColor: index === currentSlide ? colors.primary : '#E9ECEF' }
                            ]}
                        />
                    ))}
                </View>

                {/* Authentication Section */}
                <View style={styles.authContainer}>

                    {/* Google Auth */}
                    <TouchableOpacity onPress={handleGoogleAuth} style={[
                        styles.authButton, { backgroundColor: '#F2F2F2' }
                    ]} >
                        <Image source={require('@/assets/images/google-logo.png')}
                            style={{ width: 20, height: 20 }}
                            resizeMode='contain' />
                        <Text style={{ fontSize: 17 }}>Continue with Google</Text>
                    </TouchableOpacity>

                    {Platform.OS === 'ios' && (
                        <TouchableOpacity onPress={handleAppleAuth} style={[
                            styles.authButton, { backgroundColor: 'black' }
                        ]} >
                            <Image source={require('@/assets/images/apple-logo.png')}
                                style={{ width: 20, height: 20 }}
                                resizeMode='contain' />
                            <Text style={{ fontSize: 17, color: 'white' }}>Continue with Apple</Text>
                        </TouchableOpacity>
                    )}

                    {/* Email Sign Up */}
                    <TouchableOpacity onPress={() => router.push('/sign-up')} style={[
                        styles.authButton, { backgroundColor: colors.primary }
                    ]}>
                        <Mail size={20} color={'white'} />
                        <Text style={{ fontSize: 17, color: 'white' }}>Continue with Email</Text>
                    </TouchableOpacity>

                    {/* Already have account */}
                    <View style={styles.signInContainer}>
                        <Text style={[styles.signInText, { color: 'black' }]}>
                            Already have an account?{' '}
                        </Text>
                        <Link href="/sign-in" asChild>
                            <Pressable onPress={() => router.push('/sign-in')}>
                                <Text style={[styles.signInLink, { color: colors.primary }]}>
                                    Sign In
                                </Text>
                            </Pressable>
                        </Link>
                    </View>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
    },
    pageViewContainer: {
        flex: 1,
        marginTop: 60,
    },
    slide: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    iconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#F8F9FA',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 30,
    },
    slideTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 30,
    },
    slideDescription: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        opacity: 0.8,
    },
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 40,
    },
    paginationDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginHorizontal: 4,
    },
    authContainer: {
        marginBottom: 20,
        flexDirection: 'column',
        gap: 12,
    },

    // Buttons
    authButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        padding: 12,
        borderRadius: 12,
        height: 44,
    },

    // Bottom Options
    signInContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    signInText: {
        fontSize: 14,
    },
    signInLink: {
        fontSize: 14,
        fontWeight: '600',
    },
});
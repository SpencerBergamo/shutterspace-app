import { OAuthStrategy } from '@clerk/types';
import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Link, router } from "expo-router";
import { Mail } from 'lucide-react-native';
import { Dimensions, Image, Platform, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { AppleAuthProvider, getAuth, GoogleAuthProvider, signInWithCredential } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { signInAsync } from 'expo-apple-authentication';
import { v4 as uuidv4 } from 'uuid';

const { width: screenWidth } = Dimensions.get('window');

interface OnboardingSlide {
    title: string;
    description: string;
    icon: string;
}

const onboardingSlides: OnboardingSlide[] = [
    {
        title: "Create Collaborative Albums",
        description: "Build beautiful photo collections with friends and family. Share memories together in one place.",
        icon: "albums-outline"
    },
    {
        title: "Easy Album Invite",
        description: "Invite others to your albums with a simple link. No complicated setup required.",
        icon: "person-add-outline"
    },
    {
        title: "Like & Comment on Images",
        description: "Engage with photos through likes and comments. Keep the conversation going.",
        icon: "heart-outline"
    }
];

export default function WelcomeScreen() {
    // const { startSSOFlow } = useSSO();
    // const clerk = useClerk();

    const handleSSOFlow = async (strategy: OAuthStrategy) => {
        if (strategy === 'oauth_apple' && Platform.OS === 'android') {
            throw new Error('Apple Auth is not supported on Android');
        }

        try {
            // const { } = await startSSOFlow({ strategy });
        } catch (e) {
            console.error('SSO Flow (FAILED)', e);
        }
    }

    async function handleAppleAuth() {
        const nonce = uuidv4();
        const response = await signInAsync({
            requestedScopes: [
                AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                AppleAuthentication.AppleAuthenticationScope.EMAIL,
            ],
            nonce: nonce,
        });

        if (!response.identityToken) throw new Error('No identity token');

        const credential = AppleAuthProvider.credential(response.identityToken, nonce);
        return signInWithCredential(getAuth(), credential);
    };

    async function handleGoogleAuth() {
        const result = await GoogleSignin.signIn();

        if (!result.data?.idToken) throw new Error('No ID Token Found');

        const credential = GoogleAuthProvider.credential(result.data.idToken);
        return signInWithCredential(getAuth(), credential);
    }


    return (
        <View style={[styles.container, { backgroundColor: 'white' }]}>
            {/* Page View Section */}
            <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                style={styles.pageViewContainer}

            >
                {onboardingSlides.map((slide, index) => (
                    <View key={index} style={styles.slide}>
                        <View style={styles.iconContainer}>
                            <Ionicons
                                name={slide.icon as any}
                                size={60}
                                color={'blue'}
                            />
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
                            { backgroundColor: index === 0 ? 'blue' : '#E9ECEF' }
                        ]}
                    />
                ))}
            </View>

            {/* Authentication Section */}
            <View style={styles.authContainer}>

                {/* Google Auth */}
                <TouchableOpacity onPress={() => handleSSOFlow('oauth_google')} style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    padding: 12,
                    borderRadius: 12,
                    // marginVertical: 12,
                    height: 44,
                    width: '100%',
                    backgroundColor: '#F2F2F2',
                }} >
                    <Image source={require('../assets/images/google-logo.png')}
                        style={{ width: 20, height: 20 }}
                        resizeMode='contain' />
                    <Text style={{ fontSize: 17 }}>Continue with Google</Text>
                </TouchableOpacity>

                {Platform.OS === 'ios' && (
                    <TouchableOpacity onPress={() => { }} style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 10,
                        padding: 12,
                        borderRadius: 12,
                        // marginVertical: 12,
                        height: 44,
                        width: '100%',
                        backgroundColor: 'black',
                    }} >
                        <Image source={require('../assets/images/apple-logo.png')}
                            style={{ width: 20, height: 20 }}
                            resizeMode='contain' />
                        <Text style={{ fontSize: 17, color: 'white' }}>Continue with Apple</Text>
                    </TouchableOpacity>
                )}

                <AppleAuthentication.AppleAuthenticationButton
                    buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
                    buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                    cornerRadius={12}
                    style={{ width: '100%', height: 44 }}
                    onPress={async () => {
                        const credential = await AppleAuthentication.signInAsync({
                            requestedScopes: [
                                AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                                AppleAuthentication.AppleAuthenticationScope.EMAIL,
                            ],
                        })

                        // if (credential) {
                        //     const { fullName, email } = credential;

                        //     await startSSOFlow({
                        //         strategy: 'oauth_apple',

                        //     })
                        // }

                    }} />

                {/* Email Sign Up */}
                <TouchableOpacity onPress={() => router.push('/sign-up')} style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    padding: 12,
                    borderWidth: 1,
                    borderColor: '#E9ECEF',
                    borderRadius: 12,
                    // marginVertical: 12,
                    height: 44,
                    backgroundColor: 'blue',
                }}>
                    <Mail size={20} color={'white'} />
                    <Text style={{ fontSize: 17, color: 'white' }}>Continue with Email</Text>
                </TouchableOpacity>

                {/* Already have account */}
                <View style={styles.signInContainer}>
                    <Text style={[styles.signInText, { color: 'black' }]}>
                        Already have an account?{' '}
                    </Text>
                    <Link href="/sign-in" asChild>
                        <Pressable>
                            <Text style={[styles.signInLink, { color: 'blue' }]}>
                                Sign In
                            </Text>
                        </Pressable>
                    </Link>
                </View>
            </View>

            {/* Terms of Service */}
            <View style={styles.termsContainer}>
                <Text style={[styles.termsText, { color: 'black' }]}>
                    By continuing, you agree to our{' '}
                    <Text style={[styles.termsLink, { color: 'blue' }]}>
                        Terms of Service
                    </Text>
                    {' '}and{' '}
                    <Text style={[styles.termsLink, { color: 'blue' }]}>
                        Privacy Policy
                    </Text>
                </Text>
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
        width: screenWidth - 40,
        alignItems: 'center',
        justifyContent: 'center',
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
    authButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
    },
    googleButton: {
        backgroundColor: '#FFFFFF',
        borderColor: '#E9ECEF',
    },
    appleButton: {
        backgroundColor: '#000000',
        borderColor: '#000000',
    },
    emailButton: {
        backgroundColor: '#F8F9FA',
        borderColor: '#E9ECEF',
    },
    authButtonText: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 12,
    },
    signInContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    signInText: {
        fontSize: 14,
    },
    signInLink: {
        fontSize: 14,
        fontWeight: '600',
    },
    termsContainer: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    termsText: {
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 18,
        opacity: 0.7,
    },
    termsLink: {
        fontWeight: '600',
    },
});
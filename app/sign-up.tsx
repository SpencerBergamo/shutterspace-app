import { TextInputStyles } from "@/constants/styles";
import { useAppTheme } from "@/context/AppThemeContext";
import { api } from "@/convex/_generated/api";
import { validateEmail, validatePassword } from "@/utils/validators";
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppleAuthProvider, getAuth, GoogleAuthProvider, signInWithCredential } from "@react-native-firebase/auth";
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useTheme } from "@react-navigation/native";
import { useMutation } from "convex/react";
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { Link } from "expo-router";
import { useRef, useState } from "react";
import { Controller, useForm } from 'react-hook-form';
import { Button, Image, Platform, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import 'react-native-get-random-values';
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { v4 as uuidv4 } from 'uuid';

type SignUpFormData = {
    email: string;
    password: string;
};

export default function SignUpScreen() {
    const theme = useTheme();
    const { colors } = useAppTheme();
    const auth = getAuth();

    // Refs
    const emailInputRef = useRef<TextInput>(null);
    const passwordInputRef = useRef<TextInput>(null);

    // States
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    // Convex
    const createProfileMutation = useMutation(api.profile.createProfile);

    const {
        control,
        handleSubmit,
        formState: { errors, isValid },
    } = useForm<SignUpFormData>({
        mode: 'onChange',
        defaultValues: {
            email: '',
            password: '',
        },
    });

    async function handleSignup(data: SignUpFormData) {
        try {
            const user = await auth.createUserWithEmailAndPassword(data.email, data.password);

            return await createProfileMutation({
                nickname: user.user.displayName ?? data.email.split('@')[0],
                authProvider: 'email',
            });
        } catch (e) {
            console.warn('Firebase Password Signup (FAIL)', e);
        }
    }

    async function handleAppleAuth() {
        try {
            const available = await AppleAuthentication.isAvailableAsync();
            if (!available) {
                console.error('Apple authentication is not available');
                return;
            }

            const rawNonce = uuidv4();
            const hashedNonce = await Crypto.digestStringAsync(
                Crypto.CryptoDigestAlgorithm.SHA256,
                rawNonce
            );

            const response = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
                nonce: hashedNonce,
            });

            // if user cancels, response will be null
            if (!response) return;

            if (!response.identityToken) throw new Error('No identity token');

            const credential = AppleAuthProvider.credential(response.identityToken, rawNonce);
            await signInWithCredential(getAuth(), credential);

            return await createProfileMutation({
                authProvider: 'apple',
            });
        } catch (e) {
            console.error('Apple Auth FAIL', e);
        }
    };

    async function handleGoogleAuth() {
        try {
            const result = await GoogleSignin.signIn();

            if (!result.data?.idToken) throw new Error('No ID Token Found');

            const credential = GoogleAuthProvider.credential(result.data.idToken);
            await signInWithCredential(getAuth(), credential);

            return await createProfileMutation({
                authProvider: 'google',
            });
        } catch (e) {
            console.error('Google auth FAIL', e);
        }
    }

    return (
        <View style={{ flex: 1, backgroundColor: colors.background, padding: 16 }}>

            <KeyboardAwareScrollView style={{ flexShrink: 1 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >

                <Text style={styles.title}>Welcome to Shutterspace!</Text>
                <Text style={styles.subtitle}>Create an account to get started</Text>

                {/* Email */}
                <Controller
                    control={control}
                    name="email"
                    rules={{
                        required: 'Email is required',
                        validate: (value) => {
                            const error = validateEmail(value);
                            return error || true;
                        },
                    }}
                    render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput
                            ref={emailInputRef}
                            value={value}
                            autoFocus
                            placeholder="Email"
                            keyboardType="email-address"
                            returnKeyLabel="next"
                            returnKeyType="next"
                            autoCapitalize="none"
                            spellCheck={false}
                            onChangeText={onChange}
                            onBlur={onBlur}
                            onSubmitEditing={() => passwordInputRef.current?.focus()}
                            style={[TextInputStyles, {
                                backgroundColor: colors.background,
                                borderColor: colors.border,
                                color: colors.text,
                            }]}
                        />
                    )}
                />
                {errors.email ? (
                    <View style={styles.errorTextView}>
                        <Text style={{ color: "#FF3B30" }}>{errors.email.message}</Text>
                    </View>
                ) : <View style={styles.space} />}

                {/* Password */}
                <View style={{ position: 'relative', marginBottom: 16 }}>
                    <Controller
                        control={control}
                        name="password"
                        rules={{
                            required: 'Password is required',
                            validate: (value) => {
                                const error = validatePassword(value);
                                return error || true;
                            },
                        }}
                        render={({ field: { onChange, onBlur, value } }) => (
                            <TextInput
                                ref={passwordInputRef}
                                value={value}
                                placeholder="Password"
                                keyboardType="default"
                                secureTextEntry={!isPasswordVisible}
                                returnKeyLabel="done"
                                returnKeyType="done"
                                autoCapitalize="none"
                                spellCheck={false}
                                onChangeText={onChange}
                                onBlur={onBlur}
                                onSubmitEditing={handleSubmit(handleSignup)}
                                style={[TextInputStyles, {
                                    backgroundColor: colors.background,
                                    borderColor: colors.border,
                                    color: colors.text,
                                }]}
                            />
                        )}
                    />

                    <View style={{ position: 'absolute', right: 12, top: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' }}>
                        {isPasswordVisible ? (
                            <Pressable onPress={() => { setIsPasswordVisible(false) }}>
                                <Ionicons name="eye-outline" size={20} color={theme.colors.text} />
                            </Pressable>
                        ) : (
                            <Pressable onPress={() => { setIsPasswordVisible(true) }}>
                                <Ionicons name="eye-off-outline" size={20} color={theme.colors.text} />
                            </Pressable>
                        )}
                    </View>
                </View>
                {errors.password ? (
                    <View style={styles.errorTextView}>
                        <Text style={{ color: "#FF3B30" }}>{errors.password.message}</Text>
                    </View>
                ) : <View style={styles.space} />}

                <Button
                    title="Create Account"
                    onPress={handleSubmit(handleSignup)}
                    disabled={!isValid}
                    color={isValid ? colors.primary : 'grey'}
                />

                <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', marginVertical: 21, alignItems: 'center' }} >
                    <View style={styles.divider} />
                    <Text style={{ color: theme.colors.text }}>Or Continue With</Text>
                    <View style={styles.divider} />
                </View>

                {/* SSO Auth Buttons */}
                <View style={styles.authContainer}>

                    <TouchableOpacity onPress={handleGoogleAuth} style={[
                        styles.authButton, { backgroundColor: '#F2F2F2' }
                    ]} >
                        <Image source={require('../assets/images/google-logo.png')}
                            style={{ width: 20, height: 20 }}
                            resizeMode='contain' />
                        <Text style={{ fontSize: 17 }}>Continue with Google</Text>
                    </TouchableOpacity>

                    {Platform.OS === 'ios' && (
                        <TouchableOpacity onPress={handleAppleAuth} style={[
                            styles.authButton, { backgroundColor: 'black' }
                        ]} >
                            <Image source={require('../assets/images/apple-logo.png')}
                                style={{ width: 20, height: 20 }}
                                resizeMode='contain' />
                            <Text style={{ fontSize: 17, color: 'white' }}>Continue with Apple</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Terms of Service */}
                <View style={styles.termsContainer}>
                    <Text style={[styles.termsText, { color: 'black' }]}>
                        By continuing, you agree to our{' '}
                        <Link href="" asChild>
                            <Text style={[styles.termsLink, { color: colors.primary }]}>
                                Terms of Service
                            </Text>
                        </Link>
                        {' '}and{' '}
                        <Link href="" asChild>
                            <Text style={[styles.termsLink, { color: colors.primary }]}>
                                Privacy Policy
                            </Text>
                        </Link>
                    </Text>
                </View>
            </KeyboardAwareScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
    },

    subtitle: {
        fontSize: 16,
        marginBottom: 16,
    },

    passwordTextView: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },

    errorTextView: {
        flex: 1,
        height: 21,
        justifyContent: 'center',
        paddingHorizontal: 8,
    },

    submitButtonText: {
        color: 'white',
        fontSize: 17,
        textAlign: 'center',
        fontWeight: '600',
    },

    space: { height: 21 },

    divider: {
        flex: 1,
        height: 1,
        backgroundColor: '#ccc',
        marginHorizontal: 16,
    },

    authContainer: {
        flexDirection: 'column',
        marginBottom: 20,
        gap: 12,
    },

    authButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        padding: 12,
        borderRadius: 12,
        height: 44,
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
})
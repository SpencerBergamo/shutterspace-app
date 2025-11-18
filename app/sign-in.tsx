import { useTheme } from "@/context/ThemeContext";
import { validateEmail } from "@/utils/validators";
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppleAuthProvider, getAuth, GoogleAuthProvider, signInWithCredential } from "@react-native-firebase/auth";
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Link } from "expo-router";
import { useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Image, Platform, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import 'react-native-get-random-values';
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { v4 as uuidv4 } from 'uuid';

type SignInFormData = {
    email: string;
    password: string;
}

export default function SignInScreen() {
    const { theme } = useTheme();
    const auth = getAuth();
    const emailInputRef = useRef<TextInput>(null);
    const passwordInputRef = useRef<TextInput>(null);

    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const {
        control,
        handleSubmit,
        formState: { errors, isValid },
    } = useForm<SignInFormData>({
        mode: 'onChange',
        defaultValues: {
            email: '',
            password: '',
        }
    })

    async function handleSignin(data: SignInFormData) {
        try {
            await auth.signInWithEmailAndPassword(data.email, data.password);
        } catch (e) {
            console.warn('Firebase Password Sgnup (FAIL)', e);
        }
    }

    async function handleAppleAuth() {
        try {
            const available = await AppleAuthentication.isAvailableAsync();
            if (!available) {
                console.error('Apple authentication is not available');
                return;
            }

            const nonce = uuidv4();
            const response = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
                nonce: nonce,
            });

            if (!response.identityToken) throw new Error('No identity token');

            const credential = AppleAuthProvider.credential(response.identityToken, nonce);
            return signInWithCredential(getAuth(), credential);
        } catch (e) {
            console.error('Apple Auth FAIL', e);
        }
    };

    async function handleGoogleAuth() {
        try {
            const result = await GoogleSignin.signIn();

            if (!result.data?.idToken) throw new Error('No ID Token Found');

            const credential = GoogleAuthProvider.credential(result.data.idToken);
            return signInWithCredential(getAuth(), credential);
        } catch (e) {
            console.error('Google auth FAIL', e);
        }
    }

    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.background, padding: 16 }}>
            <KeyboardAwareScrollView>
                <Text style={styles.title}>Welcome Back!</Text>
                <Text style={styles.subtitle}>Let's get you back in</Text>

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
                            style={theme.styles.textInput}
                        />
                    )}
                />
                {errors.email ? (
                    <View style={styles.errorTextView}>
                        <Text style={{ color: theme.colors.danger }}>{errors.email.message}</Text>
                    </View>
                ) : <View style={styles.space} />}

                {/* Password */}
                <Controller
                    control={control}
                    name="password"
                    rules={{
                        required: 'Password is required',
                        validate: (value) => {

                            return value.length > 0 ? true : 'Password is required';
                        }
                    }}
                    render={({ field: { onChange, onBlur, value } }) => (
                        <View style={[theme.styles.textInput, { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }]}>
                            <TextInput
                                ref={passwordInputRef}
                                value={value}
                                placeholder="Password"
                                keyboardType="default"
                                secureTextEntry={!isPasswordVisible}
                                returnKeyLabel="next"
                                returnKeyType="next"
                                autoCapitalize="none"
                                spellCheck={false}
                                onChangeText={onChange}
                                onBlur={onBlur}
                                onSubmitEditing={handleSubmit(handleSignin)}
                                style={{ width: '80%', fontSize: 16 }}
                            />

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
                    )}
                />
                {errors.password ? (
                    <View style={styles.errorTextView}>
                        <Text style={{ color: theme.colors.danger }}>{errors.password.message}</Text>
                    </View>
                ) : <View style={styles.space} />}

                <TouchableOpacity
                    onPress={handleSubmit(handleSignin)}
                    disabled={!isValid}
                    style={{ backgroundColor: isValid ? theme.colors.primary : 'grey', padding: 16, borderRadius: 8, marginTop: 16 }}>
                    <Text style={styles.submitButtonText}>Sign In</Text>
                </TouchableOpacity>

                <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', marginVertical: 21, alignItems: 'center' }} >
                    <View style={styles.divider} />
                    <Text style={{ color: theme.colors.onBackground }}>Or Continue With</Text>
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
                            <Text style={[styles.termsLink, { color: theme.colors.primary }]}>
                                Terms of Service
                            </Text>
                        </Link>
                        {' '}and{' '}
                        <Link href="" asChild>
                            <Text style={[styles.termsLink, { color: theme.colors.primary }]}>
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

    space: { height: 0 },

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
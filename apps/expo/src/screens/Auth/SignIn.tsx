import { MAX_WIDTH, TextInputStyles } from "@/src/constants/styles";
import { useAppTheme } from "@/src/context/AppThemeContext";
import { validateEmail, validatePassword } from "@/src/utils/validators";
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppleAuthProvider, getAuth, GoogleAuthProvider, signInWithCredential, signInWithEmailAndPassword } from "@react-native-firebase/auth";
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useTheme } from "@react-navigation/native";
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, Image, Platform, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import 'react-native-get-random-values';
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { v4 as uuidv4 } from 'uuid';

type SignInFormData = {
    email: string;
    password: string;
}

export function SignInScreen() {
    const theme = useTheme();
    const { colors } = useAppTheme();
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
    });

    useEffect(() => {
        setTimeout(() => {
            emailInputRef.current?.focus();
        }, 600);
    }, [emailInputRef]);

    async function handleSignin(data: SignInFormData) {
        try {
            await signInWithEmailAndPassword(getAuth(), data.email, data.password);
        } catch (e) {
            console.warn('Firebase Password Sgnup (FAIL)', e);
            Alert.alert('Error', 'Failed to sign in with email and password');
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

            if (!response.identityToken) throw new Error('No identity token');

            const credential = AppleAuthProvider.credential(response.identityToken, rawNonce);
            return signInWithCredential(getAuth(), credential);
        } catch (e) {
            console.error('Apple Auth FAIL', e);
            Alert.alert('Error', 'Failed to sign in with Apple');
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
            Alert.alert('Error', 'Failed to sign in with Google');
        }
    }

    return (
        <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center' }}>
            <KeyboardAwareScrollView
                style={{
                    flexShrink: 1,
                    width: '100%',
                    maxWidth: MAX_WIDTH,
                    paddingHorizontal: 16,
                }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >

                <Text style={styles.title}>Welcome Back!</Text>
                <Text style={styles.subtitle}>Let's get you back in</Text>

                {/* Email */}
                <Controller
                    control={control}
                    name="email"
                    rules={{
                        required: 'Email is required',
                        validate: validateEmail,
                    }}
                    render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput
                            ref={emailInputRef}
                            value={value}
                            autoComplete="email"
                            placeholder="Email"
                            keyboardType="email-address"
                            returnKeyLabel="next"
                            returnKeyType="next"
                            autoCapitalize="none"
                            spellCheck={false}
                            onChangeText={onChange}
                            placeholderTextColor={colors.caption}
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

                <View style={styles.errorTextView}>
                    <Text style={{ color: "#FF3B30" }}>{errors.email?.message}</Text>
                </View>


                <View style={{ position: 'relative' }}>

                    <Controller
                        control={control}
                        name="password"
                        rules={{
                            required: 'Password is required',
                            validate: validatePassword
                        }}
                        render={({ field: { onChange, onBlur, value } }) => (

                            <TextInput
                                ref={passwordInputRef}
                                value={value}
                                autoComplete="current-password"
                                placeholder="Password"
                                keyboardType="default"
                                secureTextEntry={!isPasswordVisible}
                                returnKeyLabel="next"
                                returnKeyType="next"
                                autoCapitalize="none"
                                spellCheck={false}
                                onChangeText={onChange}
                                placeholderTextColor={colors.caption}
                                onBlur={onBlur}
                                onSubmitEditing={handleSubmit(handleSignin)}
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
                <View style={styles.errorTextView}>
                    <Text style={{ color: "#FF3B30" }}>{errors.password?.message}</Text>
                </View>


                {/* Submit Button */}
                <TouchableOpacity
                    disabled={!isValid}
                    style={[styles.authButton, { backgroundColor: isValid ? colors.primary : colors.grey2 }]}
                    onPress={handleSubmit(handleSignin)}
                >
                    <Text style={styles.submitButtonText}>Sign In</Text>
                </TouchableOpacity>

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

    inputDescription: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
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
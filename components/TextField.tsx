import { StyleSheet, Text, TextInput, TextInputProps, TouchableOpacity, View } from "react-native";

import { Eye, EyeClosed, LucideIcon } from 'lucide-react-native';
import React, { useEffect, useState } from "react";


interface TextFieldProps extends TextInputProps {
    leadingIcon?: LucideIcon;
    inputType?: 'text' | 'email' | 'password';
    label?: string;
    error?: string;
    validation?: (value: string) => string | null;
    validateOnBlur?: boolean;
    onValidationChange?: (isValid: boolean, errorMessage: string | null) => void;
}

const validateEmail = (email: string): string | null => {
    if (!email) return 'Email is required';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return 'Invalid email address';
    }

    return null;
}

const validatePassword = (password: string): string | null => {
    if (!password) return null;

    if (password.length < 8) {
        return 'Password must be at least 8 characters long';
    }

    // const hasUpperCase = /[A-Z]/.test(password);
    // const hasLowerCase = /[a-z]/.test(password);
    // const hasNumbers = /[0-9]/.test(password);
    // const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(password);

    // if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChars) {
    //     return 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character';
    // }

    return null;
}

export default function TextField({
    leadingIcon,
    inputType = 'text',
    label,
    error: externalError,
    placeholder,
    value,
    onChangeText,
    secureTextEntry,
    validation,
    validateOnBlur = true,
    onValidationChange,
    ...props
}: TextFieldProps) {
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [internalError, setInternalError] = useState<string | null>(null);
    const [hasBlurred, setHasBlurred] = useState(false);

    const isPassword = inputType === 'password';
    const shouldShowPassword = isPassword && showPassword;

    const displayError = externalError || (hasBlurred ? internalError : null);

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    }

    const validateField = (inputValue: string): string | null => {
        if (validation) {
            return validation(inputValue);
        }

        switch (inputType) {
            case 'email':
                return validateEmail(inputValue);
            case 'password':
                return validatePassword(inputValue);
            default: return null;
        }
    };

    const handleBlur = () => {
        setIsFocused(false);
        setHasBlurred(true);

        if (validateOnBlur && value) {
            const validationError = validateField(value);
            setInternalError(validationError);
            onValidationChange?.(!validationError, validationError);
        }
    };

    const handleChangeText = (text: string) => {
        onChangeText?.(text);

        if (internalError && text) {
            setInternalError(null);
            onValidationChange?.(true, null);
        }
    };

    const iconColor = isFocused ? '#09ADA9' : '#999';

    useEffect(() => {
        if (!externalError && hasBlurred && value) {
            const validationError = validateField(value);
            setInternalError(validationError);
            onValidationChange?.(!validationError, validationError);
        }
    }, [externalError, hasBlurred, value]);

    return (
        <View style={styles.container}>
            {label && <Text>{label}</Text>}

            <View style={styles.inputWrapper}>
                {leadingIcon && (
                    <View style={styles.leadingIconContainer}>
                        {React.createElement(leadingIcon, {
                            size: 20,
                            color: iconColor,
                        })}
                    </View>
                )}

                <TextInput
                    style={[
                        styles.input,
                        leadingIcon && styles.inputWithLeadingIcon,
                        isPassword && styles.inputWithTrailingIcon,
                        isFocused && styles.inputFocused,
                        displayError && styles.inputError,
                    ]}
                    placeholder={placeholder}
                    placeholderTextColor="#999"
                    value={value}
                    onChangeText={handleChangeText}
                    onFocus={() => setIsFocused(true)}
                    onBlur={handleBlur}
                    secureTextEntry={isPassword && !shouldShowPassword}
                    {...props}
                />

                {isPassword && (
                    <TouchableOpacity
                        style={styles.trailingIconContainer}
                        onPress={togglePasswordVisibility}
                        activeOpacity={0.7} >
                        {shouldShowPassword ?
                            <Eye
                                size={20}
                                color={iconColor} /> :
                            <EyeClosed
                                size={20}
                                color={iconColor} />}
                    </TouchableOpacity>
                )}
            </View>
            {displayError && <Text style={styles.errorText}>{displayError}</Text>}
        </View>
    );
}

/* <Icon size={} color={} />
                        <Icon
                            name={shouldShowPassword ? 'eye-off' : 'eye'}
                            size={20}
                            color={isFocused ? '#09ADA9' : '#999'} /> */

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
        marginBottom: 8,
    },
    inputWrapper: {
        position: 'relative',
        flexDirection: 'row',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        height: 56,
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        paddingHorizontal: 20,
        paddingVertical: 16,
        fontSize: 16,
        color: '#333',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    inputWithLeadingIcon: {
        paddingLeft: 56,
    },
    inputWithTrailingIcon: {
        paddingRight: 56,
    },
    inputFocused: {
        backgroundColor: '#ffffff',
        borderColor: 'transparent',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 0,
        },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    inputError: {
        borderColor: '#ff6b6b',
        shadowColor: '#ff6b6b',
    },
    leadingIconContainer: {
        position: 'absolute',
        left: 18,
        zIndex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: 20,
        height: 20,
    },
    trailingIconContainer: {
        position: 'absolute',
        right: 18,
        zIndex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: 20,
        height: 20,
    },
    errorText: {
        fontSize: 12,
        color: '#ff6b6b',
        marginTop: 4,
        marginLeft: 4,
    },
});
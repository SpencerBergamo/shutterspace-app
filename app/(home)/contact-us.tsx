import { TextInputStyles } from "@/constants/styles";
import { useAppTheme } from "@/context/AppThemeContext";
import { validateEmail } from "@/utils/validators";
import { useNavigation, usePreventRemove } from "@react-navigation/native";
import { useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, Button, Keyboard, Linking, StyleSheet, Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";


type ContactFormData = {
    email: string;
    message: string;
}

export default function ContactUs() {
    const navigation = useNavigation();
    const { colors } = useAppTheme();

    const emailInputRef = useRef<TextInput>(null);
    const messageInputRef = useRef<TextInput>(null);

    const {
        control,
        handleSubmit,
        formState: { errors, isValid, isDirty },
    } = useForm({
        mode: 'onChange',
        defaultValues: {
            email: '',
            message: '',
        }
    });

    usePreventRemove(isDirty, ({ data }) => {
        Keyboard.dismiss();
        Alert.alert("Unsaved Changes", "You have unsaved changes. Are you sure you want to leave?", [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Leave', style: 'destructive', onPress: () => navigation.dispatch(data.action) },
        ]);
    });

    const handleSend = async (data: ContactFormData) => {
        try {
            const subject = encodeURIComponent("Shutterspace Support Request");
            const body = encodeURIComponent(data.message);

            const email = 'contact@shutterspace.app';
            const mailto = `mailto:${email}?subject=${subject}&body=${body}`;

            const canOpen = await Linking.canOpenURL(mailto);
            if (canOpen) {
                await Linking.openURL(mailto);
            } else {
                Alert.alert(
                    "Email Not Supported",
                    "Please email us directly at contact@shutterspace.app",
                )
            }
        } catch (e) {
            console.error("Failed to send email", e);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>

            <KeyboardAwareScrollView
                contentContainerStyle={{}}
                keyboardShouldPersistTaps="handled"
            >

                <Controller
                    control={control}
                    name="email"
                    rules={{
                        required: 'Email is required',
                        validate: (value) => {
                            const errors = validateEmail(value);
                            return errors || true;
                        },
                    }}
                    render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput
                            ref={emailInputRef}
                            autoFocus
                            value={value}
                            placeholder="Email"
                            keyboardType="email-address"
                            returnKeyLabel="next"
                            returnKeyType="next"
                            autoCapitalize="none"
                            spellCheck={false}
                            onChangeText={onChange}
                            onBlur={onBlur}
                            onSubmitEditing={() => emailInputRef.current?.focus()}
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


                <Controller
                    control={control}
                    name="message"
                    rules={{
                        required: 'Message is required',
                        validate: (value) => {
                            return value.length > 0 ? true : 'Message is required';
                        },
                    }}
                    render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput
                            ref={messageInputRef}
                            value={value}
                            placeholder="Message"
                            keyboardType="default"
                            returnKeyType="done"
                            multiline={true}
                            textAlignVertical="top"
                            onChangeText={onChange}
                            onBlur={onBlur}
                            onSubmitEditing={() => messageInputRef.current?.blur()}
                            style={[TextInputStyles, {
                                backgroundColor: colors.background,
                                borderColor: colors.border,
                                color: colors.text,
                            }]}
                        />
                    )}
                />
                <View style={styles.errorTextView}>
                    <Text style={{ color: "#FF3B30" }}>{errors.message?.message}</Text>
                </View>

                <Button
                    title="Send"
                    disabled={!isValid}
                    onPress={handleSubmit(handleSend)}
                    color={colors.primary}
                />
            </KeyboardAwareScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },

    errorTextView: {
        flex: 1,
        height: 21,
        justifyContent: 'center',
        paddingHorizontal: 8,
    },

})
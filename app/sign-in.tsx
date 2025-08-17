import auth from "@react-native-firebase/auth";
import { useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";

export default function SignInScreen() {

    const [formData, setFormData] = useState<{ email: string, password: string }>({
        email: '',
        password: '',
    });

    const [isFormValid, setIsFormValid] = useState(false);

    async function handleSignup() {
        try {
            if (!isFormValid) return;
            await auth().createUserWithEmailAndPassword(formData.email, formData.password);
        } catch (e) {
            console.warn('Firebase Password Sgnup (FAIL)', e);
        }
    }

    return (
        <View style={styles.container}>
            <TextInput
                // ref={}
                style={styles.textInput}
                onChangeText={() => { }}
                value=""
                placeholder="Email"
                placeholderTextColor="#999999"
                maxLength={30}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                returnKeyType="next"
                autoFocus={true}
                selectionColor="#000000"
                textAlign="left"
            />

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
        padding: 16,
        justifyContent: 'center',
    },

    textInput: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#e9ecef', //#E5E5E5
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: '#000000',
        marginBottom: 8,
    },
})
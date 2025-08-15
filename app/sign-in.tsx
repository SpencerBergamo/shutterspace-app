import auth from "@react-native-firebase/auth";
import { useState } from "react";
import { Text, View } from "react-native";

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
        <View>
            <Text>Sign In</Text>
        </View>
    );
}
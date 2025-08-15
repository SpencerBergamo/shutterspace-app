import auth from "@react-native-firebase/auth";
import { router } from "expo-router";
import { useState } from "react";
import { Button, Text, View } from "react-native";

export default function SignUpScreen() {

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
            <Text>Sign Up</Text>

            <Button title="Already have an account? Sign In"
                onPress={() => router.replace('/sign-in')} />
        </View>
    );
}
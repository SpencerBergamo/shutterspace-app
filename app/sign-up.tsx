import { useSignUp } from "@clerk/clerk-expo";
import { router } from "expo-router";
import { useCallback } from "react";
import { Button, Text, View } from "react-native";

export default function SignUpScreen() {


    const { isLoaded, signUp } = useSignUp();

    const handleSignUp = useCallback(async () => {
        try {
            if (!isLoaded) return;

            const { } = await signUp.create({
                emailAddress: '',
                password: '',
                unsafeMetadata: {
                    nickname: '',
                },

            });
        } catch (e) {
            console.error(JSON.stringify(e, null, 2));
        }
    }, [isLoaded]);


    return (
        <View>
            <Text>Sign Up</Text>

            <Button title="Already have an account? Sign In"
                onPress={() => router.replace('/sign-in')} />
        </View>
    );
}
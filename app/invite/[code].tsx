import { useConvexAuth } from "convex/react";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

export default function InviteScreen() {
    const { code } = useLocalSearchParams<{ code: string }>();
    const { isAuthenticated } = useConvexAuth();

    const [isLoading, setIsLoading] = useState(true);
    const [album, setAlbum] = useState(null);

    useEffect(() => {
        if (isAuthenticated && code) {
            router.replace({
                pathname: '/(home)',
                params: {
                    inviteCode: code,
                },
            });
        }

        // get public album info
    }, [isAuthenticated, code]);

    return (
        <View></View>
    );
}

const styles = StyleSheet.create({
    container: {},
})
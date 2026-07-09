import { useAppTheme } from "@/src/context/AppThemeContext";
import { api } from "@shutterspace/backend/convex/_generated/api";
import { Id } from "@shutterspace/backend/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { Stack, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";

export default function AlbumDetailScreen() {
    const { colors } = useAppTheme();
    const { id } = useLocalSearchParams<{ id: string }>();
    const albumId = id as Id<"albums">;

    const album = useQuery(api.albums.queryAlbum, albumId ? { albumId } : "skip");

    if (album === undefined) {
        return (
            <>
                <Stack.Screen options={{ headerLargeTitleEnabled: false, title: "Album" }} />
                <View style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: colors.background,
                }}>
                    <ActivityIndicator size="large" color={colors.text} />
                </View>
            </>
        );
    }

    if (album === null) {
        return (
            <>
                <Stack.Screen options={{ headerLargeTitleEnabled: false, title: "Album" }} />
                <ScrollView
                    contentInsetAdjustmentBehavior="automatic"
                    contentContainerStyle={{
                        flex: 1,
                        justifyContent: "center",
                        alignItems: "center",
                        paddingHorizontal: 32,
                    }}
                    style={{ flex: 1, backgroundColor: colors.background }}
                >
                    <Text selectable style={{ fontSize: 16, color: colors.caption, textAlign: "center" }}>
                        Album not found or you do not have access.
                    </Text>
                </ScrollView>
            </>
        );
    }

    return (
        <>
            <Stack.Screen options={{
                headerLargeTitleEnabled: false,
                title: album.title,
            }} />
            <ScrollView
                contentInsetAdjustmentBehavior="automatic"
                contentContainerStyle={{ padding: 16, gap: 8 }}
                style={{ flex: 1, backgroundColor: colors.background }}
            >
                <Text selectable style={{ fontSize: 15, color: colors.caption }}>
                    Album detail coming soon.
                </Text>
            </ScrollView>
        </>
    );
}

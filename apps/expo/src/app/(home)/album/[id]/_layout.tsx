import { AlbumGalleryProvider } from "@/src/context/AlbumGalleryContext";
import { Id } from "@shutterspace/backend/convex/_generated/dataModel";
import { Redirect, Stack, useLocalSearchParams } from "expo-router";

/**
 * Nested native Stack keeps headers / Stack.Toolbar working for album → media.
 * Parent (home) stack owns albums → album; album index shows a back control
 * that pops the parent (see index screen options).
 *
 * Provider stays mounted across index / media / settings so gallery state is shared.
 */
export default function AlbumIdLayout() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const albumId = id as Id<"albums">;

    if (typeof id !== 'string') return <Redirect href="/albums" />;

    return (
        <AlbumGalleryProvider albumId={albumId}>
            <Stack
                screenOptions={{
                    headerShown: true,
                    headerBackButtonDisplayMode: "minimal",
                    freezeOnBlur: true,
                }}
            >
                <Stack.Screen
                    name="index"
                    options={{
                        headerTransparent: true,
                        headerShadowVisible: false,
                        headerLargeTitleEnabled: false,
                        title: "Album",
                    }}
                />
                <Stack.Screen
                    name="settings"
                    options={{
                        headerTitle: "Settings",
                        presentation: "formSheet",
                        headerLargeTitleEnabled: false,
                    }}
                />
                <Stack.Screen
                    name="media/[mediaId]"
                    options={{
                        title: "",
                        headerTransparent: true,
                        headerShadowVisible: false,
                        // headerStyle: { backgroundColor: "transparent" },
                        headerBlurEffect: "none",
                    }}
                />
            </Stack>
        </AlbumGalleryProvider>
    );
}

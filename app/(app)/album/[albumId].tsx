import { albumMockData } from "@/config/env";
import { Stack, useLocalSearchParams } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AlbumDetail() {
    const { albumId } = useLocalSearchParams();
    const album = albumMockData.find((album) => album.albumId === albumId);

    if (!album) {
        return (
            <View><Text>Album not found</Text></View>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1 }}>

            <Stack.Screen
                options={{
                    title: album?.title, headerBackTitle: 'Back',


                    headerRight: () => (
                        <Pressable>
                            <Text>Edit</Text>
                        </Pressable>
                    ),
                    headerTitle: "Album",
                    headerBackButtonDisplayMode: "default",

                }}



            />
            <View>
                <Text>{album?.title}</Text>
            </View>
        </SafeAreaView>
    )
}
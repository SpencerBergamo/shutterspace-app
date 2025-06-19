import { Stack } from "expo-router";


export default function CreateLayout() {

    return (
        <Stack>
            <Stack.Screen name="new-album"
                options={{
                    headerBackButtonDisplayMode: 'minimal',
                    headerTitleAlign: 'center',
                    title: 'Create New Album',
                }} />

            <Stack.Screen name='take-photo'
                options={{
                    headerShown: false,
                }} />
        </Stack>
    );
}
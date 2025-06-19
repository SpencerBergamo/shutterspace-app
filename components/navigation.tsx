import { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { View } from "react-native";


export const defaultScreenOptions: NativeStackNavigationOptions = {
    headerShown: true,
    headerTitleAlign: 'left',
    headerBackButtonDisplayMode: 'minimal',
    headerBackground: () => <View style={{ backgroundColor: '#F2F1F6', flex: 1 }} />,
    headerStyle: {
        backgroundColor: '#F2F1F6',
    },
    headerTintColor: '#000',
    headerTitleStyle: {
        fontSize: 20,
    }
}
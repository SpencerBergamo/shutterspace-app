import { router, Stack } from "expo-router";
import { View } from "react-native";


export default function AlbumSettingsModal() {


   return (
      <View >

         <Stack.Toolbar placement="left">
            <Stack.Toolbar.Button icon="xmark" accessibilityLabel="Close" onPress={() => router.back()} />
         </Stack.Toolbar>
         <Stack.Toolbar placement="right">
            <Stack.Toolbar.Button icon="square.and.arrow.up" accessibilityLabel="Share" onPress={() => router.back()} />
            <Stack.Toolbar.Button icon="square.and.pencil" accessibilityLabel="Edit Album" onPress={() => router.back()} />
         </Stack.Toolbar>


      </View>
   )
}
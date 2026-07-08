import { useAppTheme } from "@/src/context/AppThemeContext";
import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function AlbumsScreen() {
   const { colors } = useAppTheme();

   return (
      <>
         <ScrollView
            style={[styles.screen, { backgroundColor: colors.background }]}
            contentInsetAdjustmentBehavior="automatic"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
         >
            <View style={[styles.placeholderCard, { backgroundColor: "#FFFFFF", borderColor: colors.border }]}>
               <Text style={[styles.placeholderTitle, { color: colors.text }]}>Your albums</Text>
               <Text style={[styles.placeholderBody, { color: colors.caption }]}>
                  Album grid will live here. Swipe right to return to the camera.
               </Text>
            </View>
         </ScrollView>

      </>
   );
}

const styles = StyleSheet.create({
   screen: {
      flex: 1,
   },
   content: {
      paddingHorizontal: 16,
      paddingBottom: 32,
   },
   placeholderCard: {
      marginTop: 8,
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderCurve: "continuous",
      padding: 24,
      gap: 8,
   },
   placeholderTitle: {
      fontSize: 20,
      fontWeight: "700",
   },
   placeholderBody: {
      fontSize: 15,
      lineHeight: 22,
   },
});

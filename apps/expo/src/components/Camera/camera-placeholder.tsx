import { useAppTheme } from "@/src/context/AppThemeContext";
import { Pressable, StyleSheet, Text, View } from "react-native";

type CameraPlaceholderProps =
   | { variant: "simulator" }
   | { variant: "permission"; onRequestPermission: () => void };

export default function CameraPlaceholder(props: CameraPlaceholderProps) {
   const { colors } = useAppTheme();

   if (props.variant === "simulator") {
      return (
         <View style={[styles.fill, styles.centered, { backgroundColor: "#1a1a1a" }]}>
            <View style={styles.simulatorFrame}>
               <View style={styles.arrowTop}>
                  <Text style={styles.arrow}>↑</Text>
               </View>
               <View style={styles.arrowBottom}>
                  <Text style={styles.arrow}>↓</Text>
               </View>
               <View style={styles.arrowLeft}>
                  <Text style={styles.arrow}>←</Text>
               </View>
               <View style={styles.arrowRight}>
                  <Text style={styles.arrow}>→</Text>
               </View>
               <Text style={styles.simulatorLabel}>
                  Camera preview unavailable on simulator
               </Text>
            </View>
         </View>
      );
   }

   return (
      <View style={[styles.fill, styles.centered, { backgroundColor: colors.background }]}>
         <Text style={[styles.permissionText, { color: colors.text }]}>
            Camera access is required
         </Text>
         <Pressable
            onPress={props.onRequestPermission}
            style={[styles.permissionButton, { backgroundColor: colors.primary }]}
         >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
         </Pressable>
      </View>
   );
}

const styles = StyleSheet.create({
   fill: {
      ...StyleSheet.absoluteFill,
   },
   centered: {
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 32,
   },
   simulatorFrame: {
      width: "90%",
      height: "90%",
      borderStyle: "dashed",
      borderWidth: 2,
      borderColor: "white",
      borderRadius: 18,
      justifyContent: "center",
      alignItems: "center",
   },
   arrow: {
      fontSize: 26,
      color: "white",
   },
   arrowTop: {
      position: "absolute",
      top: -30,
      left: "50%",
      marginLeft: -12,
      alignItems: "center",
   },
   arrowBottom: {
      position: "absolute",
      bottom: -30,
      left: "50%",
      marginLeft: -12,
      alignItems: "center",
   },
   arrowLeft: {
      position: "absolute",
      left: -30,
      top: "50%",
      marginTop: -12,
      alignItems: "center",
   },
   arrowRight: {
      position: "absolute",
      right: -30,
      top: "50%",
      marginTop: -12,
      alignItems: "center",
   },
   simulatorLabel: {
      color: "#888",
      fontSize: 15,
      textAlign: "center",
   },
   permissionText: {
      fontSize: 16,
      marginBottom: 16,
      textAlign: "center",
   },
   permissionButton: {
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 12,
   },
   permissionButtonText: {
      color: "white",
      fontSize: 16,
      fontWeight: "600",
   },
});

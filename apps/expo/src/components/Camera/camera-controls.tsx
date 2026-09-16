import { CameraButton } from "@/src/components/Camera";
import PlatformIcon from "@/src/components/PlatformIcon/platform-icon";
import { Pressable, StyleSheet, View } from "react-native";

interface ControlProps {
   capturePhoto: () => void;
   startRecording: () => void;
   endRecording: () => void;
   disabled: boolean;
   flashEnabled: boolean;
   toggleFlash: () => void;
   flipCamera: () => void;
}

export default function CameraControls({
   capturePhoto,
   disabled,
   flashEnabled,
   toggleFlash,
   flipCamera,
}: ControlProps) {
   const flashIcon = flashEnabled ? "flash" : "flashOff";

   return (
      <View style={styles.container}>
         <View style={styles.sideLeft}>
            <Pressable
               onPress={toggleFlash}
               disabled={disabled}
               style={({ pressed }) => [
                  styles.iconButton,
                  pressed && styles.iconButtonPressed,
                  disabled && styles.iconButtonDisabled,
               ]}
            >
               <PlatformIcon name={flashIcon} size={24} color="white" />
            </Pressable>
         </View>

         <View style={styles.shutterSlot}>
            <CameraButton onPress={capturePhoto} disabled={disabled} />
         </View>

         <View style={styles.sideRight}>
            <Pressable
               onPress={flipCamera}
               disabled={disabled}
               style={({ pressed }) => [
                  styles.iconButton,
                  pressed && styles.iconButtonPressed,
                  disabled && styles.iconButtonDisabled,
               ]}
            >
               <PlatformIcon name="flipCamera" size={24} color="white" />
            </Pressable>
         </View>
      </View>
   );
}

const styles = StyleSheet.create({
   container: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-around",
      minHeight: 72,
   },
   sideLeft: {
      alignItems: "center",
      justifyContent: "center",
   },
   sideRight: {
      alignItems: "center",
      justifyContent: "center",
   },
   shutterSlot: {
      alignItems: "center",
      justifyContent: "center",
   },
   iconButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0, 0, 0, 0.35)",
   },
   iconButtonPressed: {
      opacity: 0.75,
   },
   iconButtonDisabled: {
      opacity: 0.5,
   },
});

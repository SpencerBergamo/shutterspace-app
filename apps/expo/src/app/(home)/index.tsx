import CameraButton from "@/src/components/CameraButton";
import { useAppTheme } from "@/src/context/AppThemeContext";
import { CameraView, useCameraPermissions } from "expo-camera";
import Constants from "expo-constants";
import { useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const isSimulator = !Constants.isDevice;

export default function CameraHomeScreen() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const handleCapture = () => {
    // Capture flow will be implemented later
  };

  return (
    <View style={styles.container}>

      {isSimulator ? (
        <View style={[styles.cameraPlaceholder, { backgroundColor: "#1a1a1a" }]}>
          <Text style={styles.simulatorLabel}>Camera preview unavailable on simulator</Text>
        </View>
      ) : permission?.granted ? (
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
      ) : (
        <View style={[styles.cameraPlaceholder, { backgroundColor: colors.background }]}>
          <Text style={[styles.permissionText, { color: colors.text }]}>
            Camera access is required
          </Text>
          <Pressable
            onPress={requestPermission}
            style={[styles.permissionButton, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </Pressable>
        </View>
      )}

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 24 }]}>
        <CameraButton onPress={handleCapture} disabled={isSimulator} />
      </View>
    </View >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  cameraPlaceholder: {
    ...StyleSheet.absoluteFill,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
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
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
  },
});

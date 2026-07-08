import CameraControls from "@/src/components/Camera/CameraControls";
import { useAppTheme } from "@/src/context/AppThemeContext";
import { CameraView, useCameraPermissions, type CameraType } from "expo-camera";
import Constants from "expo-constants";
import { router, Stack } from "expo-router";
import { useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";



export default function HomePagerScreen() {


  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>("back");
  const [flashEnabled, setFlashEnabled] = useState(false);

  const isSimulator = !Constants.isDevice;

  const handleCapture = () => {
    // Capture flow will be implemented later
  };

  const handleToggleFlash = () => {
    setFlashEnabled((current) => !current);
  };

  const handleFlipCamera = () => {
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  return (
    <>
      <View style={styles.container} collapsable={false}>
        {isSimulator ? (
          <View style={[styles.cameraPlaceholder, { backgroundColor: "#1a1a1a" }]}>
            <Text style={styles.simulatorLabel}>Camera preview unavailable on simulator</Text>
          </View>
        ) : permission?.granted ? (
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing={facing}
            enableTorch={flashEnabled}
          />
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
          <CameraControls
            capturePhoto={handleCapture}
            startRecording={() => { }}
            endRecording={() => { }}
            flashEnabled={flashEnabled}
            toggleFlash={handleToggleFlash}
            flipCamera={handleFlipCamera}
            disabled={!permission?.granted || isSimulator}
          />
        </View>
      </View>

      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button icon="person.circle" onPress={() => router.push("/(home)/settings")} />
      </Stack.Toolbar>
      <Stack.Toolbar placement="right" >
        <Stack.Toolbar.Button icon="plus" separateBackground style={{ backgroundColor: colors.primary }} onPress={() => router.push("/(home)/upload")} />
        <Stack.Toolbar.Button icon="tray" onPress={() => router.push("/(home)/notifications")} />
        <Stack.Toolbar.Button icon="square.grid.2x2" onPress={() => router.push("/(home)/albums")} />
      </Stack.Toolbar>

    </>
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
    paddingHorizontal: 24,
  },
});

import { CameraControls, CameraPlaceholder } from "@/src/components/Camera";
import { useAppTheme } from "@/src/context/AppThemeContext";
import { CameraView, useCameraPermissions, type CameraType } from "expo-camera";
import Constants from "expo-constants";
import { router, Stack } from "expo-router";
import { useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
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
          <CameraPlaceholder variant="simulator" />
        ) : permission?.granted ? (
          <CameraView
            ref={cameraRef}
            style={styles.cameraFill}
            facing={facing}
            enableTorch={flashEnabled}
          />
        ) : (
          <CameraPlaceholder
            variant="permission"
            onRequestPermission={requestPermission}
          />
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
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button icon="plus" separateBackground style={{ backgroundColor: colors.primary }} onPress={() => router.push("/(home)/upload")} />
        <Stack.Toolbar.Button icon="tray" onPress={() => router.push("/(home)/notifications")} />
        <Stack.Toolbar.Button icon="square.grid.2x2" onPress={() => router.push("/(home)/albums")} />
      </Stack.Toolbar>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "black",
  },
  cameraFill: {
    ...StyleSheet.absoluteFill,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
  },
});

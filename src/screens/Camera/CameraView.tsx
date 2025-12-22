import { BarcodeScanningResult, CameraType, CameraView, FlashMode, useCameraPermissions } from "expo-camera";
import { File } from "expo-file-system";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Dimensions, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";
import { ResizeMode, Video } from "react-native-video";
import ScannerGuardrails from "./components/ScannerGuardrails";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const windowDimensions = Dimensions.get("window");
const SCREEN_WIDTH = windowDimensions.width;
const SCREEN_HEIGHT = windowDimensions.height;
const MAX_VIDEO_DURATION = 60000; // 60 seconds
const BUTTON_SIZE = 80;
const BUTTON_INNER_SIZE = 60;
const PROGRESS_RADIUS = 40;
const CIRCLE_LENGTH = 2 * Math.PI * PROGRESS_RADIUS; // Circumference

type CaptureMode = "photo" | "video" | "qr";

export function CameraViewScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>("back");
  const [flash, setFlash] = useState<FlashMode>("off");
  const [captureMode, setCaptureMode] = useState<CaptureMode>("photo");
  const [isRecording, setIsRecording] = useState(false);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [scannedBounds, setScannedBounds] = useState<any>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [recordedVideoUri, setRecordedVideoUri] = useState<string | null>(null);

  const cameraRef = useRef<CameraView>(null);
  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pressStartTimeRef = useRef<number>(0);

  // Reanimated values for video recording progress
  const videoProgress = useSharedValue(0);
  const buttonScale = useSharedValue(1);

  useEffect(() => {
    const checkAndRequestPermission = async () => {
      // If permission is not granted, request it
      if (permission && !permission.granted && permission.canAskAgain) {
        const response = await requestPermission();

        // If user denies permission
        if (!response.granted) {
          Alert.alert(
            "Camera Access Required",
            "Please enable camera access in your device settings to use this feature.",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Open Settings", onPress: () => Linking.openSettings() },
            ]
          );
        }
      }
      // If permission was previously denied and can't ask again
      else if (permission && !permission.granted && !permission.canAskAgain) {
        Alert.alert(
          "Camera Access Required",
          "Please enable camera access in your device settings to use this feature.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => Linking.openSettings() },
          ]
        );
      }
    };

    checkAndRequestPermission();
  }, [permission, requestPermission]);

  // Animated styles for the capture button
  const buttonAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: buttonScale.value }],
    };
  });

  const progressRingProps = useAnimatedProps(() => {
    return {
      strokeDashoffset: CIRCLE_LENGTH * (1 - videoProgress.value),
    };
  });

  const animatedCodeTooltip = useAnimatedProps(() => {
    return {

    };
  }, [scannedBounds,]);

  const handlePressIn = useCallback(() => {
    pressStartTimeRef.current = Date.now();
    buttonScale.value = withTiming(0.9, { duration: 100 });
  }, []);

  const handlePressOut = useCallback(async () => {
    const pressDuration = Date.now() - pressStartTimeRef.current;
    buttonScale.value = withTiming(1, { duration: 100 });

    // Short press = photo
    if (pressDuration < 500) {
      await takePhoto();
    }
    // Long press was released = stop video
    else if (isRecording) {
      await stopRecording();
    }
  }, [isRecording]);

  const startRecording = async () => {
    console.log("startRecording called - cameraRef:", !!cameraRef.current, "isRecording:", isRecording, "isCameraReady:", isCameraReady);

    if (!cameraRef.current) {
      console.log("No camera ref");
      return;
    }

    if (isRecording) {
      console.log("Already recording");
      return;
    }

    if (!isCameraReady) {
      console.log("Camera not ready yet");
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setIsRecording(true);

      // Animate progress ring
      videoProgress.value = withTiming(1, {
        duration: MAX_VIDEO_DURATION,
        easing: Easing.linear,
      });

      // Auto-stop after 60 seconds
      recordingTimeoutRef.current = setTimeout(() => {
        stopRecording();
      }, MAX_VIDEO_DURATION);

      // Start recording - this returns a promise that resolves when recording stops
      cameraRef.current.recordAsync({
        maxDuration: 60,
      }).then((video) => {
        console.log("Video recorded:", video?.uri);
        if (video?.uri) {
          setRecordedVideoUri(video.uri);
        }
      }).catch((error) => {
        console.error("Error during recording:", error);
      });
    } catch (error) {
      console.error("Error starting video:", error);
      setIsRecording(false);
      videoProgress.value = 0;
    }
  };

  const handleLongPress = useCallback(async () => {
    console.log("handleLongPress called, isRecording:", isRecording, "isCameraReady:", isCameraReady);

    if (isRecording) {
      console.log("Already recording in handleLongPress");
      return;
    }

    // Start video recording
    await startRecording();
  }, [isRecording, isCameraReady, startRecording]);

  const takePhoto = async () => {
    console.log("takePhoto called, isCameraReady:", isCameraReady);
    if (!cameraRef.current || !isCameraReady) {
      console.log("Camera not ready, skipping photo");
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });
      console.log("Photo taken:", photo?.uri);
      // TODO: Handle photo - show preview, save, upload, etc.
      // For now, clean up immediately since we're not using it
      if (photo?.uri) {
        new File(photo.uri).delete();
      }
    } catch (error) {
      console.error("Error taking photo:", error);
    }
  };



  const stopRecording = async () => {
    if (!cameraRef.current || !isRecording) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      cameraRef.current.stopRecording();

      // Clear timeout and reset animation
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
        recordingTimeoutRef.current = null;
      }

      cancelAnimation(videoProgress);
      videoProgress.value = withTiming(0, { duration: 200 });
      setIsRecording(false);
    } catch (error) {
      console.error("Error stopping recording:", error);
    }
  };

  function handleScanCode({ data, bounds }: BarcodeScanningResult) {
    if (bounds && (bounds.size.width > 0 || bounds.size.height > 0)) {
      setScannedData(data);
      setScannedBounds(bounds);

      if (!scannedData) {
        Haptics.selectionAsync();
      }
    }
  }

  const handleOpenLink = useCallback(() => {
    if (scannedData) {
      Linking.openURL(scannedData);
    }
  }, [scannedData]);

  const toggleCameraFacing = () => {
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  const toggleFlash = () => {
    setFlash((current) => (current === "off" ? "on" : "off"));
  };

  const switchMode = (mode: CaptureMode) => {
    if (isRecording) return; // Don't allow mode switch while recording
    setCaptureMode(mode);
    setScannedData(null);
    setScannedBounds(null);
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Loading...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Camera access not available</Text>
        <Text style={[styles.message, { fontSize: 14, marginTop: 10 }]}>
          Please enable camera permissions in Settings
        </Text>
        <Pressable
          onPress={() => Linking.openSettings()}
          style={styles.permissionButton}
        >
          <Text style={styles.permissionButtonText}>Open Settings</Text>
        </Pressable>
      </View>
    );
  }

  // Show video preview if we just recorded a video
  if (recordedVideoUri) {
    return (
      <View style={styles.container}>
        <Video
          source={{ uri: recordedVideoUri }}
          style={styles.camera}
          resizeMode={ResizeMode.CONTAIN}
          controls
          paused={false}
        />

        {/* Video Preview Controls */}
        <View style={styles.videoPreviewControls}>
          <Pressable
            onPress={async () => {
              // Delete the video when retaking
              if (recordedVideoUri) {
                new File(recordedVideoUri).delete();
              }
              setRecordedVideoUri(null);
            }}
            style={styles.videoPreviewButton}
          >
            <Text style={styles.videoPreviewButtonText}>Retake</Text>
          </Pressable>
          <Pressable
            onPress={async () => {
              // TODO: Move video to permanent storage, upload, etc.
              console.log("Use video:", recordedVideoUri);

              // After successfully processing, clean up the temp file
              if (recordedVideoUri) {
                new File(recordedVideoUri).delete();
              }
              setRecordedVideoUri(null);
            }}
            style={[styles.videoPreviewButton, styles.videoPreviewButtonPrimary]}
          >
            <Text style={styles.videoPreviewButtonText}>Use Video</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        flash={flash}
        mode="video"
        barcodeScannerSettings={captureMode === "qr" ? {
          barcodeTypes: ["qr"],
        } : undefined}
        onBarcodeScanned={handleScanCode}
        onCameraReady={() => {
          console.log("Camera is ready!");
          // Add small delay to ensure camera is fully initialized for recording
          setTimeout(() => {
            setIsCameraReady(true);
          }, 300);
        }}
      />

      {/* Open Link Button - positioned dynamically based on QR bounds */}
      {/* QR Tracking Layer */}
      <ScannerGuardrails bounds={scannedBounds} />


      {/* Top Controls */}
      <View style={styles.topControls}>
        <Pressable onPress={toggleFlash} style={styles.controlButton}>
          <Text style={styles.controlButtonText}>
            {flash === "off" ? "⚡️ Off" : "⚡️ On"}
          </Text>
        </Pressable>
        <Pressable onPress={toggleCameraFacing} style={styles.controlButton}>
          <Text style={styles.controlButtonText}>🔄</Text>
        </Pressable>
      </View>

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        {/* Capture Button */}
        <View>
          <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onLongPress={handleLongPress}
            delayLongPress={500}
            style={styles.captureButtonContainer}
          >
            <Animated.View style={[styles.captureButton, buttonAnimatedStyle]}>
              <View
                style={[
                  styles.captureButtonInner,
                  isRecording && styles.captureButtonInnerRecording,
                ]}
              />

              {/* Video Progress Ring */}
              {isRecording && (
                <Svg style={styles.progressRing} width={BUTTON_SIZE} height={BUTTON_SIZE}>
                  <AnimatedCircle
                    cx={BUTTON_SIZE / 2}
                    cy={BUTTON_SIZE / 2}
                    r={PROGRESS_RADIUS}
                    stroke="#fff"
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray={CIRCLE_LENGTH}
                    strokeLinecap="round"
                    rotation="-90"
                    origin={`${BUTTON_SIZE / 2}, ${BUTTON_SIZE / 2}`}
                    animatedProps={progressRingProps}
                  />
                </Svg>
              )}
            </Animated.View>
          </Pressable>
          <Text style={styles.captureHint}>
            {isRecording ? "Release to stop" : "Tap for photo, hold for video"}
          </Text>
        </View>

        {/* Recording Indicator */}
        {isRecording && (
          <View style={styles.recordingIndicator}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>Recording...</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  message: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  camera: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  topControls: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  controlButton: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  controlButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  bottomControls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 40,
    alignItems: "center",
  },
  modeSelector: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
    marginBottom: 30,
  },
  modeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  modeText: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 14,
    fontWeight: "600",
  },
  modeTextActive: {
    color: "#fff",
    fontSize: 16,
  },
  captureButtonContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  captureHint: {
    color: "#fff",
    fontSize: 14,
    marginTop: 12,
    textAlign: "center",
    opacity: 0.8,
  },
  captureButton: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#fff",
  },
  captureButtonInner: {
    width: BUTTON_INNER_SIZE,
    height: BUTTON_INNER_SIZE,
    borderRadius: BUTTON_INNER_SIZE / 2,
    backgroundColor: "#fff",
  },
  captureButtonInnerRecording: {
    borderRadius: 8,
    width: 30,
    height: 30,
  },
  progressRing: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  recordingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF3B30",
    marginRight: 8,
  },
  recordingText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  qrOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  qrGuide: {
    width: 250,
    height: 250,
    position: "relative",
  },
  qrCorner: {
    position: "absolute",
    width: 40,
    height: 40,
    borderColor: "#fff",
  },
  qrCornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  qrCornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  qrCornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  qrCornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  qrText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 280,
    textAlign: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  openLinkButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 20,
  },
  openLinkButtonDynamic: {
    position: "absolute",
    backgroundColor: "#007AFF",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  openLinkButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  videoPreviewControls: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    paddingHorizontal: 20,
  },
  videoPreviewButton: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  videoPreviewButtonPrimary: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  videoPreviewButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  bracket: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#FFD60A', // Apple yellow
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 10,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 10,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 10,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 10,
  },
  pillTooltip: {
    position: 'absolute',
    width: 200,
    height: 40,
    zIndex: 10,
  },
  pillInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD60A',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pillIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  pillText: {
    flex: 1,
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
  pillClose: {
    color: '#000',
    fontSize: 16,
    marginLeft: 8,
    opacity: 0.5,
  }
});


/**
 * 
 * 
 * {scannedData && scannedBounds && (
        <View
          style={[
            StyleSheet.absoluteFill,
            { pointerEvents: 'box-none' }
          ]}
        >
          
          <View
            style={{
              position: 'absolute',
              top: scannedBounds.origin.y,
              left: scannedBounds.origin.x,
              width: scannedBounds.size.width,
              height: scannedBounds.size.height,
            }}
          >
            <View style={[styles.bracket, styles.topLeft]} />
            <View style={[styles.bracket, styles.topRight]} />
            <View style={[styles.bracket, styles.bottomLeft]} />
            <View style={[styles.bracket, styles.bottomRight]} />
          </View>

          
          <Animated.View
            entering={FadeIn.duration(200)}
            style={[
              styles.pillTooltip,
              {
                top: scannedBounds.origin.y + scannedBounds.size.height + 15,
                left: scannedBounds.origin.x + (scannedBounds.size.width / 2) - 100, // 100 is half of pill width
              }
            ]}
          >
            <Pressable onPress={handleOpenLink} style={styles.pillInner}>
              <Text style={styles.pillIcon}>🔗</Text>
              <Text style={styles.pillText} numberOfLines={1}>
                {scannedData.replace(/(^\w+:|^)\/\//, '')} 
              </Text >
  <Pressable onPress={() => setScannedData(null)}>
    <Text style={styles.pillClose}>✕</Text>
  </Pressable>
            </Pressable >
          </Animated.View >
        </View >
      )}

 */
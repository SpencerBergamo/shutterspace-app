import { Pressable, StyleSheet, View } from "react-native";

interface CameraButtonProps {
  onPress?: () => void;
  disabled?: boolean;
}

export default function CameraButton({ onPress, disabled }: CameraButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.outerRing,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <View style={styles.innerCircle} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  outerRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  innerCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "white",
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },
});

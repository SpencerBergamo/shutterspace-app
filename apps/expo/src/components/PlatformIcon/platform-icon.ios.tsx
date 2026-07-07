import { iosIconMap, type PlatformIconProps } from "@/src/components/PlatformIcon/platform-icon.types";
import { SymbolView } from "expo-symbols";

export default function PlatformIcon({
  name,
  size = 24,
  color = "black",
}: PlatformIconProps) {
  return (
    <SymbolView
      name={iosIconMap[name]}
      size={size}
      tintColor={color}
    />
  );
}

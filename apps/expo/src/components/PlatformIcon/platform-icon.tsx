import { androidIconMap, type PlatformIconProps } from "@/src/components/PlatformIcon/platform-icon.types";

export default function PlatformIcon({
  name,
  size = 24,
  color = "black",
}: PlatformIconProps) {
  const Icon = androidIconMap[name];

  return <Icon size={size} color={color} />;
}

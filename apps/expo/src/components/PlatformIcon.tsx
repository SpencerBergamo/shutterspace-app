import { MaterialIcons } from '@expo/vector-icons';
import { SFSymbol, SymbolView } from 'expo-symbols';
import { Platform } from 'react-native';

type IconName = { ios: SFSymbol, android: string }

interface PlatformIconProps {
  name: IconName[keyof IconName];
  size?: number;
  color?: string;
}

const iconMap: Record<string, { ios: SFSymbol; android: keyof typeof MaterialIcons.glyphMap }> = {
  profile: { ios: 'person.circle', android: 'person' },
  friends: { ios: 'person.2.circle', android: 'people' },
  eye: { ios: 'eye.circle', android: 'visibility' },
  eyeOff: { ios: 'eye.slash.circle', android: 'visibility-off' },
  home: { ios: 'house.circle', android: 'home' },
  search: { ios: 'magnifyingglass.circle', android: 'search' },
  settings: { ios: 'gearshape.circle', android: 'settings' },
  logout: { ios: 'rectangle.portrait.and.arrow.right', android: 'logout' },
  add: { ios: 'plus', android: 'add' },
  edit: { ios: 'pencil.circle', android: 'edit' },
  delete: { ios: 'trash.circle', android: 'delete' },
  cancel: { ios: 'xmark.circle', android: 'cancel' },
  confirm: { ios: 'checkmark.circle', android: 'check' },
  notifications: { ios: 'bell.circle', android: 'notifications' },
  gallery: { ios: 'photo.on.rectangle.angled', android: 'photo-library' },
  camera: { ios: 'camera.circle', android: 'photo-camera' },
}

export default function PlatformIcon({ name, size = 24, color = "black" }: PlatformIconProps) {

  const mapped = iconMap[name];

  if (Platform.OS === 'ios') {
    return (
      <SymbolView
        name={mapped.ios}
        size={size}
        tintColor={color}
      />
    )
  }

  return (
    <MaterialIcons
      name={mapped.android}
      size={size}
      color={color}
    />
  )
}
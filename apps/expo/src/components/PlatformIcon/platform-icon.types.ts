import {
  Bell,
  Camera,
  CheckCircle,
  Eye,
  EyeOff,
  Home,
  Images,
  LayoutGrid,
  LogOut,
  Pencil,
  Plus,
  Search,
  Settings,
  Trash2,
  User,
  Users,
  XCircle,
  type LucideIcon,
} from "lucide-react-native";
import type { SFSymbol } from "sf-symbols-typescript";

export type PlatformIconName =
  | "profile"
  | "friends"
  | "eye"
  | "eyeOff"
  | "home"
  | "search"
  | "settings"
  | "logout"
  | "add"
  | "edit"
  | "delete"
  | "cancel"
  | "confirm"
  | "gallery"
  | "notifications"
  | "camera"
  | "grid2x2";


export interface PlatformIconProps {
  name: PlatformIconName;
  size?: number;
  color?: string;
}

export const iosIconMap: Record<PlatformIconName, SFSymbol> = {
  profile: "person.circle",
  friends: "person.2.circle",
  eye: "eye.circle",
  eyeOff: "eye.slash.circle",
  home: "house.circle",
  search: "magnifyingglass.circle",
  settings: "gearshape.circle",
  logout: "rectangle.portrait.and.arrow.right",
  add: "plus",
  edit: "pencil.circle",
  delete: "trash.circle",
  cancel: "xmark.circle",
  confirm: "checkmark.circle",
  gallery: "photo.on.rectangle",
  notifications: "bell",
  camera: "camera",
  grid2x2: "square.grid.2x2",
};

export const androidIconMap: Record<PlatformIconName, LucideIcon> = {
  profile: User,
  friends: Users,
  eye: Eye,
  eyeOff: EyeOff,
  home: Home,
  search: Search,
  settings: Settings,
  logout: LogOut,
  add: Plus,
  edit: Pencil,
  delete: Trash2,
  cancel: XCircle,
  confirm: CheckCircle,
  gallery: Images,
  notifications: Bell,
  camera: Camera,
  grid2x2: LayoutGrid,
};

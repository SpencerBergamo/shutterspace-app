import {
  Bell,
  Camera,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  FileText,
  HelpCircle,
  Home,
  Images,
  Inbox,
  LayoutGrid,
  LogOut,
  Pencil,
  Plus,
  Search,
  Settings,
  Share2,
  Shield,
  Star,
  SwitchCamera,
  Trash2,
  User,
  Users,
  XCircle,
  Zap,
  ZapOff,
  type LucideIcon,
} from "lucide-react-native";
import type { SFSymbol } from "sf-symbols-typescript";

export type PlatformIconName =
  | "flash"
  | "flashOff"
  | "flipCamera"
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
  | "grid2x2"
  | "chevronRight"
  | "chevronLeft"
  | "share"
  | "star"
  | "help"
  | "document"
  | "shield"
  | "inbox";


export interface PlatformIconProps {
  name: PlatformIconName;
  size?: number;
  color?: string;
}

export const iosIconMap: Record<PlatformIconName, SFSymbol> = {
  flash: "bolt",
  flashOff: "bolt.slash",
  flipCamera: "arrow.triangle.2.circlepath",
  profile: "person.circle",
  friends: "person.2",
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
  chevronRight: "chevron.right",
  chevronLeft: "chevron.left",
  share: "square.and.arrow.up",
  star: "star",
  help: "bubble.left",
  document: "doc.text",
  shield: "shield",
  inbox: "tray",
};

export const androidIconMap: Record<PlatformIconName, LucideIcon> = {
  flash: Zap,
  flashOff: ZapOff,
  flipCamera: SwitchCamera,
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
  chevronRight: ChevronRight,
  chevronLeft: ChevronLeft,
  share: Share2,
  star: Star,
  help: HelpCircle,
  document: FileText,
  shield: Shield,
  inbox: Inbox,
};

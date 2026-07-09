import { useAppTheme } from "@/src/context/AppThemeContext";
import { Image } from "expo-image";
import { Text, View } from "react-native";

export function AlbumsEmptyState() {
    const { colors } = useAppTheme();

    return (
        <View style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 32,
            gap: 24,
        }}>
            <View style={{
                width: 96,
                height: 96,
                borderRadius: 48,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: colors.primary + "20",
            }}>
                <Image
                    source="sf:photo.on.rectangle.angled"
                    style={{ width: 48, height: 48 }}
                    tintColor={colors.primary as string}
                />
            </View>
            <View style={{ alignItems: "center", gap: 8 }}>
                <Text selectable style={{
                    fontSize: 24,
                    fontWeight: "700",
                    textAlign: "center",
                    color: colors.text,
                }}>
                    No Albums Yet
                </Text>
                <Text selectable style={{
                    fontSize: 16,
                    textAlign: "center",
                    lineHeight: 24,
                    color: colors.caption,
                }}>
                    Albums you create or join will appear here
                </Text>
            </View>
        </View>
    );
}

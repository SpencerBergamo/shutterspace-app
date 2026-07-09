import { useAppTheme } from "@/src/context/AppThemeContext";
import { Image } from "expo-image";
import { Text, View } from "react-native";

interface AlbumsSearchEmptyStateProps {
    query: string;
}

export function AlbumsSearchEmptyState({ query }: AlbumsSearchEmptyStateProps) {
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
                backgroundColor: colors.grey3,
            }}>
                <Image
                    source="sf:magnifyingglass"
                    style={{ width: 40, height: 40 }}
                    tintColor={colors.caption as string}
                />
            </View>
            <View style={{ alignItems: "center", gap: 8 }}>
                <Text selectable style={{
                    fontSize: 24,
                    fontWeight: "700",
                    textAlign: "center",
                    color: colors.text,
                }}>
                    No Results
                </Text>
                <Text selectable style={{
                    fontSize: 16,
                    textAlign: "center",
                    lineHeight: 24,
                    color: colors.caption,
                }}>
                    No albums match "{query}"
                </Text>
            </View>
        </View>
    );
}

import { useAppTheme } from "@/src/context/AppThemeContext";
import { Image } from "expo-image";
import { Text, View } from "react-native";

type AlbumsEmptyStateProps =
    | { variant?: "default" }
    | { variant: "search"; query: string };

export function AlbumsEmptyState(props: AlbumsEmptyStateProps) {
    const { colors } = useAppTheme();
    const isSearch = props.variant === "search";

    return (
        <View
            style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                paddingHorizontal: 32,
                gap: 24,
            }}
        >
            <View
                style={{
                    width: 96,
                    height: 96,
                    borderRadius: 48,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: isSearch ? colors.grey3 : colors.primary + "20",
                }}
            >
                <Image
                    source={isSearch ? "sf:magnifyingglass" : "sf:photo.on.rectangle.angled"}
                    style={{ width: isSearch ? 40 : 48, height: isSearch ? 40 : 48 }}
                    tintColor={(isSearch ? colors.caption : colors.primary) as string}
                />
            </View>
            <View style={{ alignItems: "center", gap: 8 }}>
                <Text
                    selectable
                    style={{
                        fontSize: 24,
                        fontWeight: "700",
                        textAlign: "center",
                        color: colors.text,
                    }}
                >
                    {isSearch ? "No Results" : "No Albums Yet"}
                </Text>
                <Text
                    selectable
                    style={{
                        fontSize: 16,
                        textAlign: "center",
                        lineHeight: 24,
                        color: colors.caption,
                    }}
                >
                    {isSearch
                        ? `No albums match "${props.query}"`
                        : "Albums you create or join will appear here"}
                </Text>
            </View>
        </View>
    );
}

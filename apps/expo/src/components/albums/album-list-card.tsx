import { useAppTheme } from "@/src/context/AppThemeContext";
import useAlbumCover from "@/src/hooks/useAlbumCover";
import { formatAlbumDate } from "@/src/utils/formatters";
import { Album } from "@shutterspace/backend/types/Album";
import { Image } from "expo-image";
import { memo } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

interface AlbumListCardProps {
    album: Album;
    onPress: () => void;
}

function AlbumListCard({ album, onPress }: AlbumListCardProps) {
    const { colors } = useAppTheme();
    const { requesting, coverUrl, mediaId } = useAlbumCover(album._id);

    return (
        <Pressable
            onPress={onPress}
            style={{ width: "100%", gap: 8 }}
        >
            <View
                testID="album-tile-cover"
                style={{
                borderRadius: 16,
                borderCurve: "continuous",
                backgroundColor: "#DEDEDE",
                overflow: "hidden",
                width: "100%",
                aspectRatio: 1,
                justifyContent: "center",
                alignItems: "center",
            }}>
                {coverUrl && mediaId ? (
                    <Image
                        source={{ uri: coverUrl, cacheKey: mediaId }}
                        style={{ width: "100%", height: "100%", backgroundColor: "#DEDEDE" }}
                        contentFit="cover"
                        cachePolicy="memory-disk"
                    />
                ) : requesting ? (
                    <ActivityIndicator size="small" color="grey" />
                ) : (
                    <Image
                        source="sf:photo"
                        style={{ width: 48, height: 48 }}
                        tintColor="#777777"
                    />
                )}
            </View>

            <Text
                selectable
                numberOfLines={2}
                style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: colors.text,
                }}
            >
                {album.title}
            </Text>

            <Text
                selectable
                style={{ fontSize: 12, color: colors.caption }}
            >
                {formatAlbumDate(album._creationTime)}
            </Text>
        </Pressable>
    );
}

export default memo(AlbumListCard);

import { useAppTheme } from "@/src/context/AppThemeContext";
import useAlbumCover from "@/src/hooks/useAlbumCover";
import { rememberAlbum } from "@/src/lib/albumSnapshotCache";
import { formatAlbumDate } from "@/src/utils/formatters";
import { Album } from "@shutterspace/backend/types/Album";
import { Image } from "expo-image";
import { Link } from "expo-router";
import { memo, useEffect } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

interface AlbumListCardProps {
    album: Album;
    href: string;
}

function AlbumListCard({ album, href }: AlbumListCardProps) {
    const { colors } = useAppTheme();
    const { requesting, coverUrl, cacheKey } = useAlbumCover(album._id, { cover: album.cover });

    useEffect(() => {
        rememberAlbum(album);
    }, [album]);

    return (
        <Link href={href} asChild>
            <Pressable style={{ width: "100%", gap: 8 }}>
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
                    }}
                >
                    <Link.AppleZoom>
                        {coverUrl && cacheKey ? (
                            <Image
                                source={{ uri: coverUrl, cacheKey }}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    backgroundColor: "#DEDEDE",
                                }}
                                contentFit="cover"
                                cachePolicy="memory-disk"
                                transition={0}
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
                    </Link.AppleZoom>
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
        </Link>
    );
}

export default memo(AlbumListCard);

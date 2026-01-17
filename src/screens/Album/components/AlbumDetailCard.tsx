import { useAppTheme } from "@/src/context/AppThemeContext";
import useAlbumCover from "@/src/hooks/useAlbumCover";
import { Album } from "@/src/types/Album";
import { formatAlbumDate } from "@/src/utils/formatters";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { ActivityIndicator, Text, View } from "react-native";

interface AlbumDetailCardProps {
    album: Album;
    height: number;
    width: number;
}

export default function AlbumDetailCard({ album, height, width }: AlbumDetailCardProps) {

    const { colors } = useAppTheme();
    const { requesting, coverUrl, mediaId } = useAlbumCover(album._id);

    return (
        <View style={{
            flexDirection: 'column',
            marginBottom: 16,
            width,
            marginHorizontal: 8,
        }}>

            <View style={{
                borderRadius: 16,
                backgroundColor: '#DEDEDEFF',
                overflow: 'hidden',
                marginBottom: 8,
                width,
                height,
                aspectRatio: 1,
                justifyContent: 'center',
                alignItems: 'center',
            }}>
                {coverUrl && mediaId ? (
                    <Image
                        source={{ uri: coverUrl, cacheKey: mediaId }}
                        style={{ width: '100%', height: '100%', backgroundColor: '#DEDEDEFF' }}
                        contentFit="cover"
                        cachePolicy={'memory-disk'}
                        onError={(e) => {
                            console.error("Album Cover Image ERROR: ", e);
                        }}
                    />
                ) : requesting ? (
                    <ActivityIndicator size="small" color="grey" />
                ) : (
                    <Ionicons name="image-outline" size={48} color="#777777" />
                )}
            </View>

            <Text style={{
                fontSize: 16,
                fontWeight: '600',
                marginBottom: 4,
                color: colors.text
            }}>
                {album.title}
            </Text>

            <Text style={{ fontSize: 12, color: colors.text + '80' }} >
                {formatAlbumDate(album._creationTime)}
            </Text>
        </View>
    );

}
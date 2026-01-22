import { api } from "@shutterspace/backend/convex/_generated/api";
import { Id } from "@shutterspace/backend/convex/_generated/dataModel";
import { MediaIdentifier } from "@/src/types/Media";
import { useAction } from "convex/react";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

interface AlbumInvitationCoverProps {
    albumId: Id<'albums'>;
    cover?: MediaIdentifier;
}

export default function AlbumInvitationCover({ albumId, cover }: AlbumInvitationCoverProps) {

    const getAlbumCover = useAction(api.albums.getAlbumCover);

    const [uri, setUri] = useState<string | undefined | null>(undefined);

    useEffect(() => {
        (async () => {
            try {
                if (cover) {
                    const url = await getAlbumCover({ albumId, identifier: cover });
                    setUri(url);
                } else {
                    setUri(null);
                }
            } catch (e) {
                console.error("Failed to get album cover: ", e);
                setUri(null);
            }
        })();
    }, [albumId, cover]);


    return (
        <View style={StyleSheet.absoluteFillObject}>
            {uri ? (
                <Image
                    source={{ uri: uri }}
                    style={styles.image}
                    contentFit="cover"
                    cachePolicy={'memory-disk'}
                />
            ) : (<LinearGradient
                colors={['#1a3d3b', '#0a2f2e', '#051a19']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
            >
                <View style={styles.blurOverlay} />
                <View style={styles.accentLight} />
            </LinearGradient>)}
        </View>
    );
}

const styles = StyleSheet.create({
    image: {
        width: '100%',
        height: '100%',
    },

    gradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    blurOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(9, 173, 169, 0.08)',
    },
    accentLight: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(9, 173, 169, 0.12)',
        opacity: 0.6,
    }
})
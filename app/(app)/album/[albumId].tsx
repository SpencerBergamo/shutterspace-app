import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useGridConfig } from "@/hooks/useGridConfig";
import { useImagePicker } from "@/hooks/useImagePicker";
import { useMediaUpload } from "@/hooks/useMediaUpload";
import { useQuery } from "convex/react";
import { Dimensions, FlatList, StyleSheet, View } from "react-native";

const { width } = Dimensions.get('window');
const NUM_COLUMNS = 3;
const SPACING = 2;
const ITEM_WIDTH = (width - (SPACING * (NUM_COLUMNS - 1))) / NUM_COLUMNS;

/**
 * 
 * ill use Cloudinary's upload progress, thumbnail display for uploaded media files:
 * https://cloudinary.com/documentation/client_side_uploading
 * 
 * Cloudinary also supports video playback with native video controls which id like touse
 * 
 * 1. user selects media
 * 2. create optimistic state with: MediaUpload[]
 * 3. initiate cloudinary uploads
 * 4. update optimistic state during upload
 * 5. cloudinary upload completes
 * 6. trigger convex mutation
 * 7. convex mutation completes
 * 
 * Implicit Access Control: We will check membership status for users trying to fetch albums
 * where they're a member of. The media associated with those albumIds will be avialable to
 * them as well without having to check membership status again because we will have already
 * checked the status for them to get the albumId.
 * 
 * Optimistic State UI Flow: Implicit Access Control -> meaning we'll assume the user has
 *    access to the media with the albumId where we already checked their membership status
 * 1. User selects array of assets
 * 2. A bulk of signatures are generated from cloudinary
 * 3. The assets are looped over to be uploaded one-at-a-time with its own unique
 *    signature. The placeholder in the grid will be the asset.uri and a loading progress
 *    of it's upload or loading queue 
 * 4. In that same loop that's uploading the file, the convex media table entry is made
 *    from the cloudinary url that's returned from the successful upload.
 * 5. And because we'll be running queries in our frontend, like useQuery, our data will always
 *    remain up to date on the AlbumPage. So all we have to do is merge the new data incoming
 *    from the query to the optimistically added tiles.
 */

interface AlbumPageProps {
    albumId: Id<"albums">;
    profileId: Id<"profiles">;
}

export default function AlbumPage({ albumId, profileId }: AlbumPageProps) {
    const { numColumns, spacing, itemSize } = useGridConfig();
    const pickAssets = useImagePicker();
    const { optimisticMedia } = useMediaUpload(albumId, profileId);
    const mediaQuery = useQuery(api.media.getMediaForAlbum,
        { albumId, pagination: { numItems: 50, cursor: null } });

    return (
        <View style={{ flex: 1 }}>
            <FlatList
                data={mediaQuery?.page ?? []}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => {
                    return (<></>);
                }}
            />
        </View>
    );


}

// export default function AlbumDetail() {
//     const { albumId } = useLocalSearchParams();
//     const album = albumMockData.find((album) => album.albumId === albumId);

//     if (!album) {
//         return (
//             <View><Text>Album not found</Text></View>
//         );
//     }

//     const mockMedia = Array.from({ length: 13 }, (_, index) => ({
//         id: `media-${index}`,
//         type: 'image' as const,
//         url: '',
//         createdAt: new Date(),
//         uploadedBy: '1',
//     }));

//     return (
//         <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
//             <FlatList
//                 keyExtractor={(item) => item.id}
//                 data={mockMedia}
//                 numColumns={3}
//                 renderItem={({ item }) => (
//                     <View style={styles.mediaItem} />
//                 )}
//                 contentContainerStyle={styles.grid}
//             />
//             <FloatingActionButton id="fab" onPress={() => { }} />
//         </SafeAreaView>
//     )
// }

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F1F6',
    },
    grid: {
        padding: SPACING,
    },
    mediaItem: {
        width: ITEM_WIDTH,
        height: ITEM_WIDTH,
        backgroundColor: '#E5E5E5',
        borderRadius: 2,
        margin: SPACING / 2,
    },
});
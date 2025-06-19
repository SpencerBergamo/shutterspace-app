import { useProfile } from '@/context/ProfileContext';
import { useAlbums } from '@/hooks/useAlbums';
import { Album } from '@/types/Album';
import { getGridConfig } from '@/utils/getGridConfig';
import { useCallback } from 'react';
import { ActivityIndicator, Dimensions, StyleSheet, Text, View } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import AlbumCard from '../../components/albums/AlbumCard';
import FloatingActionButton from '../../components/FloatingActionButton';

const PADDING = 16;
const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = (SCREEN_WIDTH - (PADDING * 3)) / 2;
// const CARD_HEIGHT = (CARD_WIDTH * 5) / 4;

export default function Home() {
    const { profile } = useProfile();

    const { columns, gap, width, height } = getGridConfig({
        columns: 2,
        gap: 16,
        aspectRatio: 5 / 4
    });

    const { albums, createAlbum, updateAlbum, deleteAlbum } = useAlbums(profile._id);

    const renderItem = useCallback(({ item }: { item: Album }) => (
        <View style={{ width: width, height: height }}>
            <AlbumCard album={item} />
        </View>
    ), [width, height]);

    return (
        <View style={styles.container}>

            {!albums ? (
                <ActivityIndicator size="large" />
            ) : albums.length === 0 ? (
                <Text>No Albums Found</Text>
            ) : (
                <FlatList
                    keyExtractor={(item) => item._id}
                    data={albums}
                    numColumns={columns}
                    renderItem={renderItem}
                    contentContainerStyle={{ gap: 16 }}
                    columnWrapperStyle={{ justifyContent: 'space-between' }}
                />
            )}

            {/* Floating Action Button */}
            <FloatingActionButton id="fab" onPress={() => { }} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
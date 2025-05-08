import { useRouter } from 'expo-router';
import { Dimensions, StyleSheet, View } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import { albumMockData } from '../../config/env';
import { useAuth } from '../../hooks/useAuth';
import { Album } from '../../types/Album';
import AlbumCard from '../components/AlbumCard';

const PADDING = 16;
const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = (SCREEN_WIDTH - (PADDING * 3)) / 2;
const CARD_HEIGHT = (CARD_WIDTH * 5) / 4;

export default function Home() {
    const { user } = useAuth();
    const router = useRouter();

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <FlatList
                    keyExtractor={(item) => item.albumId}
                    contentContainerStyle={styles.albumList}
                    columnWrapperStyle={styles.columnWrapper}
                    data={albumMockData}
                    numColumns={2}
                    renderItem={({ item }) => (
                        <View style={styles.cardContainer}>
                            <AlbumCard album={item as Album} />
                        </View>
                    )} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F1F6',
    },
    content: {
        flex: 1,
    },
    albumList: {
        padding: PADDING,
    },
    columnWrapper: {
        justifyContent: 'space-between',
    },
    cardContainer: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        marginBottom: PADDING,
    }
});
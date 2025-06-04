import { useProfile } from '@/context/ProfileContext';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import { ActivityIndicator, Dimensions, StyleSheet, Text, View } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import AlbumCard from '../components/ui/AlbumCard';
import FloatingActionButton from '../components/ui/FloatingActionButton';

const PADDING = 16;
const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = (SCREEN_WIDTH - (PADDING * 3)) / 2;
// const CARD_HEIGHT = (CARD_WIDTH * 5) / 4;

export default function Home() {
    const { profile } = useProfile();

    const albums = useQuery(api.albums.getUserAlbums,
        profile ? { profileId: profile._id as Id<'profiles'> } : 'skip');

    if (!albums) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" />
            </View>
        );
    } else if (albums.length === 0) {
        return (
            <View style={styles.container}>
                <Text>No albums found</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>

            {/* Album Grid */}
            <View style={styles.content}>
                <FlatList
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.albumList}
                    columnWrapperStyle={styles.columnWrapper}
                    data={albums}
                    numColumns={2}
                    renderItem={({ item }) => (
                        <View style={styles.cardContainer}>
                            <AlbumCard album={item} />
                        </View>
                    )} />
            </View>

            {/* Floating Action Button */}
            <FloatingActionButton id="fab" onPress={() => { }} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#080221FF',
    },
    header: {
        padding: PADDING,
        paddingBottom: PADDING / 2,
    },
    headerText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#000',
    },
    optionalPlaceholder: {
        padding: PADDING,
        paddingTop: 0,
        paddingBottom: PADDING / 2,
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
        height: CARD_WIDTH,
        marginBottom: PADDING,
    }
});
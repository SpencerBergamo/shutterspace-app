import { Ionicons } from '@expo/vector-icons';
import { createNativeStackNavigator, NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import * as MediaLibrary from 'expo-media-library';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Button,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
// import Modal from 'react-native-modal';
import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { Image } from 'expo-image';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Define types
type Asset = MediaLibrary.Asset;
type Album = MediaLibrary.Album;

type RootStackParamList = {
  Media: undefined;
  Albums: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface MediaGridProps {
  currentAlbum: Album | null;
  selectedAssets: Asset[];
  setSelectedAssets: React.Dispatch<React.SetStateAction<Asset[]>>;
}

interface AlbumListProps {
  albums: Album[];
  currentAlbum: Album | null;
  onSelect: (album: Album) => void;
  navigation: NavigationProp;
}

interface PickerSheetProps {
  onClose: () => void;
}

const Stack = createNativeStackNavigator<RootStackParamList>();
const numColumns = 3;
const spacing = 1;
const imageSize =
  (Dimensions.get('window').width - spacing * (numColumns - 1)) / numColumns;

function format(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${mins}:${secs}`;
}

function MediaGrid({ currentAlbum, selectedAssets, setSelectedAssets }: MediaGridProps) {
  const [assets, setAssets] = useState<Asset[]>([]);

  useEffect(() => {
    if (!currentAlbum) return;

    MediaLibrary.getAssetsAsync({
      album: currentAlbum.id,
      mediaType: [MediaLibrary.MediaType.video, MediaLibrary.MediaType.photo],
      sortBy: [['creationTime', false]],
    }).then((res) => setAssets(res.assets));
  }, [currentAlbum]);

  const toggleSelect = (asset: Asset) => {
    const exists = selectedAssets.some((a) => a.id === asset.id);
    setSelectedAssets((prev) =>
      exists ? prev.filter((a) => a.id !== asset.id) : [...prev, asset]
    );
  };

  const renderItem = ({ item }: { item: Asset }) => {
    const isSelected = selectedAssets.some((a) => a.id === item.id);
    const isVideo = item.mediaType === 'video';

    return (
      <TouchableOpacity
        onPress={() => toggleSelect(item)}
        style={{ marginBottom: spacing }}>
        <Image
          source={{ uri: item.uri }}
          style={{ width: imageSize, height: imageSize }}
        />

        {isSelected && (
          <View style={styles.checkIcon}>
            <Ionicons name="checkmark-circle" size={20} color="#00A3A3" />
          </View>
        )}

        {isVideo && (
          <View style={styles.videoDuration}>
            <Text style={{ color: 'white', fontSize: 10 }}>
              {format(item.duration)}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // return (
  //   <FlatList
  //     data={assets}
  //     keyExtractor={(item) => item.id}
  //     numColumns={numColumns}
  //     renderItem={renderItem}
  //     columnWrapperStyle={{ justifyContent: 'space-between' }}
  //   />
  // );

  return (
    <BottomSheetFlatList data={[]} renderItem={renderItem} contentContainerStyle={{}} />
  );
}

function AlbumList({ albums, currentAlbum, onSelect, navigation }: AlbumListProps) {
  return (
    <FlatList
      data={albums}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <TouchableOpacity
          onPress={() => {
            onSelect(item);
            navigation.goBack();
          }}
          style={styles.albumRow}>
          <Text style={{ flex: 1 }}>{item.title}</Text>

          {currentAlbum?.id === item.id && (
            <Ionicons name="checkmark" size={18} color="#00A3A3" />
          )}
        </TouchableOpacity>
      )}
    />
  );
}

function PickerSheet({ onClose }: PickerSheetProps) {
  const [permissionRes, reqPermission] = MediaLibrary.usePermissions();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [currentAlbum, setCurrentAlbum] = useState<Album | null>(null);
  const [selectedAssets, setSelectedAssets] = useState<Asset[]>([]);

  useEffect(() => {
    if (!permissionRes?.granted) {
      reqPermission();
    } else {
      MediaLibrary.getAlbumsAsync().then((res: Album[]) => {
        setAlbums(res);
        setCurrentAlbum(res[0]);
      });
    }
  }, [permissionRes, reqPermission]);

  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Media"
        options={({ navigation }: NativeStackScreenProps<RootStackParamList, 'Media'>) => ({
          headerTitle: currentAlbum?.title || 'Recents',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate('Albums')}
              style={{ marginRight: 12 }}>
              <Ionicons name="albums-outline" size={20} />
            </TouchableOpacity>
          ),
        })}>
        {() => (
          <MediaGrid
            currentAlbum={currentAlbum}
            selectedAssets={selectedAssets}
            setSelectedAssets={setSelectedAssets}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="Albums">
        {({ navigation }) => (
          <AlbumList
            albums={albums}
            currentAlbum={currentAlbum}
            onSelect={setCurrentAlbum}
            navigation={navigation}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>

  );
}

export default function Index() {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['80%'], []);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAssets, setSelectedAssets] = useState<Asset[]>([]);
  const [permissionRes, reqPermission] = MediaLibrary.usePermissions();

  useEffect(() => {
    async function loadAssets() {
      try {
        if (permissionRes?.status !== 'granted') {
          const permission = await reqPermission();
          if (!permission.granted) return;
        }

        const albums = await MediaLibrary.getAlbumsAsync();
        if (albums.length > 0) {
          const res = await MediaLibrary.getAssetsAsync({
            album: albums[0],
            mediaType: [MediaLibrary.MediaType.video, MediaLibrary.MediaType.photo],
            sortBy: [['creationTime', false]],
          });

          // const assetsWithInfo = await Promise.all(res.assets.map(async (asset) => {
          //   const assetInfo = await MediaLibrary.getAssetInfoAsync(asset);
          //   return assetInfo;
          // }))

          setAssets(res.assets);
        }
      } catch (e) {
        console.error("Error loading assets", e);
      }
    }

    loadAssets();
  }, [permissionRes, reqPermission]);

  const toggleSelect = (asset: Asset) => {
    const exists = selectedAssets.some((a) => a.id === asset.id);
    setSelectedAssets((prev) =>
      exists ? prev.filter((a) => a.id !== asset.id) : [...prev, asset]
    );
  };

  const renderItem = ({ item }: { item: Asset }) => {
    const isSelected = selectedAssets.some((a) => a.id === item.id);
    const isVideo = item.mediaType === MediaLibrary.MediaType.video;

    console.log("item", item.uri);

    return (
      <TouchableOpacity
        onPress={() => toggleSelect(item)}
        style={{ marginBottom: spacing }}>
        <Image
          source={{ uri: item.uri }}
          style={{ width: imageSize, height: imageSize }}
          contentFit="cover"
          contentPosition="center"
        />

        {isSelected && (
          <View style={styles.checkIcon}>
            <Ionicons name="checkmark-circle" size={20} color="#00A3A3" />
          </View>
        )}

        {isVideo && (
          <View style={styles.videoDuration}>
            <Text style={{ color: 'white', fontSize: 10 }}>
              {format(item.duration)}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (

    <GestureHandlerRootView style={styles.container}>
      <Button title="Open Image Picker" onPress={() => bottomSheetRef.current?.expand()} />

      <BottomSheet ref={bottomSheetRef} snapPoints={snapPoints} index={-1} enablePanDownToClose={true}>
        <BottomSheetFlatList data={assets} keyExtractor={(item) => item.id} numColumns={numColumns} renderItem={renderItem} contentContainerStyle={{}} />

      </BottomSheet>
    </GestureHandlerRootView>
    // <BottomSheetModalProvider>
    //   <View style={styles.container}>
    //     <Button title="Open Image Picker" onPress={openSheet} />
    //     <BottomSheetModal ref={bottomSheetRef} index={0} snapPoints={snapPoints} backdropComponent={renderBackdrop} enablePanDownToClose={true}>

    //       <View style={styles.bottomSheetContent}>

    //         <PickerSheet onClose={handleDismissModalPress} />
    //       </View>
    //     </BottomSheetModal>
    //   </View>
    // </BottomSheetModalProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  bottomSheetContent: {
    flex: 1,
    backgroundColor: 'white',
  },
  checkIcon: {
    position: 'absolute',
    top: 5,
    right: 5,
  },
  videoDuration: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  albumRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#ccc',
  },
});

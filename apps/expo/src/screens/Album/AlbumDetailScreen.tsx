import { useInfiniteMediaList } from "@/src/hooks/useInfiniteMediaList";
import { api } from "@shutterspace/backend/convex/_generated/api";
import { Id } from "@shutterspace/backend/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { useLocalSearchParams } from "expo-router";
import { NotFoundScreen } from "../Home";
import { Media } from "@shutterspace/backend/types/Media";
import { useCallback, useMemo } from "react";
import { Alert, useWindowDimensions } from "react-native";
import * as ImagePicker from 'expo-image-picker';
import { validateAssets } from "@/src/utils/mediaHelper";
import GalleryTile from "./components/GalleryTile";

const GAP = 2;
const NUM_COLUMNS = 3;

export function AlbumDetailScreen() {
   const { width } = useWindowDimensions();
   const { albumId } = useLocalSearchParams<{ albumId: Id<'albums'> }>();
   if (!albumId) return <NotFoundScreen />;

   const album = useQuery(api.albums.queryAlbum, { albumId });
   const { media, loadMore, status, uploadMedia, removePendingMedia, retryPendingMedia } = useInfiniteMediaList({ albumId });

   const mediaIds = useMemo(() => Array.from(media?.map(m => m.assetId) ?? []), [media]);

   const gridConfig = useMemo(() => {
      const totalGapWidth = GAP * (NUM_COLUMNS - 1);
      const itemSize = Math.ceil((width - totalGapWidth) / NUM_COLUMNS);

      return {
         itemSize,
         numColumns: NUM_COLUMNS,
         gap: GAP,
      };
   }, [width]);

   const handleMediaRetry = useCallback(async (assetId: string) => {
      try {
          const item = media?.find(m => m.assetId === assetId);
          if (!item) throw new Error("Media not found");

          throw new Error("Not implemented");
      } catch (e) {
          console.error("Failed to retry media upload: ", e);
          Alert.alert("Failed Upload", "Failed to retry the upload. Please try again.");
      }
   }, [albumId, media]);
   
//    const handleDeleteMediaSelection = useCallback(async () => {
//       try {
//           for (const item of selectedItems) {
//               await deleteMedia({ albumId, mediaId: item });
//           }
//       } catch (e) {
//           console.error("Failed to delete media selection: ", e);
//           Alert.alert("Failed to delete media selection", "Failed to delete the media selection. Please try again.");
//       }
   //   }, [selectedItems, albumId, deleteMedia]);

   const handleMediaUpload = useCallback(async (camera: boolean = false) => {
      try {
          let result: ImagePicker.ImagePickerResult;

          if (camera) {
              await ImagePicker.requestCameraPermissionsAsync();

              result = await ImagePicker.launchCameraAsync({
                  mediaTypes: ['images', 'videos'],
                  allowsMultipleSelection: true,
                  exif: true,
                  videoMaxDuration: 60,
              });
          } else {
              await ImagePicker.requestMediaLibraryPermissionsAsync();

              result = await ImagePicker.launchImageLibraryAsync({
                  mediaTypes: ['images', 'videos'],
                  allowsMultipleSelection: true,
                  exif: true,
                  videoMaxDuration: 60,
              });
          }

          if (!result || result.canceled || !result.assets || result.assets.length === 0) return;
          const { valid, invalid } = await validateAssets(result.assets);

          if (invalid.length > 0) {
              console.warn("Invalid assets: ", invalid.length);
              Alert.alert("Invalid assets", `${invalid.length} assets were invalid. Please try again.`);
          }

          await uploadMedia(valid);
      } catch (e) {
          console.error("Failed to upload media: ", e);
          Alert.alert("Error", "Some photos failed to upload. Please try again.");
      }
   }, [uploadMedia]);
   
   const handleMediaPress = useCallback((assetId: string) => { }, []);

   const renderItem = useCallback(({ assetId, index }: { assetId: string, index: number }) => { 
      

      
   }, [gridConfig.itemSize, gridConfig.numColumns]);

   return (
      <></>
   )
}
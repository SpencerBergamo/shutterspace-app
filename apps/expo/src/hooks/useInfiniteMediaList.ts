import { api } from "@shutterspace/backend/convex/_generated/api";
import { Id } from "@shutterspace/backend/convex/_generated/dataModel";
import { MediaIdentifier } from "@shutterspace/backend/types/Media";
import axios from "axios";
import { useAction, useMutation, usePaginatedQuery } from "convex/react";
import { useCallback, useMemo, useRef } from "react";
import { PendingUpload, useMediaStore } from "../store/useMediaStore";
import { ValidatedAsset } from "../utils/mediaHelper";
import { DisplayMedia } from "./useMedia";

interface UseInfiniteMediaListProps {
   albumId: Id<'albums'>;
   initialNumItems?: number;
}

interface UseInfiniteMediaListResult {
   media: DisplayMedia[] | undefined;
   loadMore: (numItems: number) => void;
   status: "LoadingFirstPage" | "CanLoadMore" | "LoadingMore" | "Exhausted";
   pendingMedia: PendingUpload[];
   uploadMedia: (assets: ValidatedAsset[]) => Promise<void>;
   removePendingMedia: (assetId: string) => void;
   retryPendingMedia: (assetId: string) => Promise<void>;
   retryAllFailedUploads: () => Promise<void>;
   clearFailedUploads: () => void;
}

export const useInfiniteMediaList = ({
   albumId,
   initialNumItems = 10,
}: UseInfiniteMediaListProps): UseInfiniteMediaListResult => {
   const prepareImageUpload = useAction(api.r2.prepareImageUpload);
   const prepareVideoUpload = useAction(api.cloudflare.prepareVideoUpload);
   const createNewMedia = useMutation(api.media.createMedia);

   const { results: paginatedMedia, loadMore, status } = usePaginatedQuery(
      api.media.paginateMedia,
      { albumId },
      { initialNumItems: 10 }
   );

   // Pending uploads store for this album
   const pendingUploads = useMediaStore(state => state.pendingUploads);
   const emptyArray = useRef<PendingUpload[]>([]).current;
   const pendingMedia = useMemo(() => {
      const uploads = Object.values(pendingUploads).filter(p => p.albumId === albumId);
      return uploads.length > 0 ? uploads : emptyArray;
   }, [pendingUploads, albumId, emptyArray]);

   // media store actions
   const {
      addPendingUpload,
      updatePendingUpload,
      removePendingMedia,
      clearFailedUploads,
   } = useMediaStore.getState();

   const media = useMemo(() => {
      if (paginatedMedia === undefined || paginatedMedia.length === 0) return pendingMedia;

      return [
         ...pendingMedia,
         ...(paginatedMedia ?? []),
      ] as DisplayMedia[];
   }, [paginatedMedia, pendingMedia]);

   const uploadAsset = useCallback(async (asset: ValidatedAsset) => {
      let uploadUrl: string | undefined;
      let identifier: MediaIdentifier | undefined;

      if (asset.type === 'image') {
         const { uploadUrl: imageUploadUrl, imageId } = await prepareImageUpload({
            albumId,
            filename: asset.filename,
            contentType: asset.mimeType,
            extension: asset.extension,
            incomingSize: asset.fileSize,
         });

         uploadUrl = imageUploadUrl;
         identifier = {
            type: 'image',
            imageId,
            width: asset.width,
            height: asset.height,
         }

         const blob = await fetch(asset.uri).then(res => res.blob());
         await axios.put(imageUploadUrl, blob, {
            headers: { 'Content-Type': asset.mimeType },
         }).catch(e => {
            console.error('Failed to upload image to R2', e);
            throw new Error('Failed to upload image');
         });
      } else if (asset.type === 'video') {
         const { uploadURL, uid } = await prepareVideoUpload({ albumId, filename: asset.filename, incomingSize: asset.fileSize });

         uploadUrl = uploadURL;
         identifier = {
            type: 'video',
            videoUid: uid,
            duration: asset.duration ?? 0,
            width: asset.width,
            height: asset.height,
         }

         const form = new FormData();
         form.append('file', {
            uri: asset.uri,
            name: asset.filename,
            type: asset.mimeType,
         } as any);

         await axios.post(uploadUrl, form, {
            headers: {
               'Content-Type': 'multipart/form-data',
            },
         }).catch(e => {
            console.error('Failed to upload video to Cloudflare', e);
            throw new Error('Failed to upload video');
         });
      } else {
         throw new Error('Invalid asset type');
      }

      return identifier;
   }, [albumId, prepareImageUpload, prepareVideoUpload]);

   const uploadMedia = useCallback(
      async (assets: ValidatedAsset[]) => {
         const newPending: PendingUpload[] = assets.map((asset) => ({
            assetId: asset.assetId,
            albumId,
            uri: asset.uri,
            filename: asset.filename,
            type: asset.type,
            width: asset.width,
            height: asset.height,
            duration: asset.duration ?? undefined,
            timestamp: Date.now(),
            status: 'uploading' as const,
            retryCount: 0,
         }));

         addPendingUpload(newPending);

         for (const asset of assets) {
            try {
               const identifier = await uploadAsset(asset);
               await createNewMedia({
                  albumId,
                  assetId: asset.assetId,
                  filename: asset.filename,
                  identifier,
                  setThumbnail: false,
                  status: 'pending',
                  size: asset.fileSize,
                  dateTaken: asset.exif?.DateTimeOriginal,
                  location: undefined,
               });

               updatePendingUpload(asset.assetId, 'success');
            } catch (e) {
               console.error('Failed to upload media:', e);
               updatePendingUpload(
                  asset.assetId,
                  'error',
               )
            }
         }
      }, [albumId, uploadAsset, createNewMedia, addPendingUpload, updatePendingUpload]
   );

   return {
      media,
      loadMore,
      status,
      pendingMedia,
      uploadMedia,
      removePendingMedia,
      retryPendingMedia: async (id) => { },
      retryAllFailedUploads: async () => { },
      clearFailedUploads,
   }
}
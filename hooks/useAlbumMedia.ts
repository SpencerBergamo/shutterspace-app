// import { useAuth } from "@/context/AuthContext";
// import { api } from "@/convex/_generated/api";
// import { Id } from "@/convex/_generated/dataModel";
// import { OptimisticMedia } from "@/types/Media";
// import { useMutation, useQuery } from "convex/react";
// import { useCallback, useState } from "react";


// // define the type for the data the hook will return
// type AlbumMediaItem =
//     | (Omit<OptimisticMedia, '_id'> & { _id: string; isOptimistic: true })
//     | (NonNullable<typeof api.media.getMediaForAlbum._returnType>[number] & { isOptimistic?: false });

// const useAlbumMedia = (albumId: Id<'albums'>) => {
//     const { user } = useAuth();
//     if (!user) throw new Error('User not found');

//     // fetch the initial media data from convex album
//     const fetchedMedia = useQuery(api.media.getMediaForAlbum, { albumId });

//     // state to manage optimistic media uploads
//     const [optimisticMedia, setOptimisticMedia] = useState<OptimisticMedia[]>([]);

//     // mutation to add media to Convex after cloudinary upload completes
//     const addMediaMutation = useMutation(api.media.createMedia);

//     const handleUploadMedia = useCallback(async (assets: any[]) => {
//         const newOptimisticMedia: OptimisticMedia[] = assets.map((asset) => ({
//             _id: `${Date.now()}-${Math.random()}`, // TODO: i want to use the file id
//             uri: asset.uri,
//             albumId: albumId,
//             status: 'pending',
//             progress: 0,
//             uploadedBy: user.uid as Id<'profiles'>,
//             mediaType: asset.mediaType === 'video' ? 'video' : 'image',
//             error: undefined,
//         }));

//         setOptimisticMedia((prev) => [...prev, ...newOptimisticMedia]);

//         for (const optimisticItem of newOptimisticMedia) {
//             try { 
//                 // const { signature, timestamp, cloudName, apiKey} = {};

                
//             } catch (e) {
//                 console.error("Upload failed for: ", optimisticItem.uri, e);
//                 setOptimisticMedia(prev => prev.map(item => item._id === optimisticItem._id
//                     ? { ...item, status: "error" }
//                     : item));
//             }
//         }


//     }, [albumId, addMediaMutation]);
// }
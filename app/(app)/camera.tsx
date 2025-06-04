import { CameraView, FlashMode, useCameraPermissions } from "expo-camera";
import * as VideoThumbnail from 'expo-video-thumbnails';
import { useRef, useState } from "react";
import { StyleSheet, View } from "react-native";

/* 
so we're gonna use a full page navigation stack from homepage to camera page. this will
make the camera feel important and separate from the homepage. 

after the user takes several photos, we'll open a full screen modal with the preview images
in a page view style. swipe left and right to see the photos, manage the selection you like
and then press a button to continue with album selection. 

the album selectin page will be a simple list of albums with a button to create a new album too.
(i dunno if i want to provide multiple album upload yet)

*/


export default function Camera() {
    const [permission, requestPermission] = useCameraPermissions();
    const [facing, setFacing] = useState<'front' | 'back'>('back');
    const [flash, setFlash] = useState<FlashMode>('auto');
    const [zoom, setZoom] = useState(0);
    const [isPhoto, setIsPhoto] = useState(false);
    const [isVideo, setIsVideo] = useState(false);

    const [lastMediaUri, setLastMediaUri] = useState<string | null>(null);
    const [previewMediaType, setPreviewMediaType] = useState<'photo' | 'video' | null>(null);

    const [showPreviewModal, setShowPreviewModal] = useState(false);

    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [isFocused, setIsFocused] = useState(true);
    const [isMounted, setIsMounted] = useState(false);

    const cameraRef = useRef<CameraView>(null);

    const handleFlip = () => {
        setFacing(facing === 'front' ? 'back' : 'front');
    }

    const handleTorch = () => {
        setFlash(flash === 'off' ? 'on' : 'off');
    }

    const handleZoom = (value: number) => {
        setZoom(value);
    }

    const handleTakePhoto = async () => {
        if (cameraRef.current && !isVideo) {
            const options = { quality: 0.8, base64: true };
            const data = await cameraRef.current.takePictureAsync(options);
            setLastMediaUri(data.uri);
            setIsPhoto(true);
            setPreviewMediaType('photo');
        }
    }

    const handleRecordVideo = async () => {
        if (cameraRef.current && !isPhoto && !isRecording && !isVideo) {
            setIsRecording(true);

            const data = await cameraRef.current.recordAsync({
                maxDuration: 60,
                codec: 'avc1',
            });

            setLastMediaUri(data?.uri ?? null);
            setIsRecording(false);
            setIsVideo(true);
            setPreviewMediaType('video');
        }
    }

    const handleThumbnailPreview = () => {
        if (lastMediaUri) {
            setShowPreviewModal(true);
        }
    }

    const handleClosePreview = () => {
        setShowPreviewModal(false);
    }

    const handleContinueWithUpload = () => {
        // TODO: Implement upload logic
    }

    const generateVideoThumbnail = async (videoUri: string) => {
        try {
            const { uri } = await VideoThumbnail.getThumbnailAsync(videoUri, { time: 5000 });
            return uri;
        } catch (e) { console.warn(e); return null; }
    }

    const thumbnailSource = previewMediaType === 'photo' && lastMediaUri ? { uri: lastMediaUri } : null;

    return (
        <View style={{ flex: 1, backgroundColor: 'black' }}>
            <CameraView
                style={{ flex: 1 }}
                ref={cameraRef}
                facing={facing}
                ratio='16:9'
                videoQuality="1080p"
                zoom={zoom}
                flash={flash}
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={({ type, data }) => {
                    console.log(`QR Code: type=${type}, data=${data}`);
                }}

            >

            </CameraView>

            {/* Preview Modal */}

        </View>
    );
}

const styles = StyleSheet.create({
    buttonContainer: {
        flexDirection: 'row',
        backgroundColor: 'transparent',
        margin: 20,
        justifyContent: 'space-between',
    },
    button: {
        flex: 0.1,
        alignSelf: 'flex-end',
        alignItems: 'center',
    },
    text: {
        fontSize: 18,
        color: 'white',
    },
    captureButtonContainer: {
        position: 'absolute',
        bottom: 20,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    captureButton: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 10,
    },
    recordingButton: {
        backgroundColor: 'teal',
    },
    thumbnailContainer: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        width: 50,
        height: 50,
        borderRadius: 5,
        overflow: 'hidden',
    },
    thumbnail: {
        width: '100%',
        height: '100%',
    },
    thumbnailPlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: 'grey',
        justifyContent: 'center',
        alignItems: 'center',
    },
    previewModalContainer: {},
    previewImage: {},
    previewVideo: {},
    videoPlayerPlaceholder: {},

    previewActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
    },
    previewActionButton: {
        padding: 10,
        backgroundColor: 'blue',
        borderRadius: 5,
    },
});
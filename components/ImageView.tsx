import { DbMedia } from "@/types/Media";
import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";

export default function ImageView({ media }: { media: DbMedia }) {
    return <View style={[styles.container, { backgroundColor: 'black' }]}>
        <Image
            source={{ uri: media.thumbnailUrl }}
            style={styles.image}
            contentFit="contain"
        />
    </View>
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    image: {
        width: '100%',
        height: '100%',
    }
})
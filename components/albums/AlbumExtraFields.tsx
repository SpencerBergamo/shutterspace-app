import { CalendarPlus, MapPinPlus } from "lucide-react-native";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";


interface AlbumExtraFieldsProps {
    inputComponent: React.ReactNode;
    onDateTimePress: () => void;
    onLocationPress: () => void;
    dateTimeValue?: string;
    locationValue?: string;
}

export default function AlbumExtraFields({
    inputComponent,
    onDateTimePress,
    onLocationPress,
    dateTimeValue,
    locationValue
}: AlbumExtraFieldsProps) {
    return (
        <View style={styles.container}>

            <View style={[styles.inputContainer, styles.contentContainer]}>
                {inputComponent}
            </View>

            <View style={styles.contentDivider} />

            <TouchableOpacity onPress={onDateTimePress} >
                <View style={[styles.dateTimeContainer, styles.contentContainer]}>
                    <CalendarPlus size={24} color="#666" />
                    <Text style={styles.contentText}>Date and Time</Text>
                </View>
            </TouchableOpacity>

            <View style={styles.contentDivider} />

            <TouchableOpacity onPress={onLocationPress} >
                <View style={[styles.locationContainer, styles.contentContainer]}>
                    <MapPinPlus size={24} color="#666" />
                    <Text style={styles.contentText}>Location</Text>
                </View>
            </TouchableOpacity>

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },

    contentContainer: {
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
    },
    contentDivider: {
        width: '100%',
        height: 1,
        backgroundColor: '#f0f0f0',
        marginVertical: 16,
    },
    contentText: {
        fontSize: 16,
        color: '#333',
        marginTop: 8,
    },

    inputContainer: {
        width: '100%',
        backgroundColor: '#f8f9fa',
        minHeight: 50,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 16,
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    input: {
        fontSize: 14,
        color: '#333',
        width: '100%',
        textAlign: 'center',
    },

    dateTimeContainer: {

    },

    locationContainer: {},

});
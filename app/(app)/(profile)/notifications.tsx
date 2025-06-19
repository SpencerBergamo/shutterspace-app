import { StyleSheet, Text, View } from 'react-native';

export default function Notifications() {
    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Notifications</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
}); 
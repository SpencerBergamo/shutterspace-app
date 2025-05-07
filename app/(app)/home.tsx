import { StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';

export default function Home() {
    const { user } = useAuth();

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Welcome to Shutterspace</Text>
            <Text style={styles.subtitle}>Signed in as {user?.email}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
    },
}); 
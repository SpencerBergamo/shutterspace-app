import { useAuth } from "@/context/AuthContext";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";


export default function Home() {

    const { firebaseUser } = useAuth();
    const router = useRouter();

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Home page</Text>
            <Text style={styles.email}>{firebaseUser?.email}</Text>
            
            <TouchableOpacity 
                style={styles.button} 
                onPress={() => router.push('/deep-link-test')}
            >
                <Text style={styles.buttonText}>Test Deep Links</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "white",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 10,
    },
    email: {
        fontSize: 16,
        color: "#666",
        marginBottom: 30,
    },
    button: {
        backgroundColor: "#007AFF",
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 8,
    },
    buttonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "600",
    },
});
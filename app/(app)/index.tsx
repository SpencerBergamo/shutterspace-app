import { useAuth } from "@/context/AuthContext";
import { StyleSheet, Text, View } from "react-native";

export default function Index() {
    const { user } = useAuth();

    return (
        <View style={styles.container} >
            {user && (
                <View style={styles.userInfo}>
                    <Text style={styles.userEmail}>Logged in as: {user.email}</Text>
                </View>
            )}
        </View>
    );


}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    userInfo: {
        position: 'absolute',
        top: 40,
        right: 20,
        backgroundColor: '#f0f0f0',
        padding: 8,
        borderRadius: 8,
    },
    userEmail: {
        fontSize: 12,
        color: '#666',
    },
});
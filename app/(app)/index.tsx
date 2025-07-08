import { useAuth } from "@/context/AuthContext";
import { StyleSheet, Text, View } from "react-native";


export default function Home() {

    const { firebaseUser } = useAuth();

    return (
        <View style={styles.container}>
            <Text>Home page</Text>
            <Text>{firebaseUser?.email}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "white",
        justifyContent: "center",
        alignItems: "center",
    },
});
import { StyleSheet, Text, View } from "react-native";


export default function Welcome() {

    return (
        <View style={styles.container}>
            <Text>Welcome page</Text>
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
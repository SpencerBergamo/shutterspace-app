import { StyleSheet, Text, View } from "react-native";


export default function SignUp() {

    return (
        <View style={styles.container}>
            <Text>Sign up</Text>
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
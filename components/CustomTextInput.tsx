import { StyleProp, StyleSheet, TextInput, TextInputProps, ViewStyle } from "react-native";


export default function CustomTextInput(
    extraProps?: TextInputProps,
    extraStyles?: StyleProp<ViewStyle>
) {

    return (
        <TextInput
            style={[
                styles.container,
                extraStyles,
                {
                    backgroundColor: '#f8f9fa',
                    borderColor: '#e9ecef',
                }
            ]}

            {...extraProps} />
    );

}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        minHeight: 50,
        borderRadius: 6,
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderWidth: 1,
    },

})
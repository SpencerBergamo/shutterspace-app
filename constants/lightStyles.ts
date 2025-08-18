import { StyleSheet } from "react-native";


export const LightStyles = StyleSheet.create({
    title: {
        fontSize: 28,
        fontWeight: 'bold' as const,
        lineHeight: 34,
        color: '#333333',
    },
    subtitle: {
        fontSize: 22,
        fontWeight: '600' as const,
        lineHeight: 28,
        color: '#333333',
    },
    header: {
        fontSize: 16,
        fontWeight: '600' as const,
        lineHeight: 22,
        color: '#333333',
    },
    body: {
        fontSize: 14,
        fontWeight: 'normal' as const,
        lineHeight: 22,
        color: '#333333',
    },
    caption: {
        fontSize: 14,
        fontWeight: 'normal' as const,
        lineHeight: 18,
        color: '#333333',
    },

    textInput: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#e9ecef',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: '#000000',
    },

    iconButton: {
        width: 32,
        height: 32,
        borderRadius: 12,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 10,
        borderWidth: 1,
        borderColor: '#D9DDE0',
    },

    floatingActionButton: {
        backgroundColor: '#09ADA9',
        width: 60,
        height: 60,
        borderRadius: 999,
    }
})
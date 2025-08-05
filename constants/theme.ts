import { TextStyle, ViewStyle } from "react-native";

export interface AppTheme {
    colors: {
        primary: string;
        onPrimary: string;
        secondary: string;
        onSecondary: string;
        accent: string;
        background: string;
        text: string;
        status: {
            success: string;
            warning: string;
            error: string;
        };
    };

    borderColor: string;


    typography: {
        title: TextStyle;
        header: TextStyle;
        subtitle: TextStyle;
        body: TextStyle;
        caption: TextStyle;
    };

    iconButton: ViewStyle & {
        size: number;
    };

    textButtonStyles: ViewStyle;

    textInput: TextStyle;

    components: {
        textInput: TextStyle & {
            textColor?: string;
            placeholderColor?: string;
        };

        floatingActionButton: ViewStyle & {
            iconColor?: string;
            iconSize?: number;
        };


        // textButton: ViewStyle & {
        //     textColor: string;
        //     textSize: number;
        // }

        textButton: ViewStyle & TextStyle;
    };
}

const baseTheme = {
    typography: {
        title: {
            fontSize: 28,
            fontWeight: 'bold' as const,
            lineHeight: 34,
        },
        subtitle: {
            fontSize: 22,
            fontWeight: '600' as const,
            lineHeight: 28,
        },
        header: {
            fontSize: 16,
            fontWeight: '600' as const,
            lineHeight: 22,
        },
        body: {
            fontSize: 14,
            fontWeight: 'normal' as const,
            color: '#333333',
            lineHeight: 22,
        },
        caption: {
            fontSize: 14,
            fontWeight: 'normal' as const,
            lineHeight: 18,
        },
    },
    status: {
        success: '#09ADA9',
        warning: '#FF9500',
        error: '#FF3B30',
    },
}


export const LightTheme: AppTheme = {

    colors: {
        primary: '#09ADA9',
        onPrimary: '#FFFFFF',
        secondary: '#FDFDFD',
        onSecondary: '#333333',
        accent: '#F5BAB3',
        background: '#FFFFFF',
        text: '#333333',
        status: baseTheme.status,
    },

    borderColor: '#e9ecef',

    typography: baseTheme.typography,

    iconButton: {
        width: 32,
        height: 32,
        borderRadius: 12,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 10,
        shadowColor: 'black',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        size: 20,
    },

    textButtonStyles: {
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 16,
        backgroundColor: '#E9ECEF',
        paddingHorizontal: 12,
    },

    textInput: {
        width: '100%',
        backgroundColor: '#f8f9fa',
        minHeight: 50,
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },

    components: {
        textInput: {
            width: '100%',
            backgroundColor: '#f8f9fa',
            minHeight: 50,
            borderRadius: 6,
            paddingHorizontal: 16,
            paddingVertical: 16,
            borderWidth: 1,
            borderColor: '#e9ecef',
        },

        floatingActionButton: {
            backgroundColor: '#09ADA9',
            iconColor: '#FFFFFF',
            iconSize: 24,
            borderRadius: 30,
            width: 60,
            height: 60,
        },

        textButton: {
            paddingHorizontal: 12,
            borderRadius: 16,
            height: 32,
            justifyContent: 'center',
            backgroundColor: '#E9ECEF',
            alignItems: 'center',
            color: '#333333',
            fontSize: 16,
            fontWeight: '600',
        },
    },
}

export const DarkTheme = {
    primary: '#09ADA9',
    secondary: '#FDFDFD',
    accent: '#F5BAB3',
    background: '#FDFDFD',
    text: '#333333',
    status: {
        success: '#09ADA9',
        warning: '#FF9500',
        error: '#FF3B30',
    },

    typography: {
        title: {
            fontSize: 28,
            fontWeight: 'bold' as const,
            lineHeight: 34,
        },
        subtitle: {
            fontSize: 22,
            fontWeight: '600' as const,
            lineHeight: 28,
        },
        body: {
            fontSize: 16,
            fontWeight: 'normal' as const,
            lineHeight: 22,
        },
        caption: {
            fontSize: 14,
            fontWeight: 'normal' as const,
            lineHeight: 18,
        },
    },

    components: {
        textInput: {
            width: '100%',
            backgroundColor: '#f8f9fa',
            minHeight: 50,
            borderRadius: 6,
            paddingHorizontal: 16,
            paddingVertical: 16,
            borderWidth: 1,
            borderColor: '#e9ecef',
        },

        floatingActionButton: {
            backgroundColor: '#09ADA9',
            iconColor: '#FFFFFF',
            iconSize: 24,
            borderRadius: 30,
            width: 60,
            height: 60,
            // justifyContent: 'center' as const,
            // alignItems: 'center' as const,
        },
    },

    iconButton: {
        primary: {
            backgroundColor: '#09ADA9',
            borderRadius: 30,
        },
        secondary: {
            backgroundColor: '#D9D9D9',
            borderRadius: 30,
        },
    },
}

export type ThemeStyles = typeof LightTheme;
// export type ThemeStyles = typeof LightTheme | typeof DarkTheme;
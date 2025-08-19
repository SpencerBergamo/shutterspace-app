
export interface ColorScheme {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    onBackground: string;
    text: string;
    caption: string;
    border: string;
    surface: string;
    danger: string;
}

export const lightColors: ColorScheme = {
    primary: '#09ADA9',
    secondary: '#FDFDFD',
    accent: '#F5BAB3',
    background: '#F8F9FA',
    onBackground: '#333333',
    text: '#271919FF',
    caption: '#6C757D',
    border: '#D9DDE0',
    surface: '#FFFFFF',
    danger: '#FF3B30',
};

export const darkColors: ColorScheme = {
    primary: '#09ADA9',
    secondary: '#FDFDFD',
    accent: '#F5BAB3',
    background: '#FFFFFF',
    onBackground: '#333333',
    text: '#333333',
    caption: '#6C757D',
    border: '#D9DDE0',
    surface: '#FFFFFF',
    danger: '#FF3B30',
}
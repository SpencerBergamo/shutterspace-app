export interface AppThemeColors {
    primary: string;
    secondary: string;
    tertiary: string;

    background: string;
    onBackground: string;
    text: string;
    caption: string;

    border: string;
    shadow: string;
    danger: string;

    grey1: string;
    grey2: string;
    grey3: string;
}

export const Light: AppThemeColors = {
    primary: '#09ADA9',
    secondary: '#F57F20',
    tertiary: '#D9117F',

    background: '#F8F9FA',
    onBackground: '#333333',
    text: '#271919FF',
    caption: '#6C757D',

    border: '#D9DDE0',
    shadow: '#000000',
    danger: '#FF3B30',

    grey1: '#6C757D',
    grey2: '#D9DDE0',
    grey3: '#F8F9FA',
}

export const TextInputStyles = {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
}
// Flag to control whether to use mock data in development
const developmentConfig = {
    USE_MOCK_DATA: true,
}

const productionConfig = {
    USE_MOCK_DATA: false,
}

const isProduction = process.env.NODE_ENV === 'production';
console.log('isProduction', __DEV__);

export const ENV = isProduction ? productionConfig : developmentConfig;
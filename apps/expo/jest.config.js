/** @type {import('jest').Config} */
module.exports = {
    preset: "jest-expo",
    transformIgnorePatterns: [
        "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@shopify/flash-list|@shutterspace/backend|native-base|react-native-svg|lucide-react-native)",
    ],
    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/$1",
        "^@shutterspace/backend/(.*)$": "<rootDir>/../../packages/backend/$1",
    },
};

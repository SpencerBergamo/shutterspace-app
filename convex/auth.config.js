export default {
    providers: [
        {
            domain: "https://securetoken.google.com/shutterspace-eb637",
            applicationID: "shutterspace-eb637",
            issuer: `https://securetoken.google.com/shutterspace-eb637`,
            jwks: `https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com`,
            algorithm: 'RS256',
        }
    ],
};
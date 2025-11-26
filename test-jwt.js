const crypto = require('crypto');

// Test JWT generation (use your actual values)
const videoUID = "1bf6ad8be04750211b5b2ab4adb30c2a";
const base64PEM = process.env.CLOUDFLARE_STREAM_PEM;
const keyID = process.env.CLOUDFLARE_STREAM_KEY_ID;

if (!base64PEM || !keyID) {
    console.error('Missing environment variables');
    process.exit(1);
}

const pem = Buffer.from(base64PEM, 'base64').toString('utf8');
const expiresIn = Math.floor(Date.now() / 1000) + 60 * 60; // 1 hour

const header = {
    alg: 'RS256',
    typ: 'JWT',
    kid: keyID,
};

const payload = {
    sub: videoUID,
    exp: expiresIn,
    thumbnail: true,
};

const encode = (obj) => {
    const json = JSON.stringify(obj);
    return Buffer.from(json)
        .toString('base64')
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");
};

const encodedHeader = encode(header);
const encodedPayload = encode(payload);
const message = `${encodedHeader}.${encodedPayload}`;

const signer = crypto.createSign('RSA-SHA256');
signer.update(message);
signer.end();

const signatureToBuffer = signer.sign(pem, 'base64');
const signature = signatureToBuffer
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

const token = `${message}.${signature}`;

console.log('Generated Token:', token);
console.log('\nTesting URL:');
console.log(`https://customer-01d9l4y5qwkqqqp5.cloudflarestream.com/${videoUID}/thumbnails/thumbnail.jpg?time=2s&token=${token}`);
console.log('\nDecoded Header:', JSON.stringify(header, null, 2));
console.log('Decoded Payload:', JSON.stringify(payload, null, 2));
console.log('\nKey ID:', keyID);
console.log('PEM exists:', !!pem);
console.log('PEM length:', pem.length);

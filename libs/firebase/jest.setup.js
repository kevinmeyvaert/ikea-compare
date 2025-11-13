// Polyfill TextEncoder and TextDecoder for Jest/Node.js environments
const { TextEncoder, TextDecoder } = require('util');

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock Firebase environment variables if needed
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';

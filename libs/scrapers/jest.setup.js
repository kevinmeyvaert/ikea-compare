// Polyfill TextEncoder and TextDecoder for Jest/Node.js environments
// Required for cheerio and undici
const { TextEncoder, TextDecoder } = require('util');

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

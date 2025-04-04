"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = require("fs");
var path_1 = require("path");
var envPath = (0, path_1.resolve)(__dirname, '.env');
var examplePath = (0, path_1.resolve)(__dirname, '.env.example');
// Load .env file as key-value pairs
function parseEnv(content) {
    return content
        .split('\n')
        .filter(function (line) { return line.trim() && !line.trim().startsWith('#'); })
        .reduce(function (acc, line) {
        var _a = line.split('='), key = _a[0], rest = _a.slice(1);
        var value = rest.join('=').trim().replace(/^"|"$/g, '');
        acc[key.trim()] = value;
        return acc;
    }, {});
}
try {
    var envContent = (0, fs_1.readFileSync)(envPath, 'utf-8');
    var exampleContent = (0, fs_1.readFileSync)(examplePath, 'utf-8');
    var env_1 = parseEnv(envContent);
    var example = parseEnv(exampleContent);
    var missingKeys = Object.keys(example).filter(function (key) { return !(key in env_1) || env_1[key] === ''; });
    if (missingKeys.length > 0) {
        console.error("\u274C Missing or empty environment variables: ".concat(missingKeys.join(', ')));
        process.exit(1);
    }
    console.log('✅ .env validated against .env.example');
}
catch (err) {
    console.error('❌ Failed to validate .env file:', err.message);
    process.exit(1);
}

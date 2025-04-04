import { readFileSync } from 'fs';
import { resolve } from 'path';

const envPath = resolve(__dirname, '.env');
const examplePath = resolve(__dirname, '.env.example');

// Load .env file as key-value pairs
function parseEnv(content: string): Record<string, string> {
  return content
    .split('\n')
    .filter(line => line.trim() && !line.trim().startsWith('#'))
    .reduce((acc, line) => {
      const [key, ...rest] = line.split('=');
      const value = rest.join('=').trim().replace(/^"|"$/g, '');
      acc[key.trim()] = value;
      return acc;
    }, {} as Record<string, string>);
}

try {
  const envContent = readFileSync(envPath, 'utf-8');
  const exampleContent = readFileSync(examplePath, 'utf-8');

  const env = parseEnv(envContent);
  const example = parseEnv(exampleContent);

  const missingKeys = Object.keys(example).filter(
    key => !(key in env) || env[key] === ''
  );

  if (missingKeys.length > 0) {
    console.error(`❌ Missing or empty environment variables: ${missingKeys.join(', ')}`);
    process.exit(1);
  }

  console.log('✅ .env validated against .env.example');
} catch (err) {
  console.error('❌ Failed to validate .env file:', err.message);
  process.exit(1);
}

const { execSync } = require('child_process');
const fs = require('fs');

console.log('Current directory:', process.cwd());
console.log('Files in directory:', fs.readdirSync('.'));

try {
  console.log('Running npm install...');
  const output = execSync('npm install', { encoding: 'utf8', stdio: 'pipe' });
  console.log('npm output:', output);
  console.log('Files after npm install:', fs.readdirSync('.'));
} catch (error) {
  console.error('npm install failed:', error.message);
  console.error('stderr:', error.stderr);
}

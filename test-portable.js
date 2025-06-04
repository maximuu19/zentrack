// Simple test to verify portable storage works
const path = require('path');
const fs = require('fs');

console.log('=== Portable Storage Test ===');
console.log('Process exec path:', process.execPath);
console.log('Process argv[0]:', process.argv[0]);
console.log('Process cwd:', process.cwd());
console.log('__dirname:', __dirname);

const execPath = process.execPath;
const execDir = path.dirname(execPath);
const dataDir = path.join(execDir, 'data');

console.log('Calculated data directory:', dataDir);

try {
  console.log('Attempting to create data directory...');
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('✓ Data directory created successfully');
  
  const testFile = path.join(dataDir, 'test.txt');
  fs.writeFileSync(testFile, 'Hello from portable app!');
  console.log('✓ Test file written successfully');
  
  console.log('Directory contents:', fs.readdirSync(dataDir));
} catch (error) {
  console.error('✗ Error:', error.message);
}

console.log('=== Test Complete ===');

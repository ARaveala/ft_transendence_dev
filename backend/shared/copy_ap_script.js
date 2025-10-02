const fs = require('fs');
const path = require('path');

const frontendPath = path.resolve(__dirname, '../../frontend/shared/api-protocols.ts');
const backendPath = path.resolve(__dirname, '../../backend/shared/apiProtocols.js');

const frontendContent = fs.readFileSync(frontendPath, 'utf-8');
const backendContent = fs.readFileSync(backendPath, 'utf-8');

// Extract API_PROTOCOL blocks
const frontendBlock = frontendContent.match(/API_PROTOCOL\s*=\s*\{([\s\S]*?)\}\s*as\s+const/);
const backendBlock = backendContent.match(/API_PROTOCOL\s*=\s*\{([\s\S]*?)\}/);

if (!frontendBlock || !backendBlock) {
  throw new Error('Could not find API_PROTOCOL block in one of the files.');
}

const frontendBody = frontendBlock[1];
const backendBody = backendBlock[1];

// Extract key-block pairs from frontend
const blockRegex = /([A-Z0-9_]+):\s*\{[\s\S]*?\},?/g;
const frontendMap = new Map();
let match;
while ((match = blockRegex.exec(frontendBody)) !== null) {
  frontendMap.set(match[1], match[0]);
}

// Extract keys from backend
const backendKeys = new Set();
const backendKeyRegex = /([A-Z0-9_]+):\s*\{/g;
let bmatch;
while ((bmatch = backendKeyRegex.exec(backendBody)) !== null) {
  backendKeys.add(bmatch[1]);
}

// Collect missing blocks
const missingBlocks = [];
for (const [key, block] of frontendMap.entries()) {
  if (!backendKeys.has(key)) {
    missingBlocks.push(block);
  }
}

if (missingBlocks.length === 0) {
  console.log('✅ Backend already has all keys.');
  process.exit(0);
}

// Insert missing blocks before closing };
const insertionPoint = backendContent.indexOf('};');
const updatedContent =
  backendContent.slice(0, insertionPoint) +
  ',\n  ' +
  missingBlocks.join(',\n  ') +
  backendContent.slice(insertionPoint);

fs.writeFileSync(backendPath, updatedContent, 'utf-8');
console.log(`✅ Added ${missingBlocks.length} missing keys to backend.`);






//
//const fs = require('fs');
//const path = require('path');
//
//
//const sourcePath = path.resolve(__dirname, '../../frontend/shared/api-protocols.ts');
//const targetPath = path.resolve(__dirname, '../../backend/shared/apiProtocols.js');
//
//const backendContent = fs.readFileSync(targetPath, 'utf-8');
//const frontendContent = fs.readFileSync(sourcePath, 'utf-8');
//
//
//const frontendMatch = frontendContent.match(/API_PROTOCOL\s*=\s*\{([\s\S]*?)\}\s*as\s+const/);
//if (!frontendMatch) throw new Error('Could not find API_PROTOCOL block in frontend file.');
//
//const frontendBlock = frontendMatch[1]; // just the inside of the object
//
//const backendMatch = backendContent.match(/API_PROTOCOL\s*=\s*\{([\s\S]*?)\}/);
//if (!backendMatch) throw new Error('Could not find API_PROTOCOL block in backend file.');
//
//const backendBlock = backendMatch[1];
//
//const keyRegex = /([A-Z0-9_]+):\s*\{/g;
//const frontendKeys = [...frontendBlock.matchAll(keyRegex)].map(m => m[1]);
//const backendKeys = [...backendBlock.matchAll(keyRegex)].map(m => m[1]);
//
//
//const missingKeys = frontendKeys.filter(k => !backendKeys.includes(k));
//const missingBlocks = [];
//
//for (const key of missingKeys) {
//  const blockMatch = frontendBlock.match(new RegExp(`${key}:\\s*\\{[\\s\\S]*?\\},`, 'm'));
//  if (blockMatch) {
//    missingBlocks.push(blockMatch[0]);
//  } else {
//    console.warn(`⚠️ Could not find block for missing key: ${key}`);
//  }
//}
//const insertionPoint = backendContent.indexOf('};');
//const updatedContent =
//  backendContent.slice(0, insertionPoint) +
//  ',\n  ' +
//  missingBlocks.join('\n  ') +
//  backendContent.slice(insertionPoint);
//
//fs.writeFileSync(targetPath, updatedContent, 'utf-8');


//const fs = require('fs');
//const path = require('path');
//
//const sourcePath = path.resolve(__dirname, '../../frontend/shared/api-protocols.ts');
//const targetPath = path.resolve(__dirname, '../../backend/shared/apiProtocols.js');
//
//let content = fs.readFileSync(sourcePath, 'utf-8');
//
//const headerAdd = '// Auto-generated from frontend shared file. Do not edit manually.\n\n';
//const addPath = 'const path = require("path");\n';
//// Replace any instance of 'export const API_PROTOCOL' with 'const API_PROTOCOL'
//content = content.replace(/export\s+const\s+API_PROTOCOL/g, 'const API_PROTOCOL');
//
//// Remove any export lines for API_PROTOCOL_ESM or default
//content = content.replace(/export\s+(default\s+)?API_PROTOCOL_ESM.*$/gm, '');
//content = content.replace(/as\s+const;/g, ';');
//
//// Remove only the `export` keyword from the start of the line
//	//content = content.replace(/^\s*export\s+const\s+API_PROTOCOL/, 'const API_PROTOCOL');
////content = content.replace(/^\s*export\s+(default\s+)?API_PROTOCOL_ESM.*$/gm, '');
//
////content = content.replace(/export\s+default\s+API_PROTOCOL_ESM;?/g, '');
////content = content.replace(/export\s+const\s+API_PROTOCOL_ESM\s+=\s+API_PROTOCOL;?/g, '');
//
//content += '\n\nmodule.exports = { API_PROTOCOL };';
//
//content = headerAdd + '\n' + addPath + '\n' + content;
//fs.writeFileSync(targetPath, content, 'utf-8');
//
//console.log('✅ Shared API protocol copied to backend.');


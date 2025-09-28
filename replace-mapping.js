const fs = require('fs');

// Read the full mapping
const fullMappingContent = fs.readFileSync('full-product-mapping.js', 'utf8');

// Extract just the PRODUCT_MAPPING object (without the comments at the beginning)
const lines = fullMappingContent.split('\n');
const mappingStartIndex = lines.findIndex(line => line.includes('const PRODUCT_MAPPING'));
const mappingEndIndex = lines.findIndex(line => line.includes('};'), mappingStartIndex);

const productMappingLines = lines.slice(mappingStartIndex, mappingEndIndex + 1);
const productMappingContent = productMappingLines.join('\n');

// Read the webhook file
let webhookContent = fs.readFileSync('app/api/webhook/payos/route.ts', 'utf8');

// Find the PRODUCT_MAPPING section in webhook
const mappingStart = webhookContent.indexOf('// Product mapping for USIM param_package');
const mappingEnd = webhookContent.indexOf('}', mappingStart) + 1;

// Replace the mapping
const beforeMapping = webhookContent.substring(0, mappingStart);
const afterMapping = webhookContent.substring(mappingEnd);

const newWebhookContent = beforeMapping + productMappingContent + afterMapping;

// Write back
fs.writeFileSync('app/api/webhook/payos/route.ts', newWebhookContent);

console.log('✅ PRODUCT_MAPPING updated successfully in webhook file');
console.log('📊 Mapping contains', productMappingLines.length, 'lines');
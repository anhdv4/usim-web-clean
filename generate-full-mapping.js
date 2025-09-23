const fs = require('fs');

// Read usim_data.json
const usimData = JSON.parse(fs.readFileSync('usim_data.json', 'utf8'));

// Current known data codes
const KNOWN_DATA_CODES = {
  "10day / 1GB Daily+Unlimited 512Kbps (KDDI/Softbank)": "c6976a3220ff4cd4ab71",
  "1day / 1GB Daily+Unlimited 512Kbps (CMHK/CTM/CMCC)": "322f692f3dd4437894b1"
};

// Generate placeholder data codes for unknown products
function generatePlaceholderDataCode(productName, index) {
  // Create a deterministic placeholder based on product name
  const hash = productName.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  return Math.abs(hash).toString(16).padStart(32, '0').substring(0, 32);
}

// Process usim_data.json to create PRODUCT_MAPPING
function generateProductMapping() {
  const mapping = {};

  usimData.forEach((item, index) => {
    const country = item[1].replace(/[^\x00-\x7F]+/g, '').trim();
    const productName = item[2];
    const price = parseFloat(item[3]);

    // Skip test products
    if (productName.toLowerCase().includes('test') ||
        productName.toLowerCase().includes('测试产品')) {
      return;
    }

    // Create full product name with type (assume esim for now)
    const fullProductName = `${productName} (esim)`;

    // Use known data code if available, otherwise generate placeholder
    const dataCode = KNOWN_DATA_CODES[productName] || generatePlaceholderDataCode(productName, index);

    mapping[fullProductName] = dataCode;
  });

  return mapping;
}

// Generate the mapping
const productMapping = generateProductMapping();

// Create the PRODUCT_MAPPING code
let mappingCode = '// Product mapping for USIM param_package\n';
mappingCode += '// Generated from usim_data.json\n';
mappingCode += 'const PRODUCT_MAPPING: { [key: string]: string } = {\n';

// Sort by product name for better organization
const sortedEntries = Object.entries(productMapping).sort(([a], [b]) => a.localeCompare(b));

sortedEntries.forEach(([productName, dataCode]) => {
  const isKnown = Object.keys(KNOWN_DATA_CODES).some(known =>
    productName.includes(known.split(' (')[0])
  );
  const comment = isKnown ? ' // ✅ REAL DATA CODE' : ' // 🔄 PLACEHOLDER - NEEDS UPDATE';
  mappingCode += `  "${productName}": "${dataCode}",${comment}\n`;
});

mappingCode += '};\n\n';

// Save to file
fs.writeFileSync('full-product-mapping.js', mappingCode);
fs.writeFileSync('full-product-mapping.json', JSON.stringify(productMapping, null, 2));

console.log('Generated PRODUCT_MAPPING with', Object.keys(productMapping).length, 'products');
console.log('✅ Real data codes:', Object.keys(KNOWN_DATA_CODES).length);
console.log('🔄 Placeholder codes:', Object.keys(productMapping).length - Object.keys(KNOWN_DATA_CODES).length);
console.log('');
console.log('Files created:');
console.log('- full-product-mapping.js (ready to copy to webhook)');
console.log('- full-product-mapping.json (for reference)');
console.log('');
console.log('Next steps:');
console.log('1. Update KNOWN_DATA_CODES with real data codes from USIM.vn');
console.log('2. Copy full-product-mapping.js content to webhook file');
console.log('3. Deploy updated container');

// Display sample of the mapping
console.log('\n=== SAMPLE PRODUCT_MAPPING (first 10) ===\n');
console.log(mappingCode.split('\n').slice(0, 15).join('\n'));
const fs = require('fs');

// Function to extract data-codes from HTML content
function extractDataCodes(htmlContent) {
  const products = [];

  // Parse HTML to find table rows with product data
  const rowRegex = /<tr[^>]*data-index="(\d+)"[^>]*>(.*?)<\/tr>/gs;
  const cellRegex = /<td[^>]*data-field="([^"]+)"[^>]*data-key="[^"]*"[^>]*>(.*?)<\/td>/gs;
  const buttonRegex = /data-code="([^"]+)".*?data-type="([^"]+)".*?data-name="([^"]+)"/g;

  let rowMatch;
  while ((rowMatch = rowRegex.exec(htmlContent)) !== null) {
    const rowContent = rowMatch[2];

    // Extract cells
    const cells = {};
    let cellMatch;
    while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
      cells[cellMatch[1]] = cellMatch[2];
    }

    // Extract buttons
    const buttons = [];
    let buttonMatch;
    while ((buttonMatch = buttonRegex.exec(rowContent)) !== null) {
      buttons.push({
        dataCode: buttonMatch[1],
        dataType: buttonMatch[2],
        dataName: buttonMatch[3]
      });
    }

    if (cells.country && cells.name && buttons.length > 0) {
      // Clean up HTML tags from cell content
      const country = cells.country.replace(/<[^>]*>/g, '').trim();
      const name = cells.name.replace(/<[^>]*>/g, '').trim();

      buttons.forEach(button => {
        products.push({
          country: country,
          name: name,
          dataCode: button.dataCode,
          dataType: button.dataType,
          fullName: `${name} (${button.dataType})`
        });
      });
    }
  }

  return products;
}

// Function to generate PRODUCT_MAPPING code
function generateProductMapping(products) {
  const mapping = {};

  products.forEach(product => {
    // Create a unique key for the product
    const key = `${product.name} (${product.dataType})`;
    mapping[key] = product.dataCode;
  });

  return mapping;
}

// Main function
function main() {
  // Read HTML content from stdin or file
  let htmlContent = '';

  if (process.argv[2]) {
    // Read from file
    try {
      htmlContent = fs.readFileSync(process.argv[2], 'utf8');
    } catch (error) {
      console.error('Error reading file:', error.message);
      process.exit(1);
    }
  } else {
    // Read from stdin
    console.log('Paste the HTML content from USIM.vn page and press Ctrl+D:');
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => {
      htmlContent += chunk;
    });
    process.stdin.on('end', () => {
      processData(htmlContent);
    });
    return;
  }

  processData(htmlContent);
}

function processData(htmlContent) {
  console.log('Extracting data codes from HTML...');

  const products = extractDataCodes(htmlContent);

  if (products.length === 0) {
    console.log('No products found. Make sure you copied the correct HTML from the USIM.vn products table.');
    return;
  }

  console.log(`\nFound ${products.length} products with data codes:\n`);

  products.forEach((product, index) => {
    console.log(`${index + 1}. ${product.country} - ${product.name}`);
    console.log(`   Data Code: ${product.dataCode}`);
    console.log(`   Type: ${product.dataType}`);
    console.log(`   Full Name: ${product.fullName}\n`);
  });

  // Generate PRODUCT_MAPPING
  const mapping = generateProductMapping(products);

  console.log('\n=== PRODUCT_MAPPING for webhook/payos/route.ts ===\n');
  console.log('// Product mapping for USIM param_package');
  console.log('const PRODUCT_MAPPING: { [key: string]: string } = {');

  Object.entries(mapping).forEach(([key, value]) => {
    console.log(`  "${key}": "${value}",`);
  });

  console.log('};\n');

  // Save to file
  const outputFile = 'extracted-data-codes.json';
  fs.writeFileSync(outputFile, JSON.stringify(products, null, 2));
  console.log(`Saved detailed data to ${outputFile}`);

  const mappingFile = 'product-mapping-update.json';
  fs.writeFileSync(mappingFile, JSON.stringify(mapping, null, 2));
  console.log(`Saved mapping to ${mappingFile}`);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { extractDataCodes, generateProductMapping };
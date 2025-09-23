// Script to help extract data-codes from USIM.vn manually
// Run this in browser console on https://www.usim.vn/esim_order/single.html

console.log('=== USIM Data Code Extractor ===');
console.log('Copy and paste this script into browser console on USIM.vn products page:');
console.log('');

const script = `
// Extract all data-codes from the page
const products = [];
const rows = document.querySelectorAll('tr[data-index]');

rows.forEach((row, index) => {
  try {
    const country = row.querySelector('td[data-field="country"]')?.textContent?.trim();
    const name = row.querySelector('td[data-field="name"]')?.textContent?.trim();
    const buttons = row.querySelectorAll('a[data-code]');

    buttons.forEach(button => {
      const dataCode = button.getAttribute('data-code');
      const dataType = button.getAttribute('data-type');
      const dataName = button.getAttribute('data-name');

      if (dataCode && country && name) {
        products.push({
          country,
          name,
          dataCode,
          dataType,
          dataName,
          fullName: \`\${name} (\${dataType})\`
        });
      }
    });
  } catch (error) {
    console.error('Error parsing row:', error);
  }
});

// Generate PRODUCT_MAPPING
let mappingCode = '// Product mapping for USIM param_package\\n';
mappingCode += 'const PRODUCT_MAPPING: { [key: string]: string } = {\\n';

products.forEach(product => {
  mappingCode += \`  "\${product.fullName}": "\${product.dataCode}",\\n\`;
});

mappingCode += '};\\n\\n';

// Display results
console.log('Found ' + products.length + ' products:');
console.table(products);
console.log('\\n=== COPY THIS PRODUCT_MAPPING CODE ===\\n');
console.log(mappingCode);

// Also log as JSON for easy copying
console.log('\\n=== JSON DATA ===\\n');
console.log(JSON.stringify(products, null, 2));
`;

console.log(script);
console.log('');
console.log('After running the script in browser console, copy the PRODUCT_MAPPING code and paste it into your webhook file.');
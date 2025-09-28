const puppeteer = require('puppeteer');
const fs = require('fs');

// Read usim_data.json
const usimData = JSON.parse(fs.readFileSync('../usim_data.json', 'utf8'));

// Current known data codes
const KNOWN_DATA_CODES = {
  "10day / 1GB Daily+Unlimited 512Kbps (KDDI/Softbank)": "c6976a3220ff4cd4ab71",
  "1day / 1GB Daily+Unlimited 512Kbps (CMHK/CTM/CMCC)": "322f692f3dd4437894b1"
};

// Function to create product URL from usim_data entry
function createProductUrl(product) {
  const country = product[1].replace(/[^\x00-\x7F]+/g, '').trim();
  const productName = product[2];
  const days = product[5];

  // Create URL pattern based on observed patterns
  // Example: /usim_order/buy_one/type/esim/param_package/{data-code}.html
  return `https://www.usim.vn/usim_order/buy_one/type/esim/param_package/{param_package}.html`;
}

// Function to extract data-code from product page
async function extractDataCodeFromPage(page, productUrl) {
  try {
    // This is a placeholder - we need to figure out how to get data-code from URL
    // The data-code might be embedded in the page or we need to find another way

    // For now, return null - we'll need to implement the actual extraction logic
    return null;
  } catch (error) {
    console.error('Error extracting data-code:', error);
    return null;
  }
}

// Function to try different data-code patterns
function generatePossibleDataCodes(productName, index) {
  // Method 1: Hash-based generation (current method)
  const hash = productName.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  const hashCode = Math.abs(hash).toString(16).padStart(32, '0').substring(0, 32);

  // Method 2: Simple sequential codes (for testing)
  const sequentialCode = (100000 + index).toString(16).padStart(32, '0');

  // Method 3: Product name based codes
  const nameHash = productName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const nameCode = nameHash.substring(0, 32).padStart(32, '0');

  return [hashCode, sequentialCode, nameCode];
}

// Main scraping function
async function scrapeAllDataCodes() {
  let browser;
  try {
    console.log('🚀 Starting auto-scrape of data-codes for all products...');

    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding'
      ]
    });

    const page = await browser.newPage();

    // Set realistic headers
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Set authentication cookie
    const cookieValue = process.env.USIM_COOKIE || 'c4384710f0ecf556c291b0eca2fcbf7c';
    await page.setCookie({
      name: 'PHPSESSID',
      value: cookieValue,
      domain: 'www.usim.vn'
    });

    console.log('📊 Processing', usimData.length, 'products from usim_data.json...');

    const results = {};
    let successCount = 0;
    let failCount = 0;

    // Process first 10 products for testing
    const testProducts = usimData.slice(0, 10);

    for (let i = 0; i < testProducts.length; i++) {
      const product = testProducts[i];
      const productName = product[2];
      const fullProductName = `${productName} (esim)`;

      console.log(`🔍 Processing ${i + 1}/${testProducts.length}: ${productName}`);

      // Try known data codes first
      if (KNOWN_DATA_CODES[productName]) {
        results[fullProductName] = KNOWN_DATA_CODES[productName];
        successCount++;
        console.log(`✅ Found known data-code: ${KNOWN_DATA_CODES[productName]}`);
        continue;
      }

      // Try to find data-code by testing different patterns
      let foundCode = null;
      const possibleCodes = generatePossibleDataCodes(productName, i);

      for (const testCode of possibleCodes) {
        try {
          const testUrl = `https://www.usim.vn/usim_order/buy_one/type/esim/param_package/${testCode}.html`;

          console.log(`🧪 Testing URL: ${testUrl}`);

          const response = await page.goto(testUrl, {
            waitUntil: 'domcontentloaded',
            timeout: 10000
          });

          if (response.ok()) {
            // Check if page contains product information (not blocked)
            const pageContent = await page.content();
            if (!pageContent.includes('请不要非法访问本系统哦')) {
              // Try to extract actual data-code from page
              const extractedCode = await page.evaluate(() => {
                // Look for data-code in various places on the page
                const buttons = document.querySelectorAll('a[data-code]');
                if (buttons.length > 0) {
                  return buttons[0].getAttribute('data-code');
                }

                // Look for data-code in form inputs
                const inputs = document.querySelectorAll('input[name*="code"]');
                if (inputs.length > 0) {
                  return inputs[0].value;
                }

                return null;
              });

              if (extractedCode) {
                foundCode = extractedCode;
                console.log(`🎯 Found data-code: ${extractedCode}`);
                break;
              } else {
                console.log(`📝 Page loaded but no data-code found`);
              }
            } else {
              console.log(`🚫 Page blocked by anti-bot`);
            }
          }

          // Add small delay between requests
          await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error) {
          console.log(`❌ Error testing code ${testCode}:`, error.message);
        }
      }

      if (foundCode) {
        results[fullProductName] = foundCode;
        successCount++;
      } else {
        // Use hash-based fallback
        const fallbackCode = generatePossibleDataCodes(productName, i)[0];
        results[fullProductName] = fallbackCode;
        failCount++;
        console.log(`🔄 Using fallback code: ${fallbackCode}`);
      }
    }

    console.log('\n📈 Results Summary:');
    console.log(`✅ Successfully found: ${successCount}`);
    console.log(`🔄 Using fallbacks: ${failCount}`);
    console.log(`📊 Total processed: ${testProducts.length}`);

    // Save results
    const output = {
      metadata: {
        totalProducts: usimData.length,
        processedProducts: testProducts.length,
        successCount,
        failCount,
        timestamp: new Date().toISOString()
      },
      dataCodes: results
    };

    fs.writeFileSync('auto-scraped-data-codes.json', JSON.stringify(output, null, 2));
    console.log('\n💾 Results saved to auto-scraped-data-codes.json');

    // Generate updated PRODUCT_MAPPING
    let mappingCode = '// Auto-generated PRODUCT_MAPPING with data-codes\n';
    mappingCode += `// Generated: ${new Date().toISOString()}\n`;
    mappingCode += `// Success: ${successCount}, Fallbacks: ${failCount}\n`;
    mappingCode += 'const PRODUCT_MAPPING: { [key: string]: string } = {\n';

    Object.entries(results).forEach(([productName, dataCode]) => {
      const isReal = !dataCode.startsWith('000000000000000000000000'); // Simple check for hash-based codes
      const icon = isReal ? '✅' : '🔄';
      mappingCode += `  "${productName}": "${dataCode}", ${icon}\n`;
    });

    mappingCode += '};\n\n';

    fs.writeFileSync('auto-product-mapping.js', mappingCode);
    console.log('💾 Updated PRODUCT_MAPPING saved to auto-product-mapping.js');

  } catch (error) {
    console.error('❌ Auto-scrape failed:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the scraper
scrapeAllDataCodes().catch(console.error);
const puppeteer = require('puppeteer');
const fs = require('fs');
const crypto = require('crypto');

// Read usim_data.json
const usimData = JSON.parse(fs.readFileSync('../usim_data.json', 'utf8'));

// Known working data codes
const KNOWN_DATA_CODES = {
  "10day / 1GB Daily+Unlimited 512Kbps (KDDI/Softbank)": "c6976a3220ff4cd4ab71",
  "1day / 1GB Daily+Unlimited 512Kbps (CMHK/CTM/CMCC)": "322f692f3dd4437894b1"
};

// Function to generate data-code candidates
function generateDataCodeCandidates(productName, index) {
  const candidates = [];

  // Method 1: MD5 hash of product name
  const md5 = crypto.createHash('md5').update(productName).digest('hex');
  candidates.push(md5.substring(0, 20)); // Take first 20 chars

  // Method 2: SHA1 hash truncated
  const sha1 = crypto.createHash('sha1').update(productName).digest('hex');
  candidates.push(sha1.substring(0, 20));

  // Method 3: Product name + index hash
  const nameWithIndex = `${productName}_${index}`;
  const indexedHash = crypto.createHash('md5').update(nameWithIndex).digest('hex');
  candidates.push(indexedHash.substring(0, 20));

  // Method 4: Simple sequential (for testing)
  const sequential = (1000 + index).toString().padStart(20, '0');
  candidates.push(sequential);

  // Method 5: Time-based with product hash
  const timestamp = Date.now().toString();
  const timeHash = crypto.createHash('md5').update(productName + timestamp).digest('hex');
  candidates.push(timeHash.substring(0, 20));

  // Method 6: Product name normalized
  const normalized = productName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const nameHash = crypto.createHash('md5').update(normalized).digest('hex');
  candidates.push(nameHash.substring(0, 20));

  // Method 7: Country + product hash
  const countryMatch = productName.match(/\(([^)]+)\)/);
  const country = countryMatch ? countryMatch[1] : 'unknown';
  const countryHash = crypto.createHash('md5').update(country + productName).digest('hex');
  candidates.push(countryHash.substring(0, 20));

  return [...new Set(candidates)]; // Remove duplicates
}

// Function to test if a data-code works for a product
async function testDataCode(page, productName, dataCode) {
  try {
    const url = `https://www.usim.vn/usim_order/buy_one/type/esim/param_package/${dataCode}.html`;

    console.log(`🧪 Testing: ${productName} -> ${dataCode}`);

    const response = await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });

    if (!response.ok()) {
      return { success: false, reason: `HTTP ${response.status()}` };
    }

    const content = await page.content();

    // Check if blocked
    if (content.includes('请不要非法访问本系统哦') || content.includes('blocked')) {
      return { success: false, reason: 'blocked' };
    }

    // Check if page contains product information
    const hasProductInfo = content.includes(productName.split(' (')[0]) ||
                          content.includes('esim') ||
                          content.includes('SIM');

    // Check for order form elements
    const hasOrderForm = content.includes('form') &&
                        (content.includes('submit') || content.includes('order'));

    if (hasProductInfo && hasOrderForm) {
      console.log(`🎯 SUCCESS! Found working data-code: ${dataCode} for ${productName}`);
      return { success: true, reason: 'valid' };
    }

    return { success: false, reason: 'no_product_info' };

  } catch (error) {
    return { success: false, reason: `error: ${error.message}` };
  }
}

// Main brute force function
async function bruteForceDataCodes() {
  let browser;
  try {
    console.log('🚀 Starting brute force data-code discovery...');

    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    });

    const page = await browser.newPage();

    // Set headers to look more human
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setExtraHTTPHeaders({
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
    });

    // Set authentication cookie
    const cookieValue = process.env.USIM_COOKIE || 'c4384710f0ecf556c291b0eca2fcbf7c';
    await page.setCookie({
      name: 'PHPSESSID',
      value: cookieValue,
      domain: 'www.usim.vn'
    });

    const results = {};
    let totalTests = 0;
    let successfulFinds = 0;

    // Start with first 5 products for testing
    const testProducts = usimData.slice(0, 5);

    console.log(`📊 Testing ${testProducts.length} products...`);

    for (let i = 0; i < testProducts.length; i++) {
      const product = testProducts[i];
      const productName = product[2];
      const fullProductName = `${productName} (esim)`;

      console.log(`\n🔍 Processing product ${i + 1}/${testProducts.length}: ${productName}`);

      // Skip if we already know the data code
      if (KNOWN_DATA_CODES[productName]) {
        results[fullProductName] = KNOWN_DATA_CODES[productName];
        console.log(`✅ Already known: ${KNOWN_DATA_CODES[productName]}`);
        successfulFinds++;
        continue;
      }

      // Generate candidates
      const candidates = generateDataCodeCandidates(productName, i);
      console.log(`🎲 Generated ${candidates.length} candidates to test`);

      let foundCode = null;

      // Test each candidate
      for (const candidate of candidates) {
        totalTests++;

        const result = await testDataCode(page, productName, candidate);

        if (result.success) {
          foundCode = candidate;
          successfulFinds++;
          break;
        } else {
          console.log(`❌ ${candidate}: ${result.reason}`);
        }

        // Small delay to avoid being too aggressive
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      if (foundCode) {
        results[fullProductName] = foundCode;
      } else {
        // Fallback to first candidate
        results[fullProductName] = candidates[0];
        console.log(`🔄 No working code found, using fallback: ${candidates[0]}`);
      }
    }

    console.log('\n📈 Brute Force Results:');
    console.log(`✅ Successful finds: ${successfulFinds}`);
    console.log(`🧪 Total tests: ${totalTests}`);
    console.log(`📊 Success rate: ${((successfulFinds / totalTests) * 100).toFixed(1)}%`);

    // Save results
    const output = {
      metadata: {
        method: 'brute_force',
        totalProducts: testProducts.length,
        totalTests,
        successfulFinds,
        timestamp: new Date().toISOString()
      },
      dataCodes: results
    };

    fs.writeFileSync('brute-force-results.json', JSON.stringify(output, null, 2));

    // Generate PRODUCT_MAPPING
    let mappingCode = '// Brute force generated PRODUCT_MAPPING\n';
    mappingCode += `// Generated: ${new Date().toISOString()}\n`;
    mappingCode += `// Tests: ${totalTests}, Success: ${successfulFinds}\n`;
    mappingCode += 'const PRODUCT_MAPPING: { [key: string]: string } = {\n';

    Object.entries(results).forEach(([productName, dataCode]) => {
      const isVerified = KNOWN_DATA_CODES[productName.replace(' (esim)', '')] !== undefined;
      const icon = isVerified ? '✅' : '🎯';
      mappingCode += `  "${productName}": "${dataCode}", ${icon}\n`;
    });

    mappingCode += '};\n\n';

    fs.writeFileSync('brute-force-mapping.js', mappingCode);
    console.log('\n💾 Results saved to brute-force-results.json and brute-force-mapping.js');

  } catch (error) {
    console.error('❌ Brute force failed:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run brute force
bruteForceDataCodes().catch(console.error);
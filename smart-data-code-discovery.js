const puppeteer = require('puppeteer');
const fs = require('fs');

// Read usim_data.json
const usimData = JSON.parse(fs.readFileSync('../usim_data.json', 'utf8'));

// Known working data codes
const KNOWN_DATA_CODES = {
  "10day / 1GB Daily+Unlimited 512Kbps (KDDI/Softbank)": "c6976a3220ff4cd4ab71",
  "1day / 1GB Daily+Unlimited 512Kbps (CMHK/CTM/CMCC)": "322f692f3dd4437894b1"
};

// Function to extract all data-codes from the main products page
async function extractAllDataCodesFromMainPage(page) {
  try {
    console.log('📄 Loading main products page...');

    // Try different possible URLs for the products page
    const possibleUrls = [
      'https://www.usim.vn/esim_order/single.html',
      'https://www.usim.vn/usim_order/single.html',
      'https://www.usim.vn/products.html',
      'https://www.usim.vn/'
    ];

    let pageLoaded = false;
    let content = '';

    for (const url of possibleUrls) {
      try {
        console.log(`🔗 Trying URL: ${url}`);
        const response = await page.goto(url, {
          waitUntil: 'networkidle2',
          timeout: 30000
        });

        if (response.ok()) {
          content = await page.content();
          if (!content.includes('请不要非法访问本系统哦') && content.length > 10000) {
            console.log(`✅ Successfully loaded page: ${url}`);
            pageLoaded = true;
            break;
          }
        }
      } catch (error) {
        console.log(`❌ Failed to load ${url}:`, error.message);
      }
    }

    if (!pageLoaded) {
      throw new Error('Could not load any products page');
    }

    // Extract data-codes using multiple methods
    console.log('🔍 Extracting data-codes from page...');

    const dataCodes = await page.evaluate(() => {
      const codes = new Set();

      // Method 1: Find all elements with data-code attribute
      document.querySelectorAll('[data-code]').forEach(el => {
        const code = el.getAttribute('data-code');
        if (code && code.length > 10) {
          codes.add(code);
        }
      });

      // Method 2: Find all links containing param_package
      document.querySelectorAll('a[href*="param_package"]').forEach(link => {
        const href = link.getAttribute('href');
        const match = href.match(/param_package\/([^\/]+)\.html/);
        if (match && match[1]) {
          codes.add(match[1]);
        }
      });

      // Method 3: Find all form inputs with code-related names
      document.querySelectorAll('input[name*="code"], input[name*="package"]').forEach(input => {
        const value = input.value;
        if (value && value.length > 10) {
          codes.add(value);
        }
      });

      // Method 4: Look for data-code in script tags
      document.querySelectorAll('script').forEach(script => {
        const text = script.textContent || '';
        const matches = text.match(/["']([a-f0-9]{20,})["']/g);
        if (matches) {
          matches.forEach(match => {
            const code = match.replace(/["']/g, '');
            if (code.length >= 20) {
              codes.add(code);
            }
          });
        }
      });

      return Array.from(codes);
    });

    console.log(`🎯 Found ${dataCodes.length} potential data-codes on the page`);

    // Filter valid data-codes (hex strings of reasonable length)
    const validCodes = dataCodes.filter(code =>
      /^[a-f0-9]{20,32}$/i.test(code) && code.length >= 20
    );

    console.log(`✅ Valid data-codes: ${validCodes.length}`);

    return validCodes;

  } catch (error) {
    console.error('❌ Failed to extract data-codes:', error);
    return [];
  }
}

// Function to match products to data-codes
function matchProductsToDataCodes(products, dataCodes) {
  const matches = {};
  const usedCodes = new Set();

  console.log('🔗 Matching products to data-codes...');

  // First pass: Exact matches for known products
  Object.entries(KNOWN_DATA_CODES).forEach(([productName, knownCode]) => {
    if (dataCodes.includes(knownCode)) {
      matches[`${productName} (esim)`] = knownCode;
      usedCodes.add(knownCode);
      console.log(`✅ Matched known: ${productName} -> ${knownCode}`);
    }
  });

  // Second pass: Try to match remaining products
  products.forEach((product, index) => {
    const productName = product[2];
    const fullProductName = `${productName} (esim)`;

    // Skip if already matched
    if (matches[fullProductName]) return;

    // Try to find a matching data-code
    // This is heuristic - we'll assign codes based on index for now
    const availableCodes = dataCodes.filter(code => !usedCodes.has(code));

    if (availableCodes.length > 0) {
      // Simple assignment: use code at same index, or first available
      const assignedCode = availableCodes[index % availableCodes.length];
      matches[fullProductName] = assignedCode;
      usedCodes.add(assignedCode);
      console.log(`🎯 Assigned: ${productName} -> ${assignedCode}`);
    }
  });

  return matches;
}

// Main discovery function
async function discoverDataCodes() {
  let browser;
  try {
    console.log('🚀 Starting smart data-code discovery...');

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
        '--disable-features=VizDisplayCompositor',
        '--disable-blink-features=AutomationControlled'
      ]
    });

    const page = await browser.newPage();

    // Set realistic browser fingerprint
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1920, height: 1080 });

    // Set authentication cookie
    const cookieValue = process.env.USIM_COOKIE || 'c4384710f0ecf556c291b0eca2fcbf7c';
    await page.setCookie({
      name: 'PHPSESSID',
      value: cookieValue,
      domain: 'www.usim.vn'
    });

    // Extract all available data-codes from the site
    const dataCodes = await extractAllDataCodesFromMainPage(page);

    if (dataCodes.length === 0) {
      console.log('❌ No data-codes found. Trying alternative approach...');

      // Alternative: Try to access individual product pages
      const alternativeCodes = await tryAlternativeDiscovery(page);
      dataCodes.push(...alternativeCodes);
    }

    console.log(`📊 Total data-codes discovered: ${dataCodes.length}`);

    // Match products to data-codes
    const matches = matchProductsToDataCodes(usimData, dataCodes);

    // Generate comprehensive PRODUCT_MAPPING
    const output = {
      metadata: {
        method: 'smart_discovery',
        totalProducts: usimData.length,
        discoveredCodes: dataCodes.length,
        matchedProducts: Object.keys(matches).length,
        timestamp: new Date().toISOString()
      },
      discoveredDataCodes: dataCodes,
      productMatches: matches
    };

    fs.writeFileSync('smart-discovery-results.json', JSON.stringify(output, null, 2));

    // Generate PRODUCT_MAPPING code
    let mappingCode = '// Smart discovery PRODUCT_MAPPING\n';
    mappingCode += `// Generated: ${new Date().toISOString()}\n`;
    mappingCode += `// Discovered codes: ${dataCodes.length}, Matched products: ${Object.keys(matches).length}\n`;
    mappingCode += 'const PRODUCT_MAPPING: { [key: string]: string } = {\n';

    // Sort by product name for consistency
    const sortedMatches = Object.entries(matches).sort(([a], [b]) => a.localeCompare(b));

    sortedMatches.forEach(([productName, dataCode]) => {
      const isKnown = Object.keys(KNOWN_DATA_CODES).some(known =>
        productName.includes(known)
      );
      const icon = isKnown ? '✅' : '🎯';
      mappingCode += `  "${productName}": "${dataCode}", ${icon}\n`;
    });

    mappingCode += '};\n\n';

    fs.writeFileSync('smart-product-mapping.js', mappingCode);

    console.log('\n💾 Results saved!');
    console.log(`📄 smart-discovery-results.json`);
    console.log(`📄 smart-product-mapping.js`);

    console.log('\n📈 Summary:');
    console.log(`🎯 Discovered data-codes: ${dataCodes.length}`);
    console.log(`🔗 Matched products: ${Object.keys(matches).length}`);
    console.log(`📊 Coverage: ${((Object.keys(matches).length / usimData.length) * 100).toFixed(1)}%`);

  } catch (error) {
    console.error('❌ Smart discovery failed:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Alternative discovery method
async function tryAlternativeDiscovery(page) {
  console.log('🔄 Trying alternative discovery methods...');

  const codes = new Set();

  try {
    // Try to access a few specific product URLs to see patterns
    const testUrls = [
      'https://www.usim.vn/usim_order/buy_one/type/esim/country/Australia.html',
      'https://www.usim.vn/usim_order/buy_one/type/esim/country/Brazil.html',
      'https://www.usim.vn/usim_order/buy_one/type/esim/country/Cambodia.html'
    ];

    for (const url of testUrls) {
      try {
        console.log(`🌐 Testing: ${url}`);
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });

        const pageCodes = await page.evaluate(() => {
          const foundCodes = [];

          // Extract codes from this page
          document.querySelectorAll('[data-code]').forEach(el => {
            const code = el.getAttribute('data-code');
            if (code && code.length > 10) {
              foundCodes.push(code);
            }
          });

          return foundCodes;
        });

        pageCodes.forEach(code => codes.add(code));
        console.log(`📝 Found ${pageCodes.length} codes on ${url.split('/').pop()}`);

        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        console.log(`❌ Failed to access ${url}:`, error.message);
      }
    }

  } catch (error) {
    console.error('Alternative discovery failed:', error);
  }

  return Array.from(codes);
}

// Run the discovery
discoverDataCodes().catch(console.error);
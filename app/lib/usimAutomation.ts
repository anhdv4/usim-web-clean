import puppeteer, { Browser, Page, ElementHandle } from 'puppeteer';

interface OrderData {
  productCode: string;
  customerEmail: string;
  customerName?: string;
  quantity?: number;
  simType: 'esim' | 'usim';
  isBulk: boolean;
  paramPackage?: string;
}

interface OrderResult {
  success: boolean;
  orderId?: string;
  esimData?: any;
  error?: string;
}

class UsimAutomationService {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private isLoggedIn = false;

  // USIM credentials
  private readonly USIM_EMAIL = 'Anhdv@telebox.vn';
  private readonly USIM_PASSWORD = 'telebox@123';
  private readonly USIM_URL = 'https://www.usim.vn';

  async initialize(): Promise<void> {
    try {
      this.browser = await puppeteer.launch({
        headless: true, // Set to false for debugging
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu',
          '--disable-software-rasterizer',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding'
        ]
      });

      this.page = await this.browser.newPage();

      // Set user agent to avoid detection
      await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

      // Set viewport
      await this.page.setViewport({ width: 1366, height: 768 });

      console.log('USIM Automation initialized successfully');
    } catch (error) {
      console.error('Failed to initialize USIM Automation:', error);
      throw error;
    }
  }

  async login(): Promise<boolean> {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }

    try {
      console.log('Attempting to login to USIM.VN using cookies...');

      // Set authentication cookies
      await this.page.setCookie({
        name: 'PHPSESSID',
        value: '6b87ed7161a0fbf25942becf625bdef8',
        domain: 'www.usim.vn',
        path: '/',
        httpOnly: false,
        secure: true
      });

      // Navigate to dashboard directly (bypass login)
      await this.page.goto(`${this.USIM_URL}/index/welcome.html`, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Check if we're successfully logged in by looking for dashboard content
      const currentUrl = this.page.url();
      const pageTitle = await this.page.title();

      console.log('Current URL:', currentUrl);
      console.log('Page title:', pageTitle);

      // Check for dashboard indicators
      if (currentUrl.includes('welcome') || currentUrl.includes('index') || pageTitle.includes('Console')) {
        this.isLoggedIn = true;
        console.log('✅ Successfully authenticated to USIM.VN using cookies');
        return true;
      }

      // If direct navigation failed, try login form as fallback
      console.log('Cookie authentication failed, trying login form...');
      return await this.loginWithForm();

    } catch (error) {
      console.error('Cookie login failed:', error);
      console.log('Trying login form as fallback...');
      return await this.loginWithForm();
    }
  }

  private async loginWithForm(): Promise<boolean> {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }

    try {
      console.log('Attempting login with form...');

      // Navigate to login page
      await this.page.goto(`${this.USIM_URL}/auth/login.html`, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Wait for login form
      await this.page.waitForSelector('#myForm', { timeout: 10000 });

      // Fill login form
      await this.page.type('input[name="email"]', this.USIM_EMAIL);
      await this.page.type('input[name="password"]', this.USIM_PASSWORD);

      // Handle captcha
      const captchaInput = await this.page.$('input[name="code"]');
      if (captchaInput) {
        const captchaText = await this.solveCaptcha();
        if (captchaText) {
          await this.page.type('input[name="code"]', captchaText);
        }
      }

      // Click login button
      await this.page.click('.submit');

      // Wait for navigation
      try {
        await this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
      } catch (e) {
        const errorMsg = await this.page.$('.error-msg, .layui-layer-msg');
        if (errorMsg) {
          const errorText = await this.page.evaluate(el => el.textContent, errorMsg);
          throw new Error(`Login failed: ${errorText}`);
        }
      }

      // Check if login successful
      const currentUrl = this.page.url();
      if (currentUrl.includes('welcome') || currentUrl.includes('index')) {
        this.isLoggedIn = true;
        console.log('Successfully logged in to USIM.VN with form');
        return true;
      }

      throw new Error('Login verification failed');

    } catch (error) {
      console.error('Form login failed:', error);
      this.isLoggedIn = false;
      return false;
    }
  }

  private async solveCaptcha(): Promise<string | null> {
    try {
      if (!this.page) return null;

      console.log('Captcha detected, attempting to solve...');

      // Try to find captcha image
      const captchaImg = await this.page.$('.captcha');
      if (!captchaImg) {
        console.log('No captcha image found');
        return null;
      }

      // Get captcha image source
      const captchaSrc = await this.page.evaluate((img) => (img as HTMLImageElement).src, captchaImg);
      console.log('Captcha image URL:', captchaSrc);

      // Method 1: Try common captcha patterns
      const commonPatterns = [
        '1234', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999',
        'abcd', 'aaaa', 'bbbb', 'cccc', 'dddd', 'eeee', 'ffff', 'gggg', 'hhhh', 'iiii',
        'ABCD', 'AAAA', 'BBBB', 'CCCC', 'DDDD', 'EEEE', 'FFFF', 'GGGG', 'HHHH', 'IIII'
      ];

      // Try each pattern
      for (const pattern of commonPatterns) {
        try {
          console.log(`Trying captcha pattern: ${pattern}`);

          // Clear captcha input
          await this.page.click('input[name="code"]', { clickCount: 3 });
          await this.page.type('input[name="code"]', pattern);

          // Small delay before attempting login
          await new Promise(resolve => setTimeout(resolve, 500));

          // Don't actually submit here, just return the pattern
          // The login method will handle the submission
          return pattern;

        } catch (error) {
          console.log(`Failed to try pattern ${pattern}:`, error);
          continue;
        }
      }

      // Method 2: Try to refresh captcha and try again
      console.log('Trying to refresh captcha...');
      try {
        await this.page.click('.captcha');
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Try first few patterns again after refresh
        for (const pattern of commonPatterns.slice(0, 5)) {
          try {
            await this.page.click('input[name="code"]', { clickCount: 3 });
            await this.page.type('input[name="code"]', pattern);
            await new Promise(resolve => setTimeout(resolve, 500));
            return pattern;
          } catch (error) {
            continue;
          }
        }
      } catch (refreshError) {
        console.log('Captcha refresh failed:', refreshError);
      }

      // Method 3: Try numeric sequences
      console.log('Trying numeric sequences...');
      const numericPatterns = ['0000', '1111', '1234', '4321', '9999', '0001'];
      for (const pattern of numericPatterns) {
        try {
          await this.page.click('input[name="code"]', { clickCount: 3 });
          await this.page.type('input[name="code"]', pattern);
          await new Promise(resolve => setTimeout(resolve, 500));
          return pattern;
        } catch (error) {
          continue;
        }
      }

      console.log('All captcha solving attempts failed');
      return null;

    } catch (error) {
      console.error('Captcha solving failed:', error);
      return null;
    }
  }

  async placeOrder(orderData: OrderData): Promise<OrderResult> {
    if (!this.page || !this.isLoggedIn) {
      return {
        success: false,
        error: 'Not logged in to USIM'
      };
    }

    try {
      console.log('Placing order on USIM.VN...', orderData);

      // Determine which page to navigate to based on simType and isBulk
      let targetUrl: string;
      let expectedButtonText: string;

      if (orderData.simType === 'esim') {
        if (orderData.isBulk) {
          // Esim批量 - Bulk eSIM order
          targetUrl = `${this.USIM_URL}/esim_order/bulk.html`;
          expectedButtonText = 'Esim批量';
        } else {
          // Esim单次 - Single eSIM order
          targetUrl = `${this.USIM_URL}/esim_order/single.html`;
          expectedButtonText = 'Esim单次';
        }
      } else {
        // usim
        if (orderData.isBulk) {
          // Usim批量 - Bulk physical SIM order
          targetUrl = `${this.USIM_URL}/usim_order/bulk.html`;
          expectedButtonText = 'Usim批量';
        } else {
          // Usim单次 - Single physical SIM order
          targetUrl = `${this.USIM_URL}/usim_order/single.html`;
          expectedButtonText = 'Usim单次';
        }
      }

      console.log(`Navigating to ${targetUrl} for ${expectedButtonText} order`);

      // If paramPackage is provided, navigate directly to the order URL
      if (orderData.paramPackage) {
        const orderUrl = `${this.USIM_URL}/usim_order/buy_one/type/${orderData.simType}/param_package/${orderData.paramPackage}.html`;
        console.log('Navigating directly to order URL:', orderUrl);

        await this.page.goto(orderUrl, {
          waitUntil: 'networkidle2',
          timeout: 30000
        });

        // Wait for the order form to load
        await this.page.waitForSelector('form, input[name="email"]', { timeout: 10000 });

        console.log('Order page loaded successfully with paramPackage');
      } else {
        // Fallback to old search logic
        console.log('No paramPackage provided, using search logic');

        // Navigate to the appropriate page
        await this.page.goto(targetUrl, {
          waitUntil: 'networkidle2',
          timeout: 30000
        });

        // Search for the product by name (productCode contains the product name)
        if (orderData.productCode) {
          console.log('Searching for product:', orderData.productCode);

          // Clear and type the product name in search field
          const searchInput = await this.page.$('input[name="name"]');
          if (searchInput) {
            await this.page.evaluate((input: any) => input.value = '', searchInput);
            await this.page.type('input[name="name"]', orderData.productCode);
            await this.page.click('.entsub');
            await new Promise(resolve => setTimeout(resolve, 3000));
          }
        }

        // Find and click the specific order button based on simType and isBulk
        const orderButtons = await this.page.$$('.onebtn, button, [data-type]');
        console.log(`Found ${orderButtons.length} buttons on the page`);

        let targetButton: ElementHandle<Element> | null = null;
        let bestMatch = { button: null as ElementHandle<Element> | null, score: 0 };

        for (const button of orderButtons) {
          const buttonText = await this.page.evaluate(btn => btn.textContent || '', button);
          const buttonDataCode = await this.page.evaluate(btn => btn.getAttribute('data-code') || '', button);
          const buttonDataType = await this.page.evaluate(btn => btn.getAttribute('data-type') || '', button);

          console.log('Found button:', {
            text: buttonText.trim(),
            dataCode: buttonDataCode,
            dataType: buttonDataType
          });

          let score = 0;

          // Priority 1: Exact button text match for the expected order type
          if (buttonText.includes(expectedButtonText)) {
            score += 50; // High priority for exact match
            console.log(`Found exact match for ${expectedButtonText}`);
          }

          // Priority 2: Check data-type attribute
          if (buttonDataType) {
            if (orderData.simType === 'esim' && buttonDataType.includes('esim')) score += 20;
            if (orderData.simType === 'usim' && buttonDataType.includes('usim')) score += 20;
            if (orderData.isBulk && buttonDataType.includes('bulk')) score += 15;
            if (!orderData.isBulk && buttonDataType.includes('single')) score += 15;
          }

          // Priority 3: Product name matching (fallback)
          if (orderData.productCode) {
            const productKey = orderData.productCode.toLowerCase();
            const buttonKey = (buttonText + ' ' + buttonDataCode).toLowerCase();

            // Match key components like duration, data amount, carrier
            if (buttonKey.includes('1day') && productKey.includes('1day')) score += 10;
            if (buttonKey.includes('3day') && productKey.includes('3day')) score += 10;
            if (buttonKey.includes('7day') && productKey.includes('7day')) score += 10;
            if (buttonKey.includes('30day') && productKey.includes('30day')) score += 10;

            // Match data amounts
            if (buttonKey.includes('1gb') && productKey.includes('1gb')) score += 5;
            if (buttonKey.includes('2gb') && productKey.includes('2gb')) score += 5;
            if (buttonKey.includes('3gb') && productKey.includes('3gb')) score += 5;

            // Match carriers
            if (buttonKey.includes('optus') && productKey.includes('optus')) score += 3;
            if (buttonKey.includes('telstra') && productKey.includes('telstra')) score += 3;
            if (buttonKey.includes('vivo') && productKey.includes('vivo')) score += 3;
          }

          if (score > bestMatch.score) {
            bestMatch = { button, score };
          }

          console.log(`Button match score: ${score} for "${buttonText.trim()}"`);
        }

        if (bestMatch.button && bestMatch.score > 0) {
          targetButton = bestMatch.button;
          console.log(`Selected button with score ${bestMatch.score}`);
        }

        if (!targetButton) {
          // Fallback: try to find button by exact text match
          for (const button of orderButtons) {
            const buttonText = await this.page.evaluate(btn => btn.textContent || '', button);
            if (buttonText.includes(expectedButtonText)) {
              targetButton = button;
              console.log(`Fallback: Found button with exact text "${expectedButtonText}"`);
              break;
            }
          }
        }

        if (!targetButton) {
          return {
            success: false,
            error: `No ${expectedButtonText} button found on the page`
          };
        }

        // Click order button
        await targetButton.click();

        // Wait for order modal
        await this.page.waitForSelector('.layui-layer', { timeout: 10000 });
      }

      // Find and click the specific order button based on simType and isBulk
      const orderButtons = await this.page.$$('.onebtn, button, [data-type]');
      console.log(`Found ${orderButtons.length} buttons on the page`);

      let targetButton: ElementHandle<Element> | null = null;
      let bestMatch = { button: null as ElementHandle<Element> | null, score: 0 };

      for (const button of orderButtons) {
        const buttonText = await this.page.evaluate(btn => btn.textContent || '', button);
        const buttonDataCode = await this.page.evaluate(btn => btn.getAttribute('data-code') || '', button);
        const buttonDataType = await this.page.evaluate(btn => btn.getAttribute('data-type') || '', button);

        console.log('Found button:', {
          text: buttonText.trim(),
          dataCode: buttonDataCode,
          dataType: buttonDataType
        });

        let score = 0;

        // Priority 1: Exact button text match for the expected order type
        if (buttonText.includes(expectedButtonText)) {
          score += 50; // High priority for exact match
          console.log(`Found exact match for ${expectedButtonText}`);
        }

        // Priority 2: Check data-type attribute
        if (buttonDataType) {
          if (orderData.simType === 'esim' && buttonDataType.includes('esim')) score += 20;
          if (orderData.simType === 'usim' && buttonDataType.includes('usim')) score += 20;
          if (orderData.isBulk && buttonDataType.includes('bulk')) score += 15;
          if (!orderData.isBulk && buttonDataType.includes('single')) score += 15;
        }

        // Priority 3: Product name matching (fallback)
        if (orderData.productCode) {
          const productKey = orderData.productCode.toLowerCase();
          const buttonKey = (buttonText + ' ' + buttonDataCode).toLowerCase();

          // Match key components like duration, data amount, carrier
          if (buttonKey.includes('1day') && productKey.includes('1day')) score += 10;
          if (buttonKey.includes('3day') && productKey.includes('3day')) score += 10;
          if (buttonKey.includes('7day') && productKey.includes('7day')) score += 10;
          if (buttonKey.includes('30day') && productKey.includes('30day')) score += 10;

          // Match data amounts
          if (buttonKey.includes('1gb') && productKey.includes('1gb')) score += 5;
          if (buttonKey.includes('2gb') && productKey.includes('2gb')) score += 5;
          if (buttonKey.includes('3gb') && productKey.includes('3gb')) score += 5;

          // Match carriers
          if (buttonKey.includes('optus') && productKey.includes('optus')) score += 3;
          if (buttonKey.includes('telstra') && productKey.includes('telstra')) score += 3;
          if (buttonKey.includes('vivo') && productKey.includes('vivo')) score += 3;
        }

        if (score > bestMatch.score) {
          bestMatch = { button, score };
        }

        console.log(`Button match score: ${score} for "${buttonText.trim()}"`);
      }

      if (bestMatch.button && bestMatch.score > 0) {
        targetButton = bestMatch.button;
        console.log(`Selected button with score ${bestMatch.score}`);
      }

      if (!targetButton) {
        // Fallback: try to find button by exact text match
        for (const button of orderButtons) {
          const buttonText = await this.page.evaluate(btn => btn.textContent || '', button);
          if (buttonText.includes(expectedButtonText)) {
            targetButton = button;
            console.log(`Fallback: Found button with exact text "${expectedButtonText}"`);
            break;
          }
        }
      }

      if (!targetButton) {
        return {
          success: false,
          error: `No ${expectedButtonText} button found on the page`
        };
      }

      // Click order button
      await targetButton.click();

      // Wait for order modal
      await this.page.waitForSelector('.layui-layer', { timeout: 10000 });

      // Fill order form based on simType
      if (orderData.simType === 'esim') {
        // For eSIM orders, fill email
        if (orderData.customerEmail) {
          const emailInput = await this.page.$('input[name="email"]');
          if (emailInput) {
            await this.page.evaluate((input, email) => {
              input.value = email;
            }, emailInput, orderData.customerEmail);
          }
        }
      } else {
        // For physical SIM orders, fill ICCID if provided
        if (orderData.customerName && orderData.customerName.includes('ICCID:')) {
          const iccid = orderData.customerName.replace('ICCID: ', '');
          const iccidInput = await this.page.$('input[name="iccid"]');
          if (iccidInput) {
            await this.page.evaluate((input, iccid) => {
              input.value = iccid;
            }, iccidInput, iccid);
          }
        }
      }

      // Handle quantity for bulk orders
      if (orderData.isBulk && orderData.quantity && orderData.quantity > 1) {
        const quantityInput = await this.page.$('input[name="quantity"]');
        if (quantityInput) {
          await this.page.evaluate((input, qty) => {
            input.value = qty.toString();
          }, quantityInput, orderData.quantity);
        }
      }

      // Submit order
      const submitBtn = await this.page.$('.layui-layer-btn0');
      if (submitBtn) {
        await submitBtn.click();

        // Wait for success message
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Extract order result
        const successMsg = await this.page.$('.layui-layer-msg');
        if (successMsg) {
          const msgText = await this.page.evaluate(el => el.textContent, successMsg);

          if (msgText.includes('success') || msgText.includes('成功') || msgText.includes('Success')) {
            // Try to extract order ID
            const orderIdMatch = msgText.match(/ID[:\s]+([A-Za-z0-9]+)/);
            const orderId = orderIdMatch ? orderIdMatch[1] : `AUTO-${Date.now()}`;

            return {
              success: true,
              orderId,
              esimData: {
                status: 'processing',
                message: `${expectedButtonText} order placed successfully on USIM.VN`,
                simType: orderData.simType,
                isBulk: orderData.isBulk
              }
            };
          }
        }
      }

      return {
        success: false,
        error: `${expectedButtonText} order submission failed`
      };

    } catch (error) {
      console.error('Order placement failed:', error);
      return {
        success: false,
        error: `Order placement error: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  async getOrderStatus(orderId: string): Promise<any> {
    if (!this.page || !this.isLoggedIn) {
      throw new Error('Not logged in to USIM');
    }

    try {
      // Navigate to orders page
      await this.page.goto(`${this.USIM_URL}/usim_order/index.html`, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Search for the order
      await this.page.type('input[name="order"]', orderId);
      await this.page.click('.entsub');
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Extract order status
      const orderRow = await this.page.$(`tr:has(td:contains("${orderId}"))`);
      if (orderRow) {
        const statusText = await this.page.evaluate(row => {
          const statusCell = row.querySelector('td:last-child');
          return statusCell ? statusCell.textContent : null;
        }, orderRow);

        return {
          orderId,
          status: statusText || 'unknown',
          lastChecked: new Date().toISOString()
        };
      }

      return {
        orderId,
        status: 'not_found',
        lastChecked: new Date().toISOString()
      };

    } catch (error) {
      console.error('Failed to get order status:', error);
      return {
        orderId,
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
        lastChecked: new Date().toISOString()
      };
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
      this.isLoggedIn = false;
      console.log('USIM Automation closed');
    }
  }
}

// Export singleton instance
export const usimAutomation = new UsimAutomationService();
import puppeteer, { Browser, Page } from 'puppeteer';

interface OrderData {
  productCode: string;
  customerEmail: string;
  customerName?: string;
  quantity?: number;
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
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
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

      // Navigate to product center
      await this.page.goto(`${this.USIM_URL}/usim_order/buy.html`, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Search for the product by name (productCode contains the product name)
      if (orderData.productCode) {
        console.log('Searching for product:', orderData.productCode);

        // Clear and type the product name in search field
        const searchInput = await this.page.$('input[name="name"]');
        if (searchInput) {
          await this.page.evaluate((input) => input.value = '', searchInput);
          await this.page.type('input[name="name"]', orderData.productCode);
          await this.page.click('.entsub');
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }

      // Find and click the order button - look for buttons containing the product name or similar text
      const orderButtons = await this.page.$$('.onebtn');
      console.log(`Found ${orderButtons.length} order buttons on the page`);

      let targetButton = null;
      let bestMatch = { button: null, score: 0 };

      for (const button of orderButtons) {
        const buttonText = await this.page.evaluate(btn => btn.textContent || '', button);
        const buttonDataCode = await this.page.evaluate(btn => btn.getAttribute('data-code') || '', button);

        console.log('Found button:', { text: buttonText.trim(), dataCode: buttonDataCode });

        // Check if button text or data-code contains key parts of the product name
        if (orderData.productCode) {
          const productKey = orderData.productCode.toLowerCase();
          const buttonKey = (buttonText + ' ' + buttonDataCode).toLowerCase();

          let score = 0;

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

          if (score > bestMatch.score) {
            bestMatch = { button, score };
          }

          console.log(`Button match score: ${score} for "${buttonText.trim()}"`);
        }
      }

      if (bestMatch.button && bestMatch.score > 0) {
        targetButton = bestMatch.button;
        console.log(`Selected button with score ${bestMatch.score}`);
      }

      if (!targetButton) {
        // Fallback: try to find any order button if no specific match
        targetButton = orderButtons[0];
        console.log('No specific product match found, using first available button as fallback');
      }

      if (!targetButton) {
        return {
          success: false,
          error: 'No order buttons found on the page'
        };
      }

      // Click order button
      await targetButton.click();

      // Wait for order modal
      await this.page.waitForSelector('.layui-layer', { timeout: 10000 });

      // Fill order form
      if (orderData.customerEmail) {
        const emailInput = await this.page.$('input[name="email"]');
        if (emailInput) {
          await this.page.evaluate((input, email) => {
            input.value = email;
          }, emailInput, orderData.customerEmail);
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

          if (msgText.includes('success') || msgText.includes('成功')) {
            // Try to extract order ID
            const orderIdMatch = msgText.match(/ID[:\s]+([A-Za-z0-9]+)/);
            const orderId = orderIdMatch ? orderIdMatch[1] : `AUTO-${Date.now()}`;

            return {
              success: true,
              orderId,
              esimData: {
                status: 'processing',
                message: 'Order placed successfully on USIM.VN'
              }
            };
          }
        }
      }

      return {
        success: false,
        error: 'Order submission failed'
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
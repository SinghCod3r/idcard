const { test, expect, chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  
  async function testUser(email, password, expectedAdminStatus, expectedAppStatus) {
    console.log(`\n--- Testing user: ${email} ---`);
    const context = await browser.newContext();
    const page = await context.newPage();
    
    await page.goto('http://localhost:3000/login');
    
    // Check if we are already logged in (shouldn't happen with new context, but just in case)
    if (page.url().includes('/login')) {
      await page.fill('input[name="email"]', email);
      await page.fill('input[name="password"]', password);
      await page.click('button[type="submit"]');
      
      // Wait for navigation
      await page.waitForURL('**/(app|admin)**', { timeout: 5000 }).catch(() => {});
    }
    
    console.log(`Logged in. Current URL: ${page.url()}`);
    
    // Check /admin access
    const adminRes = await page.goto('http://localhost:3000/admin');
    console.log(`/admin -> Status: ${adminRes.status()}, URL: ${page.url()}`);
    
    // Check /app access
    const appRes = await page.goto('http://localhost:3000/app');
    console.log(`/app -> Status: ${appRes.status()}, URL: ${page.url()}`);
    
    await context.close();
  }

  try {
    // 1. Unauthenticated test
    console.log(`\n--- Testing Unauthenticated Access ---`);
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('http://localhost:3000/admin');
    console.log(`/admin -> URL: ${page.url()}`); // should be /login
    await page.goto('http://localhost:3000/app');
    console.log(`/app -> URL: ${page.url()}`); // should be /login
    await context.close();

    // 2. Super Admin
    await testUser('superadmin@idcard.test', 'admin@123', true, true);
    
    // 3. College User (rahul)
    await testUser('rahul@idcard.test', 'admin@123', false, true);

    // 4. XYZ Admin (xyzadmin)
    await testUser('xyzadmin@idcard.test', 'admin@123', false, true);

  } catch(e) {
    console.error(e);
  } finally {
    await browser.close();
  }
})();


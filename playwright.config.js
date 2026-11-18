// Tests du site : ouvrent index.html directement, sans serveur.
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? [['list'], ['github']] : 'list',
  use: { trace: 'off' },
  projects: [
    { name: 'ordinateur', use: { ...devices['Desktop Chrome'] } },
    { name: 'iphone-chrome', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } },
    // Safari (WebKit), comme sur iPhone : roulé dans GitHub Actions
    ...(process.env.SANS_WEBKIT ? [] : [{ name: 'iphone-safari', use: { ...devices['iPhone 13'] } }]),
  ],
});

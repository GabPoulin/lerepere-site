// Tests du site : ouvrent index.html directement, sans serveur.
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? [['list'], ['github']] : 'list',
  use: { trace: 'off', baseURL: 'http://127.0.0.1:4173' },
  // Sert le site comme GitHub Pages (nécessaire pour la politique de sécurité CSP)
  webServer: { command: 'python3 -m http.server 4173 --bind 127.0.0.1', url: 'http://127.0.0.1:4173/index.html', reuseExistingServer: !process.env.CI },
  projects: [
    { name: 'ordinateur', use: { ...devices['Desktop Chrome'] } },
    { name: 'iphone-chrome', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } },
    // Safari (WebKit), comme sur iPhone : roulé dans GitHub Actions
    ...(process.env.SANS_WEBKIT ? [] : [{ name: 'iphone-safari', use: { ...devices['iPhone 13'] } }]),
  ],
});

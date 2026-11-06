import {
  MARKET,
  MARKET_SETTINGS,
  USERS,
} from '../src/data/products.js';

const { currency, locale } = MARKET_SETTINGS[MARKET];

export const CONFIG = {
  BRAND_NAME: 'WMS',
  TAGLINE: 'Inventory control for grocery stores',
  STORE_NAME: 'Fresh Basket Grocers',

  CURRENCY: currency,
  LOCALE: locale,

  DEMO_BANNER:
    'Interactive demo with sample data. Nothing you enter is saved to a server.',

  CTA_LABEL: 'Get a quote for your store',

  // Replace before publishing.
  CTA_URL: 'mailto:sales@example.com',
  CONTACT_NAME: 'Sales Team',

  STORAGE_KEY: `WMS:v5:${MARKET}`,

  AI_DELAY_MS: 900,
  EXPIRY_SOON_DAYS: 7,

  DEMO_PASSWORD: 'demo1234',

  DEMO_ACCOUNTS: USERS.slice(0, 2).map(
    ({ email, name, role }) => ({
      email,
      name,
      role,
    })
  ),
};
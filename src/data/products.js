// Switch between 'US' and 'UK'.
export const MARKET = 'US';

export const MARKET_SETTINGS = {
  US: {
    locale: 'en-US',
    currency: 'USD',
  },
  UK: {
    locale: 'en-GB',
    currency: 'GBP',
  },
};

export const { locale, currency } = MARKET_SETTINGS[MARKET];

export const CATEGORY = {
  DAIRY: 'Dairy & Eggs',
  BAKERY: 'Bakery',
  MEAT: 'Meat & Poultry',
  PRODUCE: 'Fresh Produce',
  FROZEN: 'Frozen',
  BEVERAGES: 'Beverages',
  PANTRY: 'Pantry',
};

export const CATEGORIES = Object.values(CATEGORY);

export const PERISHABLE = [
  CATEGORY.DAIRY,
  CATEGORY.BAKERY,
  CATEGORY.MEAT,
  CATEGORY.PRODUCE,
  CATEGORY.FROZEN,
];

export const UNITS = [
  'pcs',
  'kg',
  'lb',
  'box',
  'pack',
  'bag',
  'bottle',
  'carton',
  'roll',
  'loaf',
  'dozen',
  'tray',
  'cup',
  'tub',
  'bunch',
];

export const USERS = [
  {
    id: 'u1',
    name: 'Emma Wilson',
    role: 'Admin',
    email: 'emma@example.com',
  },
  {
    id: 'u2',
    name: 'James Carter',
    role: 'Staff',
    email: 'james@example.com',
  },
  {
    id: 'u3',
    name: 'Olivia Taylor',
    role: 'Staff',
    email: 'olivia@example.com',
  },
  {
    id: 'u4',
    name: 'Daniel Brooks',
    role: 'Staff',
    email: 'daniel@example.com',
  },
];

// All suppliers are fictional demo businesses.
// Order is retained for compatibility with the seed generator.
export const SUPPLIERS = [
  'Northfield Wholesale',
  'Oakwood Food Supply',
  'Metro Distribution',
  'Prime Supply House',
  'Brookside Provisions',
  'Green Valley Farms',
  'City Meat Supply',
];

// min: minimum stock threshold
// initialStock: opening stock used by the seed generator
// shelf: shelf life in days, for demo purposes
// Each market defines its own label, inventory unit, and demo price.
const PRODUCT_CATALOG = [
  // Dairy & Eggs
  {
    sku: 'DAI-0101',
    category: CATEGORY.DAIRY,
    min: 60,
    initialStock: 142,
    shelf: 7,
    US: { name: 'Whole Milk, 1 Gallon', unit: 'carton', price: 4.49 },
    UK: { name: 'Whole Milk, 2L', unit: 'bottle', price: 1.65 },
  },
  {
    sku: 'DAI-0102',
    category: CATEGORY.DAIRY,
    min: 40,
    initialStock: 88,
    shelf: 14,
    US: { name: 'Plain Yogurt, 16 oz', unit: 'tub', price: 3.29 },
    UK: { name: 'Natural Yoghurt, 500g', unit: 'tub', price: 1.85 },
  },
  {
    sku: 'DAI-0103',
    category: CATEGORY.DAIRY,
    min: 25,
    initialStock: 54,
    shelf: 90,
    US: { name: 'Salted Butter, 8 oz', unit: 'pack', price: 3.49 },
    UK: { name: 'Salted Butter, 250g', unit: 'pack', price: 2.25 },
  },
  {
    sku: 'DAI-0104',
    category: CATEGORY.DAIRY,
    min: 20,
    initialStock: 11,
    shelf: 60,
    US: { name: 'Cheddar Cheese Slices, 8 oz', unit: 'pack', price: 3.79 },
    UK: { name: 'Cheddar Cheese Slices, 200g', unit: 'pack', price: 2.45 },
  },
  {
    sku: 'DAI-0105',
    category: CATEGORY.DAIRY,
    min: 30,
    initialStock: 47,
    shelf: 21,
    US: { name: 'Large Eggs, 12 Count', unit: 'dozen', price: 3.99 },
    UK: { name: 'Large Eggs, 12 Pack', unit: 'dozen', price: 3.15 },
  },
  {
    sku: 'DAI-0106',
    category: CATEGORY.DAIRY,
    min: 15,
    initialStock: 0,
    shelf: 10,
    US: { name: 'Heavy Cream, 8 fl oz', unit: 'carton', price: 2.99 },
    UK: { name: 'Double Cream, 300ml', unit: 'carton', price: 1.65 },
  },

  // Bakery
  {
    sku: 'BKR-0201',
    category: CATEGORY.BAKERY,
    min: 50,
    initialStock: 96,
    shelf: 4,
    US: { name: 'White Sandwich Bread', unit: 'loaf', price: 2.49 },
    UK: { name: 'White Sliced Bread', unit: 'loaf', price: 1.35 },
  },
  {
    sku: 'BKR-0202',
    category: CATEGORY.BAKERY,
    min: 30,
    initialStock: 25,
    shelf: 4,
    US: { name: 'Burger Buns, 6 Count', unit: 'pack', price: 2.79 },
    UK: { name: 'Burger Buns, 6 Pack', unit: 'pack', price: 1.45 },
  },
  {
    sku: 'BKR-0203',
    category: CATEGORY.BAKERY,
    min: 20,
    initialStock: 61,
    shelf: 120,
    US: { name: 'Plain Breadcrumbs, 15 oz', unit: 'pack', price: 2.49 },
    UK: { name: 'Golden Breadcrumbs, 300g', unit: 'pack', price: 1.65 },
  },

  // Meat & Poultry
  {
    sku: 'MTP-0301',
    category: CATEGORY.MEAT,
    min: 40,
    initialStock: 112,
    shelf: 5,
    US: { name: 'Whole Chicken', unit: 'lb', price: 2.49 },
    UK: { name: 'Whole Chicken', unit: 'kg', price: 3.75 },
  },
  {
    sku: 'MTP-0302',
    category: CATEGORY.MEAT,
    min: 30,
    initialStock: 22,
    shelf: 4,
    US: { name: 'Boneless Chicken Breast', unit: 'lb', price: 4.49 },
    UK: { name: 'Chicken Breast Fillets', unit: 'kg', price: 7.25 },
  },
  {
    sku: 'MTP-0303',
    category: CATEGORY.MEAT,
    min: 25,
    initialStock: 58,
    shelf: 3,
    US: { name: 'Ground Beef', unit: 'lb', price: 5.49 },
    UK: { name: 'Beef Mince', unit: 'kg', price: 8.5 },
  },
  {
    sku: 'MTP-0304',
    category: CATEGORY.MEAT,
    min: 15,
    initialStock: 31,
    shelf: 2,
    US: { name: 'Cod Fillets', unit: 'lb', price: 9.99 },
    UK: { name: 'Cod Fillets', unit: 'kg', price: 14.5 },
  },

  // Fresh Produce
  {
    sku: 'PRD-0401',
    category: CATEGORY.PRODUCE,
    min: 40,
    initialStock: 96,
    shelf: 6,
    US: { name: 'Tomatoes', unit: 'lb', price: 1.99 },
    UK: { name: 'Tomatoes', unit: 'kg', price: 2.25 },
  },
  {
    sku: 'PRD-0402',
    category: CATEGORY.PRODUCE,
    min: 80,
    initialStock: 310,
    shelf: 30,
    US: { name: 'Yellow Onions', unit: 'lb', price: 1.29 },
    UK: { name: 'Brown Onions', unit: 'kg', price: 1.1 },
  },
  {
    sku: 'PRD-0403',
    category: CATEGORY.PRODUCE,
    min: 80,
    initialStock: 280,
    shelf: 30,
    US: { name: 'White Potatoes', unit: 'lb', price: 0.99 },
    UK: { name: 'White Potatoes', unit: 'kg', price: 0.95 },
  },
  {
    sku: 'PRD-0404',
    category: CATEGORY.PRODUCE,
    min: 30,
    initialStock: 52,
    shelf: 5,
    US: { name: 'Bananas', unit: 'lb', price: 0.69 },
    UK: { name: 'Bananas', unit: 'kg', price: 0.95 },
  },
  {
    sku: 'PRD-0405',
    category: CATEGORY.PRODUCE,
    min: 40,
    initialStock: 33,
    shelf: 3,
    US: { name: 'Fresh Spinach', unit: 'bunch', price: 1.99 },
    UK: { name: 'Fresh Spinach', unit: 'bunch', price: 1.25 },
  },
  {
    sku: 'PRD-0406',
    category: CATEGORY.PRODUCE,
    min: 30,
    initialStock: 77,
    shelf: 14,
    US: { name: 'Gala Apples', unit: 'lb', price: 1.79 },
    UK: { name: 'Gala Apples', unit: 'kg', price: 2.2 },
  },

  // Frozen
  {
    sku: 'FRZ-0501',
    category: CATEGORY.FROZEN,
    min: 25,
    initialStock: 66,
    shelf: 180,
    US: { name: 'Chicken Nuggets, 32 oz', unit: 'bag', price: 7.99 },
    UK: { name: 'Chicken Nuggets, 1kg', unit: 'bag', price: 4.75 },
  },
  {
    sku: 'FRZ-0502',
    category: CATEGORY.FROZEN,
    min: 25,
    initialStock: 49,
    shelf: 240,
    US: { name: 'French Fries, 32 oz', unit: 'bag', price: 3.99 },
    UK: { name: 'Oven Chips, 1kg', unit: 'bag', price: 2.15 },
  },
  {
    sku: 'FRZ-0503',
    category: CATEGORY.FROZEN,
    min: 30,
    initialStock: 85,
    shelf: 120,
    US: { name: 'Frozen Waffles, 10 Count', unit: 'box', price: 3.49 },
    UK: { name: 'Potato Waffles, 10 Pack', unit: 'box', price: 2.25 },
  },
  {
    sku: 'FRZ-0504',
    category: CATEGORY.FROZEN,
    min: 15,
    initialStock: 24,
    shelf: 180,
    US: { name: 'Vanilla Ice Cream, 1 Quart', unit: 'tub', price: 4.99 },
    UK: { name: 'Vanilla Ice Cream, 1L', unit: 'tub', price: 2.75 },
  },

  // Beverages
  {
    sku: 'BEV-0601',
    category: CATEGORY.BEVERAGES,
    min: 150,
    initialStock: 520,
    shelf: 365,
    US: { name: 'Spring Water, 1.5L', unit: 'bottle', price: 1.29 },
    UK: { name: 'Spring Water, 1.5L', unit: 'bottle', price: 0.75 },
  },
  {
    sku: 'BEV-0602',
    category: CATEGORY.BEVERAGES,
    min: 30,
    initialStock: 72,
    shelf: 90,
    US: { name: 'Orange Juice, 52 fl oz', unit: 'carton', price: 4.49 },
    UK: { name: 'Orange Juice, 1L', unit: 'carton', price: 1.85 },
  },
  {
    sku: 'BEV-0603',
    category: CATEGORY.BEVERAGES,
    min: 80,
    initialStock: 214,
    shelf: 180,
    US: { name: 'Cola, 2L', unit: 'bottle', price: 2.29 },
    UK: { name: 'Cola, 2L', unit: 'bottle', price: 1.75 },
  },

  // Pantry
  {
    sku: 'PNT-0701',
    category: CATEGORY.PANTRY,
    min: 40,
    initialStock: 118,
    shelf: 540,
    US: { name: 'Long Grain Rice, 5 lb', unit: 'bag', price: 5.99 },
    UK: { name: 'Long Grain Rice, 2kg', unit: 'bag', price: 2.75 },
  },
  {
    sku: 'PNT-0702',
    category: CATEGORY.PANTRY,
    min: 30,
    initialStock: 64,
    shelf: 365,
    US: { name: 'Vegetable Oil, 48 fl oz', unit: 'bottle', price: 4.49 },
    UK: { name: 'Vegetable Oil, 1L', unit: 'bottle', price: 1.95 },
  },
  {
    sku: 'PNT-0703',
    category: CATEGORY.PANTRY,
    min: 120,
    initialStock: 342,
    shelf: 540,
    US: { name: 'Granulated Sugar, 4 lb', unit: 'bag', price: 3.49 },
    UK: { name: 'Granulated Sugar, 1kg', unit: 'bag', price: 1.15 },
  },
  {
    sku: 'PNT-0704',
    category: CATEGORY.PANTRY,
    min: 25,
    initialStock: 41,
    shelf: 365,
    US: { name: 'Black Tea, 100 Bags', unit: 'box', price: 4.99 },
    UK: { name: 'Everyday Tea, 80 Bags', unit: 'box', price: 2.45 },
  },
];

export const PRODUCTS = PRODUCT_CATALOG.map(
  ({ US, UK, ...product }) => ({
    ...product,
    ...({ US, UK }[MARKET]),
  })
);

// Formats runtime amounts stored in cents/pence.
export function formatMoney(amount) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount / 100);
}
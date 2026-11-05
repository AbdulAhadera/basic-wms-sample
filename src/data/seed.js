import {
  PRODUCTS,
  CATEGORIES,
  PERISHABLE,
  USERS,
  SUPPLIERS,
} from './products';

import { mulberry32 } from '../lib/prng';
import { today, shift } from '../lib/expiry';

const RANDOM_SEED = 73019;

const IMMINENT_EXPIRY_SKUS = new Set([
  'DAI-0101',
  'DAI-0104',
  'BKR-0201',
  'BKR-0202',
  'MTP-0301',
  'MTP-0302',
  'MTP-0303',
  'MTP-0304',
  'PRD-0401',
  'PRD-0405',
]);

const DAILY_DEMAND_BY_SKU = {
  'PRD-0405': 14,
  'MTP-0302': 10,
  'BKR-0202': 11,
  'DAI-0104': 2,
};

const HISTORICAL_ADJUSTMENTS_BY_SKU = {
  'DAI-0101': { damaged: 1, countDecrease: 1 },
  'DAI-0102': { damaged: 1, countDecrease: 0 },
  'DAI-0103': { damaged: 1, countDecrease: 0 },
  'DAI-0104': { damaged: 1, countDecrease: 0 },
  'DAI-0105': { damaged: 1, countDecrease: 0 },
  'DAI-0106': { damaged: 1, countDecrease: 0 },
};

const EXPIRED_BATCHES = [
  {
    sku: 'DAI-0102',
    quantity: 6,
    daysExpired: 2,
  },
  {
    sku: 'BKR-0202',
    quantity: 3,
    daysExpired: 1,
  },
];

// Convert catalog dollars/pounds into runtime cents/pence.
function toMinorUnits(amount) {
  return Math.round(amount * 100);
}

function getBatchBreakdown(batch, quantity) {
  return [
    {
      batchId: batch.id,
      qty: quantity,
      unitCost: batch.unitCost,
    },
  ];
}

export function seed() {
  const rand = mulberry32(RANDOM_SEED);
  const currentDate = today();

  let serial = 0;
  let mid = 0;

  const batches = [];
  const movements = [];

  const products = PRODUCTS.map(
    ({ initialStock, ...product }, index) => ({
      id: `p${index + 1}`,
      ...product,
      price: toMinorUnits(product.price),
      perishable: PERISHABLE.includes(product.category),
    })
  );

  const productsBySku = new Map(
    products.map((product) => [product.sku, product])
  );

  function nextBatchId() {
    serial += 1;

    return `B-${String(serial).padStart(4, '0')}`;
  }

  function addMovement(
    product,
    type,
    quantity,
    breakdown,
    date,
    note = ''
  ) {
    const hour = String(
      9 + Math.floor(rand() * 10)
    ).padStart(2, '0');

    const movement = {
      id: `M-${String(++mid).padStart(5, '0')}`,
      datetime: `${date}T${hour}:00:00`,
      type,
      productId: product.id,
      qty: quantity,
      batchBreakdown: breakdown,
      totalCost: Math.round(
        breakdown.reduce(
          (total, item) => total + item.qty * item.unitCost,
          0
        )
      ),
      note,
      userId: USERS[Math.floor(rand() * USERS.length)].id,
      reason: type === 'COUNT' ? 'Stock count' : '',
    };

    movements.push(movement);

    return movement;
  }

  function addOpeningBatches(product, initialStock, productIndex) {
    if (!initialStock) return;

    const firstQuantity = Math.floor(initialStock / 2);

    const quantities = [
      firstQuantity,
      initialStock - firstQuantity,
    ];

    quantities.forEach((quantity, batchIndex) => {
      const expiresSoon =
        batchIndex === 0 &&
        IMMINENT_EXPIRY_SKUS.has(product.sku);

      let daysUntilExpiry = expiresSoon
        ? Math.min(6, Math.max(1, product.shelf - 1))
        : Math.max(8, product.shelf - 1);

      if (product.shelf < 8 && !expiresSoon) {
        daysUntilExpiry = product.shelf;
      }

      const expiryDate = shift(currentDate, daysUntilExpiry);
      const receivedDate = shift(expiryDate, -product.shelf);

      const batch = {
        id: nextBatchId(),
        productId: product.id,
        receivedDate,
        qtyReceived: quantity,
        remaining: quantity,
        unitCost: Math.round(
          product.price * (0.64 + batchIndex * 0.05)
        ),
        supplier: SUPPLIERS[productIndex % SUPPLIERS.length],
        reference: `PO-2026-${412 + serial}`,
        expiryDate,
      };

      batches.push(batch);

      addMovement(
        product,
        'OPENING',
        quantity,
        getBatchBreakdown(batch, quantity),
        receivedDate,
        'Opening stock'
      );
    });
  }

  function addHistoricalBatches(product, initialStock) {
    for (let daysAgo = 29; daysAgo >= 0; daysAgo -= 6) {
      const date = shift(currentDate, -daysAgo);

      const dailyDemand =
        DAILY_DEMAND_BY_SKU[product.sku] ||
        Math.max(1, initialStock / 20);

      let quantity = Math.round(dailyDemand * 6);

      const isFriday =
        new Date(`${date}T12:00:00`).getDay() === 5;

      if (isFriday) {
        quantity = Math.round(quantity * 1.3);
      }

      const adjustment =
        daysAgo === 29
          ? HISTORICAL_ADJUSTMENTS_BY_SKU[product.sku]
          : undefined;

      const extraReceived = adjustment
        ? adjustment.damaged + adjustment.countDecrease
        : 0;

      const batch = {
        id: nextBatchId(),
        productId: product.id,
        receivedDate: date,
        qtyReceived: quantity + extraReceived,
        remaining: 0,
        unitCost: Math.round(product.price * 0.66),
        supplier: SUPPLIERS[0],
        reference: `PO-2026-${serial}`,
        expiryDate: shift(date, product.shelf),
      };

      batches.push(batch);

      addMovement(
        product,
        'IN',
        batch.qtyReceived,
        getBatchBreakdown(batch, batch.qtyReceived),
        date
      );

      if (adjustment?.damaged) {
        const movement = addMovement(
          product,
          'ADJUST',
          adjustment.damaged,
          getBatchBreakdown(batch, adjustment.damaged),
          date,
          'Damaged'
        );

        movement.direction = 'Decrease';
        movement.reason = 'Damaged';
      }

      if (adjustment?.countDecrease) {
        const movement = addMovement(
          product,
          'COUNT',
          adjustment.countDecrease,
          getBatchBreakdown(batch, adjustment.countDecrease),
          date,
          'Stock count'
        );

        movement.direction = 'Decrease';
      }

      addMovement(
        product,
        'OUT',
        quantity,
        getBatchBreakdown(batch, quantity),
        date
      );
    }
  }

  function addExpiredBatch({ sku, quantity, daysExpired }) {
    const product = productsBySku.get(sku);

    const batch = {
      id: nextBatchId(),
      productId: product.id,
      remaining: quantity,
      qtyReceived: quantity,
      receivedDate: shift(
        currentDate,
        -product.shelf - daysExpired
      ),
      expiryDate: shift(currentDate, -daysExpired),
      unitCost: Math.round(product.price * 0.65),
      supplier: SUPPLIERS[2],
      reference: 'PO-2026-0400',
    };

    batches.push(batch);

    addMovement(
      product,
      'OPENING',
      quantity,
      getBatchBreakdown(batch, quantity),
      batch.receivedDate
    );
  }

  products.forEach((product, index) => {
    const { initialStock } = PRODUCTS[index];

    addOpeningBatches(product, initialStock, index);
    addHistoricalBatches(product, initialStock);
  });

  EXPIRED_BATCHES.forEach(addExpiredBatch);

  return {
    version: 3,

    products,
    batches,
    movements,
    users: USERS,

    method: 'FIFO',
    banner: true,
    tour: false,
    alertRead: false,

    dismissed: [],
    snoozed: {},
    views: [],
    columns: [],

    counts: [
      {
        id: 1,
        datetime: `${shift(currentDate, -29)}T16:00:00`,
        units: -1,
        total: -Math.round(products[0].price * 0.66),
      },
    ],

    categories: CATEGORIES,
    perishables: [...PERISHABLE],

    session: null,
    serial,
    mid,
  };
}
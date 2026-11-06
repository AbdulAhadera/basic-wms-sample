// Shared helpers for quantities and money.
//
// Money is stored everywhere as an integer number of minor units (cents/pence).
// Use toMinor() when reading what a person typed and money() (lib/format.js)
// when showing it, so the two never get mixed up.
//
// Quantities are whole numbers, except for items sold by weight (kg, lb),
// which may have up to 2 decimals.

export const DECIMAL_UNITS = ['kg', 'lb'];

export const allowsDecimal = (unit) => DECIMAL_UNITS.includes(unit);

// Round to 2 decimals so repeated additions and subtractions never drift (0.1 + 0.2).
export const r2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

export function isQty(n, decimal = false) {
  if (!Number.isFinite(n) || n <= 0) return false;
  return decimal ? Math.abs(n * 100 - Math.round(n * 100)) < 1e-6 : Number.isInteger(n);
}

export const validQty = (n, unit) => isQty(n, allowsDecimal(unit));

export const qtyMessage = (decimal = false) =>
  decimal ? 'Enter a quantity with up to 2 decimals' : 'Whole numbers only';

// Money typed by a person, such as "4.49" -> 449 minor units.
export const validMoney = (v) => {
  if (v === '' || v === null || v === undefined) return false;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 && Math.abs(n * 100 - Math.round(n * 100)) < 1e-6;
};

export const toMinor = (v) => Math.round(Number(v) * 100);

// Minor units to a plain "4.49" string (for inputs and CSV files).
export const toMajor = (n) => (n / 100).toFixed(2);

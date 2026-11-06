# WMS v3 — frontend prototype

## Delivery status

React/JSX project. `npm install`, `npm test`, `npm run test:ui` and `npm run build` all pass in a
network-enabled sandbox, and the main screens were checked in headless Chromium at 1600px.
Not yet verified: a public deployment, every page at phone width (dashboard and stock-in were loaded at 390px), camera scanning and printed
label sizes. The quote button still points at the placeholder `mailto:sales@example.com`
(`CTA_URL` in `src/config.js`); replace it before sharing the demo.

## Install, test, build and deploy

Use a network-enabled machine with Node 20.19+ or Node 22.12+ and npm.

```sh
cd WMS
npm install
npm test
npm run build
npm run preview -- --host 0.0.0.0
```

For local development:

```sh
npm run dev -- --host 0.0.0.0
```

For manual static hosting, upload the **contents of dist/** to your hosting site's public root.
For Netlify's manual deployment, upload the dist folder. This app uses HashRouter and relative
asset URLs, so routes do not require an SPA rewrite rule.

Optional command-line deployment (run after the build):

```sh
npx netlify-cli deploy --prod --dir=dist
```

The Netlify command requires your own authenticated Netlify account and site selection.
Alternatively create a Vercel project with build command `npm run build` and output `dist`.
No deployment command above was executed in the authoring sandbox.

After deployment, open the returned public HTTPS URL and verify both demo accounts, Stock In,
Stock Out, FIFO/LIFO previews, expiry exclusion, role restrictions and mobile layout. Check the
browser console for errors and warnings before sharing the sales-demo link.

## Demo accounts

| Email | Password | Role |
|---|---|---|
| emma@example.com | demo1234 | Admin |
| james@example.com | demo1234 | Staff |

Use buttons fill fields; they do not submit. Credentials are a demonstration gate, not security.
There is no server, authentication service, real AI, or server-side persistence. Scanner startup
uses the browser camera only on request. The configured quote URL is a placeholder.

## Implemented source areas

- Vite + React, JSX only; HashRouter; plain CSS; Inter; Pine and Stone variables.
- Mock login, session gate, account switching, sign-out, guarded staff controls.
- Sidebar/rail, mobile tabs, demo banner, user menu, command palette and shortcuts.
- Seeded products, batches, movement history, users, counts; localStorage with memory fallback.
- Pure FIFO/LIFO allocation, split previews, expiry exclusion and LIFO advisory.
- Stock In/Out, undo, product drawer, add/edit/delete, category creation and optional local image.
- Inventory search, filters, saved views, column toggles, sort and pagination.
- Dashboard charts, low-stock and expiry lists; alerts, dismiss/snooze and batch write-offs.
- Adjustments, stock counts, users and method settings.
- Barcode/QR preview, print CSS, PNG generation; camera/manual/simulated scanning.
- CSV export, upload/drop, mapping, row validation, preview and valid-row import.
- Deterministic sample-data chat, Roman Urdu keywords, suggestions and AI surfaces.
- First-visit skeletons, empty views, React error boundary with Retry; modal focus trapping.
- Tour, help and Advance feature modals.

## Automated verification

- `npm test` (no browser): FIFO/LIFO costing, including decimal quantities for kg/lb items; and the
  seed data loaded through Vite: counts, ledger reconciliation, money formatting, chart variety,
  reorder suggestions, expiring-stock flags, movement rules, CSV validation and sign-in.
- `npm run test:ui`: renders the real app in jsdom and clicks through the screens that previously
  had bugs (prices shown in cents, reorder 0, duplicate badges, the crashing "Reset demo data" menu).
- `npm run build`: production bundle.

## Money and quantities

- Money is stored as whole minor units (449 = $4.49) and shown with `money()` in
  `src/lib/format.js`. Anything a person types is an amount such as 4.49 and is converted with
  `toMinor()` from `src/lib/qty.js`. CSV import and export use amounts (4.49), not cents.
- Quantities are whole numbers, except items sold by `kg` or `lb`, which accept up to 2 decimals.
- The sample data is generated relative to today's date. If the saved demo data is from an earlier
  day it is regenerated automatically (the visitor stays signed in), so expiry dates never look stale.

## Known deviations and acceptance gaps

1. Build and public deployment are not verified. There is no dist folder in this archive.
2. The seed has **21** expiring batches, not the requested 8–12. The requirements conflict:
   nine nonzero-stock products have shelf lives of seven days or less; two active, valid batches
   each already require at least 18 imminent batches. This implementation preserves valid dates,
   the supplied sellable quantities and two active batches per stocked product instead of inventing
   expiry dates beyond shelf life. Cheddar is also included in the imminent list.
3. The supplied logo file was not attached. public/logo.png is a locally generated pine Package
   fallback, not the user's original brand asset. Replace that file with the supplied 512px logo.
   Component fallback to a Lucide Package icon is also present.
4. Literal supplied product names retain `1.5L` for water and cola; they were not silently renamed.
   Money is stored in whole cents and quantities are whole numbers (up to 2 decimals for kg/lb).
5. These are broad source implementations, not exhaustive polished feature parity: exact 300ms
   commit loading is not applied to every smaller edit; not every page has a separately injectable
   data-error state (there is a shared error boundary with Retry); accessibility and physical label
   dimensions need browser/device checks. Modal focus is trapped; the non-modal chat is not.
6. Alert read state is global, not individually persisted per alert. Opening Alerts marks the
   current set read, and a new movement makes the set unread. Full per-alert tracking is absent.
7. Inventory sorting is implemented for primary product fields and quantity/value; next-expiry
   and status header sorts do not yet use dedicated semantic comparators. An empty saved column
   selection is not preserved across a full reload.
8. Simulated scans cycle deterministically through products instead of choosing randomly.
   Labels cap rendered copies at 100; the entered positive integer remains visible.
9. Advance modals use shared conservative copy for most features; FEFO has dedicated copy.
10. Mock user edits do not change the two configured demo login identities; last-active dates are
    sample display values rather than real tracked activity.
11. The richer linked/table chat responses and automatic chat scroll-to-latest are not included.
12. Exact seed distribution (Friday busiest, per-category receipt cadence, 3–4 active batches for
    longer-life items) is simplified: exhausted historical receipt/dispatch pairs preserve the
    ledger, while stocked items start with two active sellable batches. Historical opening
    dates can precede the 30-day movement window where needed to honor shelf life.

## Decisions for unspecified details

- Seed reference date is the browser's local calendar day; reset regenerates the fixed-PRNG
  sample relative to that day. Past movements retain their stored dates.
- State is stored through StoreContext; seed/model operations are pure and serializable.
- The local fallback icon was generated without downloading any image.
- Stock-count increases use the latest recorded unit cost and the product shelf-life default
  for the new batch expiry. A counted quantity of zero is allowed.
- Vite and its React plugin are development dependencies; only the requested runtime libraries
  appear under dependencies. No UI kit, TypeScript or Tailwind is used.

## Files

Source follows the requested pages, store, data, lib, styles and features organization.
`src/config.js` contains brand/contact/demo values. `src/lib/format.js` contains presentation
formatters. `src/lib/costing.js` contains allocation logic. `tests/` contains the executable checks.

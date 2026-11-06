// Headless UI check: renders the real app in a simulated browser (jsdom) and clicks through
// the screens that had bugs (money shown in cents, reorder 0, duplicate badges, crashing reset menu...).
// Run with: npm run test:ui
import {JSDOM} from 'jsdom';
const dom=new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>',{url:'http://localhost/',pretendToBeVisual:true});
const w=dom.window;
for(const k of ['window','document','localStorage','navigator','HTMLElement','Element','Node','Event','MouseEvent','KeyboardEvent','getComputedStyle','requestAnimationFrame','cancelAnimationFrame','HTMLInputElement','HTMLSelectElement','HTMLTextAreaElement','SVGElement','MutationObserver','DOMParser'])
  try{Object.defineProperty(globalThis,k,{value:w[k],configurable:true,writable:true});}catch{}
globalThis.ResizeObserver=class{observe(){}unobserve(){}disconnect(){}};
w.ResizeObserver=globalThis.ResizeObserver;
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
w.HTMLCanvasElement.prototype.getContext=()=>null;
const errors=[];const origErr=console.error;console.error=(...a)=>{const m=a.map(String).join(' ');if(/width\(0\) and height\(0\)|act\(/.test(m))return;errors.push(m.slice(0,300));};

const {createServer}=await import('vite');
const server=await createServer({root:process.cwd(),server:{middlewareMode:true},appType:'custom',logLevel:'silent',ssr:{noExternal:[]}});
const L=p=>server.ssrLoadModule(p);
const React=(await import('react')).default;
const {createRoot}=await import('react-dom/client');
const {MemoryRouter,useNavigate}=await import('react-router-dom');
const {seed}=await L('/src/data/seed.js');const {CONFIG}=await L('/src/config.js');
const {StoreProvider,useStore}=await L('/src/store/StoreContext.jsx');
const App=(await L('/src/App.jsx')).default;
const {act}=React;

const s0=seed();s0.session=s0.users[0];s0.banner=false;s0.tour=true;
w.localStorage.setItem(CONFIG.STORAGE_KEY,JSON.stringify(s0));
let nav,store;
function Probe(){nav=useNavigate();store=useStore();return null;}
const root=createRoot(w.document.getElementById('root'));
await act(async()=>{root.render(React.createElement(MemoryRouter,{initialEntries:['/dashboard']},React.createElement(StoreProvider,null,React.createElement(Probe),React.createElement(App))));});
const wait=ms=>act(async()=>{await new Promise(r=>setTimeout(r,ms));});
const go=async p=>{await act(async()=>{nav(p);});await wait(450);};
const text=()=>w.document.querySelector('.content')?.textContent||'';
const page=()=>w.document.body.textContent;
const results=[];const check=(name,ok,detail='')=>{results.push(ok);console.log((ok?'PASS ':'FAIL ')+name+(ok?'':'  -> '+detail));};
const setVal=async(el,v)=>{const proto=el.tagName==='SELECT'?w.HTMLSelectElement.prototype:el.tagName==='TEXTAREA'?w.HTMLTextAreaElement.prototype:w.HTMLInputElement.prototype;await act(async()=>{Object.getOwnPropertyDescriptor(proto,'value').set.call(el,v);el.dispatchEvent(new w.Event(el.tagName==='SELECT'?'change':'input',{bubbles:true}));});};
const click=async el=>{await act(async()=>{el.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));});};

await wait(450);
// Dashboard
let t=text();
check('Dashboard shows realistic total ($5,960.15)',t.includes('$5,960.15'),t.slice(0,300));
check('Dashboard no longer shows $596,015',!t.includes('596,015'));
check('Dashboard separates expired value ("of this is expired")',/\$[\d.,]+ of this is expired/.test(t));
check('Dashboard Today movement is not 0 / 0',!t.includes('0 / 0'));
check('Dashboard low-stock list has no duplicate "Out" badge for Heavy Cream',(()=>{const row=[...w.document.querySelectorAll('.listrow')].find(r=>r.textContent.includes('Heavy Cream'));return row&&row.querySelectorAll('.badge').length===1;})());
check('Stock Out button uses solid style',!!w.document.querySelector('.button.stockout'));
check('Quote CTA is in the top bar',!!w.document.querySelector('.topbar .cta'));

// Inventory
await go('/inventory');t=text();
check('Inventory shows $4.49 (milk) and $0.69 (bananas)',t.includes('$4.49')&&t.includes('$0.69'));
check('Inventory has no $449 style prices',!/\$449\b|\$999\b/.test(t));
check('Inventory flags expiring stock',[...w.document.querySelectorAll('.badge.expiring')].length>0);
check('"Method: FIFO" appears once (top bar only)',(page().match(/Method: FIFO/g)||[]).length===1,String((page().match(/Method: FIFO/g)||[]).length));

// Stock In/Out
await go('/movement?tab=IN');t=text();
check('Stock In has unit-cost hint + placeholder',/Unit cost/.test(t)&&!!w.document.querySelector('input[placeholder="0.00"]'));
const inputs=[...w.document.querySelectorAll('.form-card input')];
const prod=inputs.find(i=>i.getAttribute('list')==='product-list');
await setVal(prod,'DAI-0101');
const qty=[...w.document.querySelectorAll('.form-card input[type=number]')][0],cost=w.document.querySelector('input[placeholder="0.00"]');
await setVal(qty,'10');await setVal(cost,'3.25');
const dates=[...w.document.querySelectorAll('.form-card input[type=date]')];
await setVal(dates[1],(()=>{const d=new Date();d.setDate(d.getDate()+9);return d.toISOString().slice(0,10);})());
check('Stock In preview shows $3.25 and $32.50',/10 × \$3\.25 = \$32\.50/.test(text()),text().match(/New batch[^.]*/)?.[0]);
const before=store.state.batches.length;
await act(async()=>{w.document.querySelector('.form-card form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));});await wait(500);
const nb=store.state.batches.at(-1);
check('Stock In stored cost as 325 cents',store.state.batches.length===before+1&&nb.unitCost===325,JSON.stringify(nb));
// Stock Out with decimals on an integer item must be rejected
await go('/movement?tab=OUT');
await setVal([...w.document.querySelectorAll('.form-card input')].find(i=>i.getAttribute('list')==='product-list'),'DAI-0101');
await setVal([...w.document.querySelectorAll('.form-card input[type=number]')][0],'1.5');
await act(async()=>{w.document.querySelector('.form-card form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));});await wait(100);
check('Stock Out rejects 1.5 cartons',/Whole numbers only/.test(text()));

// Alerts
await go('/alerts');t=text();
check('Alerts: Cheddar reorder is no longer 0',/Cheddar Cheese Slices[\s\S]*?Reorder 30/.test(t),t.slice(0,300));
const hc=[...w.document.querySelectorAll('.listrow')].find(r=>r.textContent.includes('Heavy Cream'));
check('Alerts: Heavy Cream shows one Out badge',hc&&[...hc.querySelectorAll('.badge')].filter(b=>b.textContent==='Out').length===1,hc?.textContent);
const restock=[...w.document.querySelectorAll('a.button.primary')].find(a=>a.getAttribute('href')?.includes('qty='));
check('Alerts: Restock link carries the suggested quantity',!!restock,restock?.getAttribute('href'));

// Adjustments
await go('/adjustments');
const selects=[...w.document.querySelectorAll('.form-card select')];
check('Adjustments: no pre-selected direction or reason',selects[1].value===''&&selects[2].value==='',selects.map(s=>s.value).join('|'));
const sub=async()=>{await act(async()=>{w.document.querySelector('.form-card form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));});};
await setVal(selects[0],'p1');await sub();
check('Adjustments: asks for a direction first',/Select a direction/.test(text()));

// Stock Count
await go('/count');t=text();
const varCells=[...w.document.querySelectorAll('tbody td:last-child')].map(c=>c.textContent);
check('Stock Count: variance shows — until counted',varCells.length>0&&varCells.every(v=>v==='—'),varCells.slice(0,3).join(','));
const first=w.document.querySelector('tbody input');await setVal(first,'0');
check('Stock Count: counting 0 is allowed and shows variance',/-\d+/.test(w.document.querySelector('tbody tr:first-child td:last-child').textContent));

// Import/Export
await go('/import-export');t=text();
check('Import/Export no longer says "Whole numbers only." as the rule',!/Skipped, never overwritten\. Whole numbers only\./.test(t)&&/kg and lb/.test(t));

// Labels
await go('/labels?product=p1');
check('Labels preview shows $4.49 for milk',/\$4\.49/.test(text()));

// Reset demo data menu (used to crash: setResetOpen was undefined)
await act(async()=>{});
const userBtn=w.document.querySelector('.user-area > button');await click(userBtn);
const resetBtn=[...w.document.querySelectorAll('.user-menu button')].find(b=>/Reset demo/.test(b.textContent));
await click(resetBtn);await wait(50);
check('Reset demo data opens its confirmation dialog',!!w.document.querySelector('[role=dialog]')&&/Reset all data/.test(page()));

const bad=errors.filter(e=>!/ResponsiveContainer|useLayoutEffect|The width|recharts/i.test(e));
check('No React/console errors during the whole run',bad.length===0,bad.slice(0,3).join('\n'));
console.log(`\n${results.filter(Boolean).length}/${results.length} checks passed`);
await server.close();process.exit(results.every(Boolean)?0:1);

import {expired,today,days} from '../lib/expiry';import {CONFIG} from '../config';import {r2} from '../lib/qty';
export const batchesFor=(s,id)=>s.batches.filter(b=>b.productId===id);
export const sellable=(s,id)=>r2(batchesFor(s,id).filter(b=>!expired(b)).reduce((n,b)=>n+b.remaining,0));
export const expiredQty=(s,id)=>r2(batchesFor(s,id).filter(b=>expired(b)).reduce((n,b)=>n+b.remaining,0));
// Value (in minor units) of stock that has already expired, i.e. money at risk.
export const expiredValue=s=>Math.round(s.batches.filter(b=>b.remaining>0&&expired(b)).reduce((n,b)=>n+b.remaining*b.unitCost,0));
// Units of a product that are still sellable but expire within the warning window.
export const soonQty=(s,id)=>r2(batchesFor(s,id).filter(b=>b.remaining>0&&!expired(b)&&b.expiryDate&&days(b.expiryDate)<=CONFIG.EXPIRY_SOON_DAYS).reduce((n,b)=>n+b.remaining,0));
export const value=(s,id)=>s.batches.filter(b=>!id||b.productId===id).reduce((n,b)=>n+b.remaining*b.unitCost,0);
export const status=(s,p)=>sellable(s,p.id)===0?'Out':sellable(s,p.id)<=p.min?'Low':'OK';
export const soon=(s)=>s.batches.filter(b=>b.remaining>0&&!expired(b)&&b.expiryDate&&days(b.expiryDate)<=CONFIG.EXPIRY_SOON_DAYS);
export const nextBatch=(s,id)=>batchesFor(s,id).filter(b=>b.remaining>0&&!expired(b)).sort((a,b)=>a.receivedDate.localeCompare(b.receivedDate)||a.id.localeCompare(b.id))[s.method==='LIFO'?batchesFor(s,id).filter(b=>b.remaining>0&&!expired(b)).length-1:0];
export const dailyRate=(s,id)=>s.movements.filter(m=>m.productId===id&&m.type==='OUT'&&m.datetime.slice(0,10)>=new Date(Date.now()-30*86400000).toISOString().slice(0,10)).reduce((n,m)=>n+m.qty,0)/30;
export const daysLeft=(s,id)=>{const r=dailyRate(s,id);return r?Math.floor(sellable(s,id)/r):null;};
// Suggested order quantity. Perishables are covered for 5 days, everything else for 30.
// When a product is at or below its minimum (or would not last the cover period) we
// order up to a target of twice the minimum or the cover need, whichever is higher,
// rounded up to a pack of 5. A product that is Low or Out therefore never suggests 0.
export const reorder=(s,p)=>{const have=sellable(s,p.id),cover=Math.ceil(dailyRate(s,p.id)*(p.perishable?5:30)),target=Math.max(p.min*2,cover),need=have<=p.min||have<cover?target-have:0;return need>0?Math.ceil(need/5)*5:0;};
export function stockAlerts(s){return s.products.filter(p=>status(s,p)!=='OK'&&!s.dismissed.includes(p.id)&&(!s.snoozed[p.id]||s.snoozed[p.id]<today()));}
export const unread=s=>s.alertRead?0:stockAlerts(s).length+soon(s).length+s.batches.filter(b=>b.remaining>0&&expired(b)).length;

import {expired,today,days} from '../lib/expiry';
export const batchesFor=(s,id)=>s.batches.filter(b=>b.productId===id);
export const sellable=(s,id)=>batchesFor(s,id).filter(b=>!expired(b)).reduce((n,b)=>n+b.remaining,0);
export const expiredQty=(s,id)=>batchesFor(s,id).filter(b=>expired(b)).reduce((n,b)=>n+b.remaining,0);
export const value=(s,id)=>s.batches.filter(b=>!id||b.productId===id).reduce((n,b)=>n+b.remaining*b.unitCost,0);
export const status=(s,p)=>sellable(s,p.id)===0?'Out':sellable(s,p.id)<=p.min?'Low':'OK';
export const soon=(s)=>s.batches.filter(b=>b.remaining>0&&!expired(b)&&b.expiryDate&&days(b.expiryDate)<=7);
export const nextBatch=(s,id)=>batchesFor(s,id).filter(b=>b.remaining>0&&!expired(b)).sort((a,b)=>a.receivedDate.localeCompare(b.receivedDate)||a.id.localeCompare(b.id))[s.method==='LIFO'?batchesFor(s,id).filter(b=>b.remaining>0&&!expired(b)).length-1:0];
export const dailyRate=(s,id)=>s.movements.filter(m=>m.productId===id&&m.type==='OUT'&&m.datetime.slice(0,10)>=new Date(Date.now()-30*86400000).toISOString().slice(0,10)).reduce((n,m)=>n+m.qty,0)/30;
export const daysLeft=(s,id)=>{const r=dailyRate(s,id);return r?Math.floor(sellable(s,id)/r):null;};
export const reorder=(s,p)=>Math.max(0,Math.ceil((dailyRate(s,p.id)*(p.perishable?5:30)-sellable(s,p.id))/5)*5);
export function stockAlerts(s){return s.products.filter(p=>status(s,p)!=='OK'&&!s.dismissed.includes(p.id)&&(!s.snoozed[p.id]||s.snoozed[p.id]<today()));}
export const unread=s=>s.alertRead?0:stockAlerts(s).length+soon(s).length+s.batches.filter(b=>b.remaining>0&&expired(b)).length;

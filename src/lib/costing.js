import {isQty,qtyMessage,r2} from './qty.js';
// Allocates `qty` from batches (FIFO or LIFO), skipping empty and expired batches.
// Whole numbers by default; pass allowDecimal=true for items sold by weight (kg, lb).
export function allocate(batches,qty,method='FIFO',today,allowDecimal=false){
 if(!isQty(qty,allowDecimal))throw Error(qtyMessage(allowDecimal));
 const list=batches.filter(b=>b.remaining>0&&(!b.expiryDate||b.expiryDate>=today)).sort((a,b)=>a.receivedDate.localeCompare(b.receivedDate)||a.id.localeCompare(b.id));
 if(method==='LIFO')list.reverse();
 let left=qty,totalCost=0;const allocations=[];
 for(const b of list){if(!left)break;const n=Math.min(left,b.remaining);allocations.push({batchId:b.id,qty:n,unitCost:b.unitCost,expiryDate:b.expiryDate});totalCost+=n*b.unitCost;left=r2(left-n);}
 return {allocations,totalCost:Math.round(totalCost),shortfall:left};
}
export function lifoAdvisory(batches,result,today){const used=new Set(result.allocations.map(a=>a.batchId));const first=batches.filter(b=>b.remaining>0&&b.expiryDate>=today&&!used.has(b.id)).sort((a,b)=>a.receivedDate.localeCompare(b.receivedDate))[0];const last=result.allocations[0];return first&&last&&first.receivedDate<batches.find(b=>b.id===last.batchId).receivedDate?first:null;}

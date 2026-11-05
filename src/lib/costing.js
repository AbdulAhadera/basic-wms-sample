export function allocate(batches,qty,method='FIFO',today){
 if(!Number.isInteger(qty)||qty<1)throw Error('Whole numbers only');
 const list=batches.filter(b=>b.remaining>0&&(!b.expiryDate||b.expiryDate>=today)).sort((a,b)=>a.receivedDate.localeCompare(b.receivedDate)||a.id.localeCompare(b.id));
 if(method==='LIFO')list.reverse();
 let left=qty,totalCost=0;const allocations=[];
 for(const b of list){if(!left)break;const n=Math.min(left,b.remaining);allocations.push({batchId:b.id,qty:n,unitCost:b.unitCost,expiryDate:b.expiryDate});totalCost+=n*b.unitCost;left-=n;}
 return {allocations,totalCost:Math.round(totalCost),shortfall:left};
}
export function lifoAdvisory(batches,result,today){const used=new Set(result.allocations.map(a=>a.batchId));const first=batches.filter(b=>b.remaining>0&&b.expiryDate>=today&&!used.has(b.id)).sort((a,b)=>a.receivedDate.localeCompare(b.receivedDate))[0];const last=result.allocations[0];return first&&last&&first.receivedDate<batches.find(b=>b.id===last.batchId).receivedDate?first:null;}

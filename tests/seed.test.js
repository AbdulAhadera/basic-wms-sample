// Loads the real source modules through Vite (so imports, JSX-free logic and
// import.meta.env behave exactly as in the app) and checks the demo data and rules.
import assert from 'node:assert/strict';
import {createServer} from 'vite';

const server=await createServer({server:{middlewareMode:true},appType:'custom',logLevel:'silent'});
try{
 const load=p=>server.ssrLoadModule(p);
 const {seed}=await load('/src/data/seed.js');
 const sel=await load('/src/store/selectors.js');
 const {move}=await load('/src/store/reducer.js');
 const {authenticate}=await load('/src/store/auth.js');
 const {money,compactMoney,inDays,daysAgo}=await load('/src/lib/format.js');
 const {today,shift,expired}=await load('/src/lib/expiry.js');
 const {validMoney,toMinor,toMajor,isQty}=await load('/src/lib/qty.js');
 const {validateRows}=await load('/src/lib/csv.js');

 const s=seed();
 const {status,sellable,batchesFor,soon,soonQty,reorder,value}=sel;
 const counts={products:s.products.length,categories:s.categories.length,low:s.products.filter(p=>status(s,p)==='Low').length,out:s.products.filter(p=>status(s,p)==='Out').length};
 assert.deepEqual(counts,{products:30,categories:7,low:4,out:1},'Wrong seed counts');
 assert.equal(s.seededOn,today());

 // Ledger: batch quantities always equal the movement history.
 for(const p of s.products){
  const total=batchesFor(s,p.id).reduce((n,b)=>n+b.remaining,0);
  const ledger=s.movements.filter(m=>m.productId===p.id).reduce((n,m)=>n+((m.type==='OUT'||(['ADJUST','COUNT'].includes(m.type)&&m.direction!=='Increase'))?-m.qty:m.qty),0);
  assert.equal(total,ledger,'Ledger mismatch '+p.sku);
 }
 assert.ok(s.movements.every((m,i,a)=>!i||a[i-1].datetime<=m.datetime),'Movements must be in date order');

 // Money is stored in cents and shown as dollars (the $449 milk bug).
 assert.equal(s.products[0].price,449);
 assert.equal(money(449),'$4.49');
 assert.equal(money(0),'$0.00');
 assert.equal(money(1234567),'$12,345.67');
 assert.match(money(value(s)),/^\$[3-9],\d{3}\.\d{2}$/,'Total stock value should be a few thousand dollars, not hundreds of thousands');
 assert.match(compactMoney(123456),/^\$1\.2K$/);
 assert.deepEqual([inDays(0),inDays(1),inDays(5),daysAgo(1),daysAgo(3)],['today','tomorrow','in 5 days','1 day ago','3 days ago']);
 assert.equal(validMoney('4.49'),true);assert.equal(validMoney('4.499'),false);assert.equal(validMoney(''),false);assert.equal(validMoney('0'),false);
 assert.equal(toMinor('19.99'),1999);assert.equal(toMajor(449),'4.49');

 // Dashboard chart: movement every day, uneven, with real activity today.
 const t=today(),daily={};
 for(const m of s.movements){const d=m.datetime.slice(0,10);if(d>shift(t,-30)&&d<=t){daily[d]??={IN:0,OUT:0};if(m.type==='IN'||m.type==='OUT')daily[d][m.type]+=m.qty;}}
 const outs=Object.values(daily).map(x=>x.OUT);
 assert.ok(outs.filter(Boolean).length>=25,'Stock out should happen on almost every day');
 assert.ok(new Set(outs).size>=15,'Daily stock out should vary, not repeat the same value');
 assert.ok(daily[t]?.IN>0&&daily[t]?.OUT>0,"Today's movement should not be 0 / 0");

 // Alerts: anything Low or Out must suggest a positive reorder quantity (Cheddar showed 0).
 for(const p of s.products.filter(p=>status(s,p)!=='OK'))assert.ok(reorder(s,p)>0,'No reorder for '+p.sku);
 // Inventory: a product that expires within the warning window is flagged (Cod Fillets showed OK).
 assert.ok(soonQty(s,s.products.find(p=>p.sku==='MTP-0304').id)>0);
 assert.ok(sel.expiredValue(s)>0);

 // Movements: FIFO split, no mutation, no overselling.
 const before=JSON.stringify(s);
 const out=move(s,{productId:'p1',type:'OUT',qty:100});
 assert.equal(sellable(out.state,'p1'),42);
 assert.equal(JSON.stringify(s),before,'State mutated');
 assert.equal(out.movement.batchBreakdown.length,2,'No split');
 assert.throws(()=>move(s,{productId:'p1',type:'OUT',qty:99999}));

 // Whole numbers for counted items, decimals (up to 2) for kg and lb items.
 assert.throws(()=>move(s,{productId:'p1',type:'OUT',qty:1.5}),/Whole numbers only/);
 const lb=s.products.find(p=>p.unit==='lb'||p.unit==='kg');
 assert.ok(lb,'Seed should contain an item sold by weight');
 const half=move(s,{productId:lb.id,type:'OUT',qty:1.25});
 assert.equal(sellable(half.state,lb.id),sellable(s,lb.id)-1.25);
 assert.throws(()=>move(s,{productId:lb.id,type:'OUT',qty:1.255}),/2 decimals/);
 assert.equal(isQty(0,true),false);

 // CSV import validation uses amounts and per-unit quantity rules.
 const good={name:'Rice',sku:'NEW-1',category:'Pantry',unit:'kg',min_stock:'5',price:'3.20',qty:'12.5',unit_cost:'2.10',expiry_date:''};
 const rows=validateRows([good,{...good,sku:'NEW-2',unit:'bag'},{...good,sku:'NEW-3',price:'abc'}],s.products);
 assert.equal(rows[0].error,'');
 assert.equal(rows[1].error,'Quantity must be a whole number');
 assert.match(rows[2].error,/Price/);

 // Sign-in uses the accounts the app actually offers.
 assert.equal(authenticate('EMMA@example.com','demo1234')?.role,'Admin');
 assert.equal(authenticate('james@example.com','demo1234')?.role,'Staff');
 assert.equal(authenticate('emma@example.com','wrong'),null);

 console.log(JSON.stringify({...counts,ledger:'passed',money:'passed',chart:'passed',reorder:'passed',decimals:'passed',csv:'passed',authentication:'passed'},null,2));
}finally{await server.close();}

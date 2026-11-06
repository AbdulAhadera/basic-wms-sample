import Papa from 'papaparse';import{UNITS,PERISHABLE}from'../data/products';import{allowsDecimal,validQty,validMoney}from'./qty';
export function download(name,text,type='text/csv'){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
export const exportCSV=(rows,name)=>download(name,Papa.unparse(rows));
// Import rules: price and unit_cost are amounts like 4.49; qty is a whole number,
// or up to 2 decimals for kg and lb items.
export function validateRows(rows,products){
 const seen=new Set(products.map(p=>p.sku.toLowerCase()));
 const todayIso=new Date().toLocaleDateString('en-CA');
 return rows.map((r,i)=>{
  let error='';
  const minStock=Number(r.min_stock),qty=Number(r.qty);
  if(!r.name)error='Missing name';
  else if(!r.sku)error='Missing SKU';
  else if(seen.has(r.sku.toLowerCase()))error='Duplicate SKU';
  else if(!r.category)error='Missing category';
  else if(!UNITS.includes(r.unit))error='Unknown unit';
  else if(!Number.isInteger(minStock)||minStock<1)error='Minimum stock must be a whole number';
  else if(!validMoney(r.price))error='Price must be an amount such as 4.49';
  else if(!validMoney(r.unit_cost))error='Unit cost must be an amount such as 3.25';
  else if(!validQty(qty,r.unit))error=allowsDecimal(r.unit)?'Quantity can have up to 2 decimals':'Quantity must be a whole number';
  else if(PERISHABLE.includes(r.category)&&!r.expiry_date)error='Missing expiry for a perishable category';
  else if(r.expiry_date&&(!/^\d{4}-\d{2}-\d{2}$/.test(r.expiry_date)||r.expiry_date<=todayIso))error='Expiry must be a future date (YYYY-MM-DD)';
  if(!error)seen.add(r.sku.toLowerCase());
  return{row:i+2,data:r,error};});
}

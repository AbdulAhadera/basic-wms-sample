export const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
export function shift(v,n){const d=new Date(v+'T12:00:00');d.setDate(d.getDate()+n);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
export const days=(v,t=today())=>Math.round((new Date(v+'T12:00:00')-new Date(t+'T12:00:00'))/86400000);
export const expired=(b,t=today())=>Boolean(b.expiryDate&&b.expiryDate<t);

import React,{createContext,useContext,useState,useRef} from 'react';import {CONFIG} from '../config';import {seed} from '../data/seed';import {assertState,move,clone} from './reducer';
const Context=createContext();
function read(){try{const s=JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEY));if(s?.version===3)return assertState(s);}catch{/* memory fallback */}return assertState(seed());}
export function StoreProvider({children}){const [state,setState]=useState(read),[toasts,setToasts]=useState([]),undoRef=useRef(null);
 function save(s){assertState(s);setState(s);try{localStorage.setItem(CONFIG.STORAGE_KEY,JSON.stringify(s));}catch{/* memory fallback */}}
 function toast(text,undo=false){const id=Date.now()+Math.random();setToasts(x=>[...x,{id,text,undo}]);setTimeout(()=>setToasts(x=>x.filter(t=>t.id!==id)),undo?8000:5000);}
 function patch(p){save({...state,...p});}
 function commit(payload){if(state.session?.role!=='Admin'&&!['IN','OUT'].includes(payload.type))throw Error('Admin only');const previous=clone(state),result=move(state,payload);undoRef.current={previous,movement:result.movement};save(result.state);toast(`${payload.type==='OUT'?'Stock out':payload.type==='IN'?'Stock in':'Adjustment'} recorded: ${payload.qty} x ${state.products.find(p=>p.id===payload.productId)?.name}`,undoRef.current);return result;}
 function undo(snapshot){const u=snapshot||undoRef.current;if(!u||!state.movements.some(m=>m.id===u.movement.id)){toast('This change was already undone.');return;}const m=u.movement;if(m.direction==='Increase'&&m.batchBreakdown.some(a=>{const b=state.batches.find(b=>b.id===a.batchId);return !b||b.remaining!==a.qty;})){toast('Cannot undo: stock from this batch was already dispatched.');return;}
 const s=clone(state);for(const a of m.batchBreakdown){const b=s.batches.find(b=>b.id===a.batchId);if(!b){toast('Cannot undo this change.');return;}if(m.direction==='Increase')s.batches=s.batches.filter(b=>b.id!==a.batchId);else b.remaining+=a.qty;}s.movements=s.movements.filter(x=>x.id!==m.id);save(s);undoRef.current=null;toast('Change undone');}
 function reset(){try{localStorage.removeItem(CONFIG.STORAGE_KEY);}catch{/* memory fallback */}save(seed());toast('Demo data reset');}
 return <Context.Provider value={{state,save,patch,toast,commit,undo,reset,admin:state.session?.role==='Admin'}}>{children}<div className="toasts" role="status">{toasts.map(t=><div className="toast" key={t.id}>{t.text}{t.undo&&<button onClick={()=>undo(t.undo)}>Undo</button>}</div>)}</div></Context.Provider>;
}
export const useStore=()=>useContext(Context);

import {format} from 'date-fns';
import {CONFIG} from '../config';

// Money is stored in minor units (cents/pence), so 449 is shown as $4.49.
const currency=(extra={})=>new Intl.NumberFormat(CONFIG.LOCALE,{style:'currency',currency:CONFIG.CURRENCY,minimumFractionDigits:2,maximumFractionDigits:2,...extra});
export const money=n=>currency().format(Math.round(n||0)/100);
// Short form for chart axes, e.g. $1.2K.
export const compactMoney=n=>new Intl.NumberFormat(CONFIG.LOCALE,{style:'currency',currency:CONFIG.CURRENCY,notation:'compact',maximumFractionDigits:1}).format((n||0)/100);
// Quantities: whole numbers, or up to 2 decimals for items sold by weight.
export const number=n=>new Intl.NumberFormat(CONFIG.LOCALE,{maximumFractionDigits:2}).format(n||0);
export const inDays=n=>n<=0?'today':n===1?'tomorrow':`in ${n} days`;
export const daysAgo=n=>n<=0?'today':n===1?'1 day ago':`${n} days ago`;
export const date=v=>v?format(new Date(v),'dd MMM yyyy'):'—';
export const datetime=v=>v?format(new Date(v),'dd MMM yyyy, HH:mm'):'—';

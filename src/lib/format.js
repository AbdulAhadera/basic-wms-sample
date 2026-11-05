import {format} from 'date-fns';
import {CONFIG} from '../config';
export const money=n=>new Intl.NumberFormat(CONFIG.LOCALE,{style:'currency',currency:CONFIG.CURRENCY,maximumFractionDigits:0,minimumFractionDigits:0}).format(Math.round(n||0));
export const number=n=>new Intl.NumberFormat(CONFIG.LOCALE,{maximumFractionDigits:0}).format(Math.round(n||0));
export const date=v=>v?format(new Date(v),'dd MMM yyyy'):'—';
export const datetime=v=>v?format(new Date(v),'dd MMM yyyy, HH:mm'):'—';

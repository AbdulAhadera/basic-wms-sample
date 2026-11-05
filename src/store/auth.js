import {CONFIG} from '../config';
export function authenticate(email,password){if(password!==CONFIG.DEMO_PASSWORD)return null;return CONFIG.DEMO_ACCOUNTS.find(a=>a.email===email.trim().toLowerCase())||null;}

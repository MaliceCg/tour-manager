import { format, parseISO } from 'date-fns';

export function formatDate(date: string): string {
  try {
    return format(parseISO(date), 'MMM d, yyyy');
  } catch {
    return date;
  }
}

export function formatDateLong(date: string): string {
  try {
    return format(parseISO(date), 'EEE, MMM d, yyyy');
  } catch {
    return date;
  }
}

export function formatTime(time: string): string {
  try {
    const [hours, minutes] = time.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return format(date, 'h:mm a');
  } catch {
    return time;
  }
}

// Taux de conversion EUR -> XPF (fixe)
const EUR_TO_XPF = 119.332;

export function formatPrice(price: number): string {
  const xpfPrice = Math.round(price * EUR_TO_XPF);
  
  const eurFormatted = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(price);
  
  const xpfFormatted = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XPF',
    maximumFractionDigits: 0,
  }).format(xpfPrice);
  
  return `${eurFormatted} (${xpfFormatted})`;
}

export function formatPriceXPF(price: number): string {
  const xpfPrice = Math.round(price * EUR_TO_XPF);
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XPF',
    maximumFractionDigits: 0,
  }).format(xpfPrice);
}

export function formatPriceEUR(price: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(price);
}

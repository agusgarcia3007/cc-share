import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatExpiryDate(value: string): string {
  const cleanValue = value.replace(/[^0-9]/g, "");
  if (cleanValue.length >= 2) {
    return cleanValue.substring(0, 2) + "/" + cleanValue.substring(2, 4);
  }
  return cleanValue;
}

export function formatCardNumber(value: string): string {
  const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
  const matches = v.match(/\d{4,16}/g);
  const match = (matches && matches[0]) || "";
  const parts = [];
  for (let i = 0, len = match.length; i < len; i += 4) {
    parts.push(match.substring(i, i + 4));
  }
  if (parts.length) {
    return parts.join(" ");
  } else {
    return v;
  }
}

export function getCardType(cardNumber: string): string {
  const number = cardNumber.replace(/\s+/g, "");

  if (/^4/.test(number)) {
    return "Visa";
  } else if (/^5[1-5]/.test(number) || /^2[2-7]/.test(number)) {
    return "MasterCard";
  }

  return "";
}

export const trackEvent = (event: string, data?: Record<string, unknown>) => {
  if (typeof window === "undefined") {
    console.warn("Umami: trackEvent called on server side");
    return;
  }

  if (!window.umami) {
    console.warn("Umami: tracker not loaded yet");
    return;
  }

  try {
    window.umami.track(event, data);
    console.log(`Umami: tracked event "${event}"`, data);
  } catch (error) {
    console.error("Umami: error tracking event", error);
  }
};

declare global {
  interface UmamiTracker {
    (event: string, data?: Record<string, unknown>): void;
    track(event: string, data?: Record<string, unknown>): void;
  }

  interface Window {
    umami?: UmamiTracker;
  }

  const umami: UmamiTracker;
}

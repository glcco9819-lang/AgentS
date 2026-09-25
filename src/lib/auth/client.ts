"use client";
const TOKEN_KEY = "yfg_token";
export function getToken(): string | null { if (typeof window === "undefined") return null; return localStorage.getItem(TOKEN_KEY); }
export function setToken(token: string): void { if (typeof window === "undefined") return; localStorage.setItem(TOKEN_KEY, token); document.cookie = `yfg_token=${token}; Path=/; Max-Age=604800; SameSite=Strict`; }
export function clearToken(): void { if (typeof window === "undefined") return; localStorage.removeItem(TOKEN_KEY); document.cookie = "yfg_token=; Path=/; Max-Age=0; SameSite=Strict"; }
export function authHeaders(): Record<string, string> { const token = getToken(); return token ? { Authorization: `Bearer ${token}` } : {}; }

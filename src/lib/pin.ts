import bcrypt from "bcryptjs";

export const PIN_COOKIE_NAME = "tm_pin_ok";

/** Hashea un PIN para guardarlo en la base de datos. Solo se usa en Server Actions. */
export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 10);
}

/** Compara un PIN en texto plano contra su hash almacenado. */
export async function verifyPinHash(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}

function getSecret(): string {
  const secret = process.env.PIN_COOKIE_SECRET;
  if (!secret) {
    throw new Error("Falta la variable de entorno PIN_COOKIE_SECRET");
  }
  return secret;
}

async function hmac(message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Buffer.from(signature).toString("hex");
}

/**
 * Valor de cookie que certifica que el PIN fue verificado para la sesion activa.
 * Se deriva del access_token de Supabase, asi que cambia cada vez que cambia la sesion
 * (login/logout) obligando a re-validar el PIN.
 */
export async function computePinCookieValue(accessToken: string): Promise<string> {
  return hmac(accessToken);
}

export async function isPinCookieValid(accessToken: string, cookieValue: string | undefined): Promise<boolean> {
  if (!cookieValue) return false;
  const expected = await computePinCookieValue(accessToken);
  return expected === cookieValue;
}

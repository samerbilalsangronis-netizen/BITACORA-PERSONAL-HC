import { cookies } from "next/headers";

export const TZ_COOKIE_NAME = "tm-tz";

function formatInTZ(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/**
 * "Hoy" tal como lo vive el usuario, no el servidor. Sin la cookie de zona
 * horaria (primera visita, antes de que el script del cliente la escriba)
 * cae a UTC, que puede diferir del día real del usuario por unas horas.
 */
export async function todayISOForUser(): Promise<string> {
  const cookieStore = await cookies();
  const tz = cookieStore.get(TZ_COOKIE_NAME)?.value;

  try {
    return formatInTZ(new Date(), tz || "UTC");
  } catch {
    // Zona horaria inválida en la cookie (corrupta o manipulada).
    return formatInTZ(new Date(), "UTC");
  }
}

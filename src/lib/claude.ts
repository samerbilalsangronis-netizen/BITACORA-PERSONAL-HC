import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

/** Cliente de Anthropic, solo para usarse desde server actions. */
export function getClaudeClient(): Anthropic {
  if (!client) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("Falta la variable de entorno ANTHROPIC_API_KEY.");
    }
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

export function claudeErrorMessage(error: unknown): string {
  if (error instanceof Anthropic.AuthenticationError) {
    return "La API key de Claude no es válida. Revisa ANTHROPIC_API_KEY en Vercel.";
  }
  if (error instanceof Anthropic.RateLimitError) {
    return "Se alcanzó el límite de uso de la API de Claude. Intenta de nuevo en un momento.";
  }
  if (error instanceof Anthropic.BadRequestError) {
    return `Solicitud inválida a Claude: ${error.message}`;
  }
  if (error instanceof Anthropic.APIError) {
    return `Error de la API de Claude${error.status ? ` (${error.status})` : ""}: ${error.message}`;
  }
  if (error instanceof Error) return error.message;
  return "No se pudo contactar a Claude.";
}

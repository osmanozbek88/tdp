





import { AppError } from "@/lib/errors";

/**
 * Base error for all provider-related issues.
 * Wraps native provider errors into a standard shape
 * that the rest of the application can handle uniformly.
 */
export class ProviderError extends AppError {
  public readonly provider: string;
  public readonly providerCode: string | null;

  constructor(
    provider: string,
    statusCode: number,
    code: string,
    message: string,
    providerCode?: string | null,
  ) {
    super(statusCode, code, `[${provider}] ${message}`);
    this.name = "ProviderError";
    this.provider = provider;
    this.providerCode = providerCode ?? null;
  }
}

export class ProviderConnectionError extends ProviderError {
  constructor(provider: string, cause?: string) {
    super(
      provider,
      502,
      "PROVIDER_CONNECTION_ERROR",
      cause ?? "Provider ile bağlantı kurulamadı",
      "CONNECTION_FAILED",
    );
    this.name = "ProviderConnectionError";
  }
}

export class ProviderTimeoutError extends ProviderError {
  constructor(provider: string) {
    super(
      provider,
      504,
      "PROVIDER_TIMEOUT",
      "Provider yanıt vermedi (timeout)",
      "TIMEOUT",
    );
    this.name = "ProviderTimeoutError";
  }
}

export class ProviderValidationError extends ProviderError {
  constructor(provider: string, message: string, details?: Record<string, string[]>) {
    super(
      provider,
      422,
      "PROVIDER_VALIDATION_ERROR",
      message,
      "VALIDATION_FAILED",
    );
    this.name = "ProviderValidationError";
    if (details) this.details = details;
  }
}

export class ProviderProductNotFoundError extends ProviderError {
  constructor(provider: string, productId: string) {
    super(
      provider,
      404,
      "PROVIDER_PRODUCT_NOT_FOUND",
      `Ürün bulunamadı: ${productId}`,
      "PRODUCT_NOT_FOUND",
    );
    this.name = "ProviderProductNotFoundError";
  }
}

export class ProviderOrderNotFoundError extends ProviderError {
  constructor(provider: string, orderId: string) {
    super(
      provider,
      404,
      "PROVIDER_ORDER_NOT_FOUND",
      `Sipariş bulunamadı: ${orderId}`,
      "ORDER_NOT_FOUND",
    );
    this.name = "ProviderOrderNotFoundError";
  }
}

export class ProviderEsimNotFoundError extends ProviderError {
  constructor(provider: string, iccid: string) {
    super(
      provider,
      404,
      "PROVIDER_ESIM_NOT_FOUND",
      `eSIM bulunamadı: ${iccid}`,
      "ESIM_NOT_FOUND",
    );
    this.name = "ProviderEsimNotFoundError";
  }
}

export class ProviderWebhookError extends ProviderError {
  constructor(provider: string, eventType: string, cause?: string) {
    super(
      provider,
      400,
      "PROVIDER_WEBHOOK_ERROR",
      cause ?? `Webhook işlenemedi: ${eventType}`,
      "WEBHOOK_FAILED",
    );
    this.name = "ProviderWebhookError";
  }
}






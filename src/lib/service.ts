import { getLogger, type Logger } from "@/lib/logger";

/**
 * Base service class that all domain services extend.
 * Provides logging and common service utilities.
 */
export abstract class BaseService {
  protected logger: Logger;

  constructor(protected serviceName: string) {
    this.logger = getLogger().child({ service: serviceName });
  }
}

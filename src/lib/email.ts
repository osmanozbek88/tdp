

import { getLogger } from "@/lib/logger";
import fs from "fs";
import path from "path";

const logger = getLogger().child({ service: "FakeEmail" });

interface EmailMessage {
  to: string;
  subject: string;
  body: string;
  sentAt: string;
}

/**
 * Fake email service for development/demo.
 * Logs emails to console and appends to local file.
 */
class FakeEmailService {
  private outputPath: string;

  constructor(outputPath?: string) {
    this.outputPath =
      outputPath ?? path.join(process.cwd(), "tmp", "emails.json");
  }

  async send(to: string, subject: string, body: string): Promise<void> {
    const message: EmailMessage = {
      to,
      subject,
      body,
      sentAt: new Date().toISOString(),
    };

    logger.info(
      { to, subject },
      `📧 [FAKE EMAIL] → ${to}\nSubject: ${subject}\nBody: ${body}`,
    );

    await this.persist(message);
  }

  private async persist(message: EmailMessage): Promise<void> {
    try {
      const dir = path.dirname(this.outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const existing: EmailMessage[] = [];
      if (fs.existsSync(this.outputPath)) {
        try {
          const raw = fs.readFileSync(this.outputPath, "utf-8");
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            existing.push(...parsed);
          }
        } catch {
          // file corrupt, start fresh
        }
      }

      existing.push(message);

      // Keep last 500 emails only
      const trimmed = existing.slice(-500);
      fs.writeFileSync(this.outputPath, JSON.stringify(trimmed, null, 2));
    } catch (err) {
      logger.error({ err }, "Failed to persist email");
    }
  }
}

export const emailService = new FakeEmailService();


import { BaseService } from "@/lib/service";
import { AuthRepository } from "./auth.repository";

export class AuthService extends BaseService {
  private repository: AuthRepository;

  constructor() {
    super("AuthService");
    this.repository = new AuthRepository();
  }

  async login(email: string, password: string) {
    this.logger.info({ email }, "Login attempt");
    void password;
    // TODO: Implement in FAZ 3
    throw new Error("Not implemented");
  }

  async register(data: { email: string; password: string; firstName: string; lastName: string }) {
    this.logger.info({ email: data.email }, "Register attempt");
    // TODO: Implement in FAZ 3
    throw new Error("Not implemented");
  }
}

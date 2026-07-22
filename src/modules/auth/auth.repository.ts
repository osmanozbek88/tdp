import { BaseRepository } from "@/lib/repository";

export interface AuthUserRecord {
  id: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  role: string;
  tenant_id: string;
  distributor_id: string;
  is_active: boolean;
}

type CreateAuthUserInput = Omit<AuthUserRecord, "id">;
type UpdateAuthInput = Partial<CreateAuthUserInput>;

export class AuthRepository extends BaseRepository<
  AuthUserRecord,
  CreateAuthUserInput,
  UpdateAuthInput
> {
  constructor() {
    super("user");
  }

  async findByEmail(email: string): Promise<AuthUserRecord | null> {
    return this.findMany({ where: { email } }).then(
      (users) => users[0] ?? null,
    );
  }
}

import { BaseService } from "@/lib/service";
import { ProductRepository } from "./repository";
import { getActiveProvider } from "@/lib/provider";
import type { ProductQuery, UpdateProductInput, ProductSyncResult } from "./types";
import type { ProviderPlan } from "@/lib/provider";

export class ProductService extends BaseService {
  private repo = new ProductRepository();

  constructor() {
    super("ProductService");
  }

  async list(query: ProductQuery) {
    return this.repo.findManyByTenant(query);
  }

  async getById(id: string) {
    return this.repo.findByIdOrThrow(id);
  }

  async update(id: string, input: UpdateProductInput) {
    const data: Record<string, unknown> = {};
    if (input.dealerPrice !== undefined) data.dealerPrice = input.dealerPrice;
    if (input.profitMargin !== undefined) data.profitMargin = input.profitMargin;
    if (input.isActive !== undefined) data.isActive = input.isActive;

    return (this.repo.delegate() as any).update({
      where: { id },
      data,
    });
  }

  async toggleStatus(id: string) {
    const entity = await this.repo.findByIdOrThrow(id);
    return (this.repo.delegate() as any).update({
      where: { id },
      data: { isActive: !(entity as any).isActive },
    });
  }

  /** Provider'dan ürünleri çekip yerel kataloğa senkronize eder */
  async syncFromProvider(tenantId: string): Promise<ProductSyncResult> {
    const result: ProductSyncResult = { created: 0, updated: 0, total: 0, errors: [] };

    try {
      const provider = await getActiveProvider();
      const plans: ProviderPlan[] = await provider.getProducts();
      this.logger.info({ planCount: plans.length }, "Provider'dan planlar çekildi");

      // Ülke isimlerini çözümle
      const countries = await provider.getCountries();
      const countryMap = new Map(countries.map((c: { code: string; name: string }) => [c.code, c.name]));

      for (const plan of plans) {
        try {
          const firstCountry = plan.countryCoverage?.[0] ?? "GLOBAL";
          const countryName = countryMap.get(firstCountry) ?? firstCountry;

          const productData = {
            tenant: { connect: { id: tenantId } },
            telnaProductId: plan.planId,
            name: plan.name,
            description: plan.apn ? `APN: ${plan.apn}${plan.throttling ? ` (${plan.throttling})` : ""}` : null,
            type: plan.planType === "data_only" ? "ESIM" : "TOPUP",
            country: countryName,
            region: plan.countryCoverage?.join(", ") ?? null,
            currency: plan.currency,
            price: plan.retailPrice,
            costPrice: plan.wholesalePrice,
            dataGB: plan.dataLimitMB ? plan.dataLimitMB / 1024 : null,
            durationDays: plan.validityDays,
            specifications: {
              planType: plan.planType,
              dataLimitMB: plan.dataLimitMB,
              apn: plan.apn,
              throttling: plan.throttling,
              tethering: plan.tethering,
              countryCoverage: plan.countryCoverage,
            },
          };

          const { created } = await this.repo.upsertByTelnaId(
            tenantId,
            plan.planId,
            productData as any,
          );

          if (created) {
            result.created++;
          } else {
            result.updated++;
          }
          result.total++;
        } catch (err: any) {
          this.logger.error({ planId: plan.planId, error: err.message }, "Plan senkronizasyon hatası");
          result.errors.push(`${plan.planId}: ${err.message}`);
        }
      }

      this.logger.info(result, "Senkronizasyon tamamlandı");
    } catch (err: any) {
      this.logger.error({ error: err.message }, "Provider bağlantı hatası");
      throw err;
    }

    return result;
  }

  /** Filtreleme için ülke listesi */
  async getCountries(tenantId: string) {
    return this.repo.getDistinctCountries(tenantId);
  }
}

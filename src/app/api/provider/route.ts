
import { NextResponse } from "next/server";
import { getActiveProvider } from "@/lib/provider";

/**
 * GET /api/provider — provider durum kontrolü
 *
 * Döndürür:
 *   - Provider tipi (fake / telna)
 *   - Plan ve ülke sayısı
 *   - Örnek plan listesi (ilk 5)
 */
export async function GET(): Promise<NextResponse> {
  try {
    const provider = await getActiveProvider();
    const [plans, countries] = await Promise.all([
      provider.getProducts(),
      provider.getCountries(),
    ]);

    return NextResponse.json({
      success: true,
      provider: provider.name,
      plansCount: plans.length,
      countriesCount: countries.length,
      countries: countries.map((c) => ({ code: c.code, name: c.name })),
      plans: plans.slice(0, 5).map((p) => ({
        planId: p.planId,
        name: p.name,
        countryCoverage: p.countryCoverage,
        retailPrice: p.retailPrice,
        currency: p.currency,
        dataLimitMB: p.dataLimitMB,
        validityDays: p.validityDays,
        planType: p.planType,
      })),
      _note: plans.length > 5 ? `${plans.length - 5} plan daha var (ilk 5 gösteriliyor)` : undefined,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Beklenmeyen hata",
      },
      { status: 500 },
    );
  }
}

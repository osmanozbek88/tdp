
import { NextResponse } from "next/server";
import { getActiveProvider } from "@/lib/provider";

/**
 * GET /api/provider — provider durum kontrolü
 *
 * Döndürür:
 *   - Provider tipi (fake / telna)
 *   - Bağlantı durumu (connectivity check)
 *   - Ürün sayısı, ülke sayısı
 */
export async function GET(): Promise<NextResponse> {
  try {
    const provider = await getActiveProvider();
    const [products, countries] = await Promise.all([
      provider.fetchProducts(),
      provider.fetchCountries(),
    ]);

    return NextResponse.json({
      success: true,
      provider: provider.name,
      productsCount: products.length,
      countriesCount: countries.length,
      countries: countries.map((c) => ({ code: c.code, name: c.name })),
      products: products.slice(0, 5).map((p) => ({
        id: p.id,
        name: p.name,
        country: p.country,
        price: p.price,
        currency: p.currency,
      })),
      _note: products.length > 5 ? `${products.length - 5} ürün daha var (ilk 5 gösteriliyor)` : undefined,
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

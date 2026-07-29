import { NextRequest } from "next/server";
import { productController } from "@/modules/product/controller";
import { withPermission } from "@/lib/auth/with-permission";

export const GET = withPermission("Products.View", async (req: NextRequest) => {
  return productController.countries(req);
});

export const runtime = "nodejs";

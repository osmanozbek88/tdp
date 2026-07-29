import { NextRequest } from "next/server";
import { productController } from "@/modules/product/controller";
import { withPermission } from "@/lib/auth/with-permission";

export const POST = withPermission("Products.Create", async (req: NextRequest) => {
  return productController.sync(req);
});

export const runtime = "nodejs";

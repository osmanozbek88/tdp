import { NextRequest } from "next/server";
import { productController } from "@/modules/product/controller";
import { withPermission } from "@/lib/auth/with-permission";

export const POST = withPermission("Products.Edit", async (req: NextRequest, { params }: { params: { id: string } }) => {
  return productController.toggleStatus(req, { params });
});

export const runtime = "nodejs";

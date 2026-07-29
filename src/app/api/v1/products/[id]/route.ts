import { NextRequest } from "next/server";
import { productController } from "@/modules/product/controller";
import { withPermission } from "@/lib/auth/with-permission";

export const GET = withPermission("Products.View", async (req: NextRequest, { params }: { params: { id: string } }) => {
  return productController.getById(req, { params });
});

export const PATCH = withPermission("Products.Edit", async (req: NextRequest, { params }: { params: { id: string } }) => {
  return productController.update(req, { params });
});

export const runtime = "nodejs";

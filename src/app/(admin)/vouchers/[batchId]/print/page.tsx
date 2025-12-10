import { requireTenantId } from "@/lib/session";
import { voucherService } from "@/services/voucher.service";
import { notFound } from "next/navigation";
import { PrintableCards } from "./printable-cards";
import { prisma } from "@/lib/prisma";
import { serialize } from "@/lib/types";

export const metadata = {
  title: "Print Voucher Cards",
};

export default async function PrintVouchersPage({
  params,
}: {
  params: Promise<{ batchId: string }>;
}) {
  const { batchId } = await params;
  const tenantId = await requireTenantId();

  const data = await voucherService.getVouchersForPrint(tenantId, batchId);
  if (!data) notFound();

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { name: true, slug: true },
  });

  return (
    <PrintableCards
      batch={serialize(data.batch)}
      vouchers={serialize(data.vouchers)}
      tenantName={tenant?.name || "CloudRadius"}
    />
  );
}

import { requireTenantUser } from "@/lib/session";
import { reportService } from "@/services/report.service";
import { VoucherReportClient } from "./voucher-report";

export const metadata = { title: "Voucher Report" };

export default async function VoucherReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const user = await requireTenantUser();
  if (!user.tenantId) throw new Error("No tenant");
  const params = await searchParams;

  const report = await reportService.voucherReport({
    tenantId: user.tenantId,
    status: params.status === "all" ? undefined : params.status,
    page: params.page ? parseInt(params.page) : 1,
  });

  return <VoucherReportClient report={JSON.parse(JSON.stringify(report))} />;
}

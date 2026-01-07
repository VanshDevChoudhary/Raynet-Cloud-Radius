import { requireTenantUser } from "@/lib/session";
import { reportService } from "@/services/report.service";
import { ExpiryReportClient } from "./expiry-report";

export const metadata = { title: "Expiry Report" };

export default async function ExpiryReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const user = await requireTenantUser();
  if (!user.tenantId) throw new Error("No tenant");
  const params = await searchParams;

  const report = await reportService.expiryReport({
    tenantId: user.tenantId,
    daysAhead: params.daysAhead ? parseInt(params.daysAhead) : 30,
    page: params.page ? parseInt(params.page) : 1,
  });

  return <ExpiryReportClient report={JSON.parse(JSON.stringify(report))} />;
}

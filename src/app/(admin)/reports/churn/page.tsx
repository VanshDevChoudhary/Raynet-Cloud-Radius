import { requireTenantUser } from "@/lib/session";
import { reportService } from "@/services/report.service";
import { ChurnReportClient } from "./churn-report";

export const metadata = { title: "Churn Report" };

export default async function ChurnReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const user = await requireTenantUser();
  if (!user.tenantId) throw new Error("No tenant");
  const params = await searchParams;

  const report = await reportService.churnReport({
    tenantId: user.tenantId,
    startDate: params.startDate ? new Date(params.startDate) : undefined,
    endDate: params.endDate ? new Date(params.endDate) : undefined,
    page: params.page ? parseInt(params.page) : 1,
  });

  return <ChurnReportClient report={JSON.parse(JSON.stringify(report))} />;
}

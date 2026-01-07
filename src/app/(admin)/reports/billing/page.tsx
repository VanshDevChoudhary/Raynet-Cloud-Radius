import { requireTenantUser } from "@/lib/session";
import { reportService } from "@/services/report.service";
import { BillingReportClient } from "./billing-report";

export const metadata = { title: "Billing Report" };

export default async function BillingReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const user = await requireTenantUser();
  if (!user.tenantId) throw new Error("No tenant");
  const params = await searchParams;

  const report = await reportService.billingReport({
    tenantId: user.tenantId,
    status: params.status === "all" ? undefined : params.status,
    startDate: params.startDate ? new Date(params.startDate) : undefined,
    endDate: params.endDate ? new Date(params.endDate) : undefined,
    page: params.page ? parseInt(params.page) : 1,
  });

  return <BillingReportClient report={JSON.parse(JSON.stringify(report))} />;
}

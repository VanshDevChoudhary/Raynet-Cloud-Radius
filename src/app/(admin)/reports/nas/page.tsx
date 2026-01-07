import { requireTenantUser } from "@/lib/session";
import { reportService } from "@/services/report.service";
import { NasReportClient } from "./nas-report";

export const metadata = { title: "NAS Report" };

export default async function NasReportPage() {
  const user = await requireTenantUser();
  if (!user.tenantId) throw new Error("No tenant");

  const report = await reportService.nasReport({ tenantId: user.tenantId });

  return <NasReportClient report={JSON.parse(JSON.stringify(report))} />;
}

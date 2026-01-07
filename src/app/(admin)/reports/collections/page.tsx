import { requireTenantUser } from "@/lib/session";
import { reportService } from "@/services/report.service";
import { CollectionReportClient } from "./collection-report";

export const metadata = { title: "Collection Report" };

export default async function CollectionReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const user = await requireTenantUser();
  if (!user.tenantId) throw new Error("No tenant");
  const params = await searchParams;

  const report = await reportService.collectionReport({
    tenantId: user.tenantId,
    method: params.method === "all" ? undefined : params.method,
    status: params.status === "all" ? undefined : params.status,
    startDate: params.startDate ? new Date(params.startDate) : undefined,
    endDate: params.endDate ? new Date(params.endDate) : undefined,
    page: params.page ? parseInt(params.page) : 1,
  });

  return <CollectionReportClient report={JSON.parse(JSON.stringify(report))} />;
}

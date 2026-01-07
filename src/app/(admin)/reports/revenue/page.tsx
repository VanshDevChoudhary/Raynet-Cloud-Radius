import { requireTenantUser } from "@/lib/session";
import { reportService } from "@/services/report.service";
import { prisma } from "@/lib/prisma";
import { RevenueReportClient } from "./revenue-report";

export const metadata = { title: "Revenue Report" };

export default async function RevenueReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const user = await requireTenantUser();
  if (!user.tenantId) throw new Error("No tenant");
  const params = await searchParams;

  const [report, plans] = await Promise.all([
    reportService.revenueReport({
      tenantId: user.tenantId,
      planId: params.planId === "all" ? undefined : params.planId,
      startDate: params.startDate ? new Date(params.startDate) : undefined,
      endDate: params.endDate ? new Date(params.endDate) : undefined,
      page: params.page ? parseInt(params.page) : 1,
    }),
    prisma.plan.findMany({
      where: { tenantId: user.tenantId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <RevenueReportClient
      report={JSON.parse(JSON.stringify(report))}
      planOptions={plans.map((p) => ({ label: p.name, value: p.id }))}
    />
  );
}

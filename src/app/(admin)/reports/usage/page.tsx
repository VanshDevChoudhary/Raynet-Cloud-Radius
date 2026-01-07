import { requireTenantUser } from "@/lib/session";
import { reportService } from "@/services/report.service";
import { prisma } from "@/lib/prisma";
import { UsageReportClient } from "./usage-report";

export const metadata = { title: "Usage Report" };

export default async function UsageReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const user = await requireTenantUser();
  if (!user.tenantId || !user.tenantSlug) throw new Error("No tenant");
  const params = await searchParams;

  const [report, plans] = await Promise.all([
    reportService.usageReport({
      tenantId: user.tenantId,
      tenantSlug: user.tenantSlug,
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
    <UsageReportClient
      report={JSON.parse(JSON.stringify(report))}
      planOptions={plans.map((p) => ({ label: p.name, value: p.id }))}
    />
  );
}

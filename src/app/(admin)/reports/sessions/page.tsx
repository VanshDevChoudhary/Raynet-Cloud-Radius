import { requireTenantUser } from "@/lib/session";
import { reportService } from "@/services/report.service";
import { prisma } from "@/lib/prisma";
import { SessionReportClient } from "./session-report";

export const metadata = { title: "Session Report" };

export default async function SessionReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const user = await requireTenantUser();
  if (!user.tenantId || !user.tenantSlug) throw new Error("No tenant");
  const params = await searchParams;

  const [report, nasDevices] = await Promise.all([
    reportService.sessionReport({
      tenantId: user.tenantId,
      tenantSlug: user.tenantSlug,
      nasDeviceId: params.nasDeviceId === "all" ? undefined : params.nasDeviceId,
      startDate: params.startDate ? new Date(params.startDate) : undefined,
      endDate: params.endDate ? new Date(params.endDate) : undefined,
      page: params.page ? parseInt(params.page) : 1,
    }),
    prisma.nasDevice.findMany({
      where: { tenantId: user.tenantId },
      select: { id: true, name: true, nasIp: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <SessionReportClient
      report={JSON.parse(JSON.stringify(report))}
      nasOptions={nasDevices.map((n) => ({ label: `${n.name} (${n.nasIp})`, value: n.id }))}
    />
  );
}

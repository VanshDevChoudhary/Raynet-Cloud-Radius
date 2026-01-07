import { requireTenantUser } from "@/lib/session";
import { reportService } from "@/services/report.service";
import { prisma } from "@/lib/prisma";
import { SubscriberReportClient } from "./subscriber-report";

export const metadata = { title: "Subscriber Report" };

export default async function SubscriberReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const user = await requireTenantUser();
  if (!user.tenantId) throw new Error("No tenant");

  const params = await searchParams;

  const [report, plans, locations, nasDevices] = await Promise.all([
    reportService.subscriberReport({
      tenantId: user.tenantId,
      status: params.status === "all" ? undefined : params.status,
      planId: params.planId === "all" ? undefined : params.planId,
      locationId: params.locationId === "all" ? undefined : params.locationId,
      nasDeviceId: params.nasDeviceId === "all" ? undefined : params.nasDeviceId,
      startDate: params.startDate ? new Date(params.startDate) : undefined,
      endDate: params.endDate ? new Date(params.endDate) : undefined,
      page: params.page ? parseInt(params.page) : 1,
    }),
    prisma.plan.findMany({
      where: { tenantId: user.tenantId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.location.findMany({
      where: { tenantId: user.tenantId },
      select: { id: true, name: true, type: true },
      orderBy: { name: "asc" },
    }),
    prisma.nasDevice.findMany({
      where: { tenantId: user.tenantId },
      select: { id: true, name: true, nasIp: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <SubscriberReportClient
      report={JSON.parse(JSON.stringify(report))}
      planOptions={plans.map((p) => ({ label: p.name, value: p.id }))}
      locationOptions={locations.map((l) => ({ label: `${l.name} (${l.type})`, value: l.id }))}
      nasOptions={nasDevices.map((n) => ({ label: `${n.name} (${n.nasIp})`, value: n.id }))}
    />
  );
}

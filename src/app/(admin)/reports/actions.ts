"use server";

import { requireAuthorized } from "@/lib/session";
import { reportService } from "@/services/report.service";
import { prisma } from "@/lib/prisma";

export async function getFilterOptions() {
  const { tenantId } = await requireAuthorized("reports", "view");

  const [plans, locations, nasDevices] = await Promise.all([
    prisma.plan.findMany({
      where: { tenantId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.location.findMany({
      where: { tenantId },
      select: { id: true, name: true, type: true },
      orderBy: { name: "asc" },
    }),
    prisma.nasDevice.findMany({
      where: { tenantId },
      select: { id: true, name: true, nasIp: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return {
    plans: plans.map((p) => ({ label: p.name, value: p.id })),
    locations: locations.map((l) => ({ label: `${l.name} (${l.type})`, value: l.id })),
    nasDevices: nasDevices.map((n) => ({ label: `${n.name} (${n.nasIp})`, value: n.id })),
  };
}

export async function fetchSubscriberReport(params: Record<string, string>) {
  const { tenantId } = await requireAuthorized("reports", "view");

  return reportService.subscriberReport({
    tenantId,
    status: params.status === "all" ? undefined : params.status,
    planId: params.planId === "all" ? undefined : params.planId,
    locationId: params.locationId === "all" ? undefined : params.locationId,
    nasDeviceId: params.nasDeviceId === "all" ? undefined : params.nasDeviceId,
    startDate: params.startDate ? new Date(params.startDate) : undefined,
    endDate: params.endDate ? new Date(params.endDate) : undefined,
    page: params.page ? parseInt(params.page) : 1,
  });
}

export async function fetchBillingReport(params: Record<string, string>) {
  const { tenantId } = await requireAuthorized("reports", "view");

  return reportService.billingReport({
    tenantId,
    status: params.status === "all" ? undefined : params.status,
    startDate: params.startDate ? new Date(params.startDate) : undefined,
    endDate: params.endDate ? new Date(params.endDate) : undefined,
    page: params.page ? parseInt(params.page) : 1,
  });
}

export async function fetchCollectionReport(params: Record<string, string>) {
  const { tenantId } = await requireAuthorized("reports", "view");

  return reportService.collectionReport({
    tenantId,
    method: params.method === "all" ? undefined : params.method,
    status: params.status === "all" ? undefined : params.status,
    startDate: params.startDate ? new Date(params.startDate) : undefined,
    endDate: params.endDate ? new Date(params.endDate) : undefined,
    page: params.page ? parseInt(params.page) : 1,
  });
}

export async function fetchRevenueReport(params: Record<string, string>) {
  const { tenantId } = await requireAuthorized("reports", "view");

  return reportService.revenueReport({
    tenantId,
    planId: params.planId === "all" ? undefined : params.planId,
    startDate: params.startDate ? new Date(params.startDate) : undefined,
    endDate: params.endDate ? new Date(params.endDate) : undefined,
    page: params.page ? parseInt(params.page) : 1,
  });
}

export async function fetchExpiryReport(params: Record<string, string>) {
  const { tenantId } = await requireAuthorized("reports", "view");

  return reportService.expiryReport({
    tenantId,
    daysAhead: params.daysAhead ? parseInt(params.daysAhead) : 30,
    page: params.page ? parseInt(params.page) : 1,
  });
}

export async function fetchChurnReport(params: Record<string, string>) {
  const { tenantId } = await requireAuthorized("reports", "view");

  return reportService.churnReport({
    tenantId,
    startDate: params.startDate ? new Date(params.startDate) : undefined,
    endDate: params.endDate ? new Date(params.endDate) : undefined,
    page: params.page ? parseInt(params.page) : 1,
  });
}

export async function fetchSessionReport(params: Record<string, string>) {
  const { tenantId, user } = await requireAuthorized("reports", "view");
  if (!user.tenantSlug) throw new Error("No tenant slug");

  return reportService.sessionReport({
    tenantId,
    tenantSlug: user.tenantSlug,
    nasDeviceId: params.nasDeviceId === "all" ? undefined : params.nasDeviceId,
    startDate: params.startDate ? new Date(params.startDate) : undefined,
    endDate: params.endDate ? new Date(params.endDate) : undefined,
    page: params.page ? parseInt(params.page) : 1,
  });
}

export async function fetchUsageReport(params: Record<string, string>) {
  const { tenantId, user } = await requireAuthorized("reports", "view");
  if (!user.tenantSlug) throw new Error("No tenant slug");

  return reportService.usageReport({
    tenantId,
    tenantSlug: user.tenantSlug,
    planId: params.planId === "all" ? undefined : params.planId,
    startDate: params.startDate ? new Date(params.startDate) : undefined,
    endDate: params.endDate ? new Date(params.endDate) : undefined,
    page: params.page ? parseInt(params.page) : 1,
  });
}

export async function fetchVoucherReport(params: Record<string, string>) {
  const { tenantId } = await requireAuthorized("reports", "view");

  return reportService.voucherReport({
    tenantId,
    status: params.status === "all" ? undefined : params.status,
    page: params.page ? parseInt(params.page) : 1,
  });
}

export async function fetchNasReport() {
  const { tenantId } = await requireAuthorized("reports", "view");

  return reportService.nasReport({ tenantId });
}

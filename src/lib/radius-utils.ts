import type { Plan, SpeedUnit } from "@/generated/prisma";

// MikroTik-Rate-Limit: "{rx}/{tx} {burst_rx}/{burst_tx} {threshold_rx}/{threshold_tx} {burst_time}/{burst_time} {priority}"
// e.g. "50M/30M 100M/50M 100k/50k 10s/10s 1"
export function buildMikroTikRateLimit(plan: Plan): string {
  const unit = plan.speedUnit === "MBPS" ? "M" : "k";
  const rx = `${plan.downloadSpeed}${unit}`;
  const tx = `${plan.uploadSpeed}${unit}`;

  // If burst parameters are configured (with non-zero burst time), include them
  if (plan.burstDownloadSpeed && plan.burstUploadSpeed && plan.burstTime) {
    const burstRx = `${plan.burstDownloadSpeed}${unit}`;
    const burstTx = `${plan.burstUploadSpeed}${unit}`;
    const thresholdRx = plan.burstThreshold ? `${plan.burstThreshold}k` : "0";
    const thresholdTx = plan.burstThreshold ? `${plan.burstThreshold}k` : "0";
    const time = `${plan.burstTime}s/${plan.burstTime}s`;

    return `${rx}/${tx} ${burstRx}/${burstTx} ${thresholdRx}/${thresholdTx} ${time} ${plan.priority}`;
  }

  // No burst — simple rate limit only
  return `${rx}/${tx}`;
}

export function buildFupRateLimit(
  fupDownloadSpeed: number,
  fupUploadSpeed: number,
  speedUnit: SpeedUnit,
): string {
  const unit = speedUnit === "MBPS" ? "M" : "k";
  const rx = `${fupDownloadSpeed}${unit}`;
  const tx = `${fupUploadSpeed}${unit}`;

  return `${rx}/${tx}`;
}

// Tenant-prefixed RADIUS username: {slug}_{username}
export function buildRadiusUsername(
  tenantSlug: string,
  username: string
): string {
  return `${tenantSlug}_${username}`;
}

export function buildRadiusGroupname(
  tenantSlug: string,
  planId: string
): string {
  return `${tenantSlug}_${planId}`;
}

export function extractSubscriberUsername(radiusUsername: string): string {
  const parts = radiusUsername.split("_");
  parts.shift(); // Remove tenant slug
  return parts.join("_"); // Handle usernames with underscores
}

export function planToRadiusAttributes(
  plan: Plan
): Array<{ attribute: string; value: string; priority: number }> {
  const attributes = [];

  // Primary bandwidth limit
  const rateLimit = buildMikroTikRateLimit(plan);
  attributes.push({
    attribute: "Mikrotik-Rate-Limit",
    value: rateLimit,
    priority: 1,
  });

  // IP pool assignment (if specified)
  if (plan.poolName) {
    attributes.push({
      attribute: "Framed-Pool",
      value: plan.poolName,
      priority: 2,
    });
  }

  // Session timeout for hour-based plans
  if (plan.validityUnit === "HOURS") {
    const seconds = plan.validityDays * 3600;
    attributes.push({
      attribute: "Session-Timeout",
      value: String(seconds),
      priority: 3,
    });
  }

  return attributes;
}

import { requireTenantUser } from "@/lib/session";
import { authorize } from "@/lib/rbac";

export const metadata = { title: "RADIUS Configuration" };

export default async function RadiusConfigPage() {
  const user = await requireTenantUser();
  authorize(user.role, "settings", "view");

  const radiusServerIp = process.env.RADIUS_SERVER_IP || "your-radius-server.raynet.in";
  const authPort = process.env.RADIUS_AUTH_PORT || "1812";
  const acctPort = process.env.RADIUS_ACCT_PORT || "1813";
  const coaPort = process.env.RADIUS_COA_PORT || "3799";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">RADIUS Configuration</h1>
        <p className="text-sm text-muted-foreground">
          Follow these steps to connect your MikroTik router to Raynet
        </p>
      </div>

      {/* Connection Details */}
      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <h3 className="font-semibold text-foreground">Connection Details</h3>
        {[
          { label: "RADIUS Server IP", value: radiusServerIp },
          { label: "Authentication Port", value: authPort },
          { label: "Accounting Port", value: acctPort },
          { label: "CoA Port", value: coaPort },
        ].map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between rounded-md bg-muted/50 px-4 py-3"
          >
            <span className="text-sm text-muted-foreground">{item.label}</span>
            <code className="rounded bg-muted px-2 py-1 text-sm font-mono text-foreground">
              {item.value}
            </code>
          </div>
        ))}
      </div>

      {/* Prerequisites */}
      <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-6 space-y-3">
        <h3 className="font-semibold text-foreground">Before You Start</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">1. Register your router as a NAS device</strong> — Go to{" "}
            <strong>NAS Devices</strong> in the sidebar and add your router. You will need:
          </p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Your router&apos;s <strong>public IP address</strong> (visit whatismyip.com from behind your router)</li>
            <li>A <strong>shared secret</strong> — create a strong password (you&apos;ll use this same secret in step 2 below)</li>
          </ul>
          <p>
            <strong className="text-foreground">2. Create subscribers</strong> — Go to{" "}
            <strong>Subscribers</strong> and create at least one test subscriber with a username and password.
          </p>
        </div>
      </div>

      {/* MikroTik Setup Guide */}
      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <h3 className="font-semibold text-foreground">MikroTik Setup Guide</h3>
        <div className="space-y-4 text-sm text-muted-foreground">
          <div>
            <p className="mb-2">
              <strong className="text-foreground">Step 1:</strong> Add Raynet as a RADIUS server
            </p>
            <pre className="rounded-md bg-muted p-4 text-xs font-mono overflow-x-auto text-foreground">
{`/radius add address=${radiusServerIp} secret=YOUR_NAS_SECRET service=ppp,hotspot \\
    authentication-port=${authPort} accounting-port=${acctPort} timeout=3000`}
            </pre>
            <p className="mt-1 text-xs">
              Replace <code className="rounded bg-muted px-1 font-mono">YOUR_NAS_SECRET</code> with
              the shared secret you set when adding the NAS device in the dashboard.
            </p>
          </div>

          <div>
            <p className="mb-2">
              <strong className="text-foreground">Step 2:</strong> Enable RADIUS for PPPoE
            </p>
            <pre className="rounded-md bg-muted p-4 text-xs font-mono overflow-x-auto text-foreground">
{`/ppp aaa set use-radius=yes accounting=yes interim-update=5m`}
            </pre>
            <p className="mt-1 text-xs">
              <code className="rounded bg-muted px-1 font-mono">interim-update=5m</code> is required — without it,
              data usage won&apos;t update and sessions will appear stale.
            </p>
          </div>

          <div>
            <p className="mb-2">
              <strong className="text-foreground">Step 3:</strong> Enable RADIUS for Hotspot (if using Hotspot)
            </p>
            <pre className="rounded-md bg-muted p-4 text-xs font-mono overflow-x-auto text-foreground">
{`/ip hotspot profile set default use-radius=yes accounting=yes interim-update=00:05:00`}
            </pre>
          </div>

          <div>
            <p className="mb-2">
              <strong className="text-foreground">Step 4:</strong> Enable CoA (allows remote disconnect from dashboard)
            </p>
            <pre className="rounded-md bg-muted p-4 text-xs font-mono overflow-x-auto text-foreground">
{`/radius incoming set accept=yes port=${coaPort}`}
            </pre>
            <p className="mt-1 text-xs">
              For this to work, UDP port {coaPort} must be reachable on your router from the internet.
              If your router is behind NAT, forward port {coaPort}/UDP to it.
            </p>
          </div>

          <div>
            <p className="mb-2">
              <strong className="text-foreground">Step 5:</strong> Test the connection
            </p>
            <p>
              Connect a device using a subscriber&apos;s username and password (via PPPoE or Hotspot).
              If authentication succeeds, the user will appear in{" "}
              <strong>Online Users</strong> within a few seconds and data usage will update every 5 minutes.
            </p>
          </div>
        </div>
      </div>

      {/* Important Notes */}
      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <h3 className="font-semibold text-foreground">Important Notes</h3>
        <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
          <li>
            The <strong>NAS shared secret</strong> must match exactly between your router and the NAS device
            configured in the dashboard (NAS Devices page)
          </li>
          <li>
            Your router&apos;s <strong>public IP</strong> must match the NAS IP registered in the dashboard —
            if your ISP changes your IP, update it in both places
          </li>
          <li>
            <strong>Interim updates (5 min)</strong> are mandatory for accurate session tracking and data usage.
            Without them, active sessions will be cleaned up as stale
          </li>
          <li>
            <strong>Speed limits</strong> are applied automatically via the Mikrotik-Rate-Limit attribute —
            they take effect on new connections (disconnect and reconnect to apply changes)
          </li>
          <li>
            For <strong>remote disconnect</strong> to work, your router must accept incoming RADIUS packets
            on port {coaPort} (UDP). If behind NAT, set up port forwarding
          </li>
        </ul>
      </div>
    </div>
  );
}

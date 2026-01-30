import { requireTenantUser } from "@/lib/session";
import { authorize } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { NotificationType, NotificationChannel } from "@/generated/prisma";

export const metadata = { title: "Notification Templates" };

const EVENT_LABELS: Record<NotificationType, string> = {
  EXPIRY_REMINDER: "Expiry Reminder",
  EXPIRED_NOTICE: "Expired Notice",
  PAYMENT_CONFIRMATION: "Payment Confirmation",
  PAYMENT_DUE: "Payment Due",
  PLAN_ACTIVATION: "Plan Activation",
  OTP: "OTP Verification",
  TICKET_UPDATE: "Ticket Update",
  FUP_REACHED: "FUP Limit Reached",
};

const CHANNEL_LABELS: Record<NotificationChannel, string> = {
  SMS: "SMS",
  EMAIL: "Email",
  WHATSAPP: "WhatsApp",
};

const CHANNEL_VARIANTS: Record<NotificationChannel, "default" | "secondary" | "outline"> = {
  SMS: "secondary",
  EMAIL: "default",
  WHATSAPP: "outline",
};

export default async function NotificationsPage() {
  const user = await requireTenantUser();
  authorize(user.role, "settings", "view");

  const templates = await prisma.notificationTemplate.findMany({
    where: { tenantId: user.tenantId! },
    orderBy: [{ eventType: "asc" }, { channel: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Notification Templates</h1>
        <p className="text-sm text-muted-foreground">
          Manage message templates for SMS, email, and WhatsApp notifications
        </p>
      </div>

      {/* Info banner */}
      <div className="rounded-md border border-primary/20 bg-primary/5 p-4 text-sm text-foreground">
        Templates are automatically created for common events. Each template supports variables
        like <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">{"{name}"}</code>,{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">{"{plan}"}</code>,{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">{"{expiry}"}</code>{" "}
        that are replaced with actual values when sending notifications.
      </div>

      {/* Templates table */}
      {templates.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">
            No notification templates found. Templates are created automatically when you first
            set up SMS or Email gateways.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Variables</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell className="font-medium">
                    {EVENT_LABELS[template.eventType] || template.eventType}
                  </TableCell>
                  <TableCell>
                    <Badge variant={CHANNEL_VARIANTS[template.channel]}>
                      {CHANNEL_LABELS[template.channel] || template.channel}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {template.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-[200px] truncate">
                    {template.subject || "--"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {template.variables.map((v) => (
                        <code
                          key={v}
                          className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-muted-foreground"
                        >
                          {`{${v}}`}
                        </code>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={template.isActive ? "default" : "secondary"}>
                      {template.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

"use client";

import type {
  Subscriber,
  Plan,
  NasDevice,
  Location,
  Invoice,
  Payment,
  Ticket,
  RadAcct,
} from "@/generated/prisma";
import type { Serialized } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  User,
  Wifi,
  MapPin,
  Calendar,
  Phone,
  Mail,
  Globe,
  Router,
  Package,
  FileText,
  CreditCard,
  MessageSquare,
  Activity,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { useTransition } from "react";
import { updateSubscriberStatus } from "../actions";
import { toast } from "sonner";
import type { SubscriberStatus } from "@/generated/prisma";

type SubscriberFull = Serialized<
  Subscriber & {
    plan: Plan | null;
    nasDevice: (NasDevice & { location: Location | null }) | null;
    location: Location | null;
  }
>;

type InvoiceRow = Serialized<
  Invoice & {
    subscriber: { id: string; name: string; phone: string; username: string };
    plan: { id: string; name: string } | null;
    _count: { payments: number };
  }
>;

type PaymentRow = Serialized<
  Payment & {
    subscriber: { id: string; name: string; phone: string };
    invoice: { id: string; invoiceNumber: string } | null;
  }
>;

type TicketRow = Serialized<
  Ticket & {
    subscriber: { id: string; name: string; phone: string } | null;
    assignedTo: { id: string; name: string } | null;
    _count: { comments: number };
  }
>;

type SessionRow = Serialized<RadAcct>;

const statusVariant: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  ACTIVE: "default",
  EXPIRED: "destructive",
  DISABLED: "secondary",
  SUSPENDED: "outline",
  TRIAL: "outline",
};

const statusClassName: Record<string, string> = {
  SUSPENDED:
    "border-amber-500 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
};

const invoiceStatusVariant: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  PAID: "default",
  ISSUED: "outline",
  OVERDUE: "destructive",
  CANCELLED: "secondary",
  DRAFT: "secondary",
};

const ticketStatusVariant: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  OPEN: "outline",
  ASSIGNED: "outline",
  IN_PROGRESS: "default",
  RESOLVED: "default",
  CLOSED: "secondary",
};

const ticketPriorityVariant: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  LOW: "secondary",
  MEDIUM: "outline",
  HIGH: "destructive",
  CRITICAL: "destructive",
};

interface SubscriberProfileProps {
  subscriber: SubscriberFull;
  invoices: InvoiceRow[];
  payments: PaymentRow[];
  tickets: TicketRow[];
  sessions: SessionRow[];
}

export function SubscriberProfile({
  subscriber,
  invoices,
  payments,
  tickets,
  sessions,
}: SubscriberProfileProps) {
  const [, startTransition] = useTransition();

  const handleStatusChange = (status: SubscriberStatus) => {
    startTransition(async () => {
      const result = await updateSubscriberStatus(subscriber.id, status);
      if (result.success) toast.success(`Status changed to ${status}`);
      else toast.error(result.error ?? "Failed");
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/subscribers">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{subscriber.name}</h1>
            <Badge
              variant={statusVariant[subscriber.status] ?? "secondary"}
              className={statusClassName[subscriber.status] ?? ""}
            >
              {subscriber.status}
            </Badge>
            <Badge variant="outline">{subscriber.connectionType}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            @{subscriber.username}
          </p>
        </div>
        <div className="flex gap-2">
          {subscriber.status !== "ACTIVE" && (
            <Button size="sm" onClick={() => handleStatusChange("ACTIVE")}>
              Activate
            </Button>
          )}
          {subscriber.status === "ACTIVE" && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleStatusChange("SUSPENDED")}
            >
              Suspend
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="billing">
            Billing{" "}
            {invoices.length > 0 && (
              <span className="ml-1 text-xs text-muted-foreground">
                ({invoices.length})
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="sessions">
            Sessions{" "}
            {sessions.length > 0 && (
              <span className="ml-1 text-xs text-muted-foreground">
                ({sessions.length})
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="complaints">
            Complaints{" "}
            {tickets.length > 0 && (
              <span className="ml-1 text-xs text-muted-foreground">
                ({tickets.length})
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Personal Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="h-4 w-4" /> Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoRow icon={Phone} label="Phone" value={subscriber.phone} />
                {subscriber.alternatePhone && (
                  <InfoRow
                    icon={Phone}
                    label="Alt Phone"
                    value={subscriber.alternatePhone}
                  />
                )}
                {subscriber.email && (
                  <InfoRow
                    icon={Mail}
                    label="Email"
                    value={subscriber.email}
                  />
                )}
                {subscriber.address && (
                  <InfoRow
                    icon={MapPin}
                    label="Address"
                    value={subscriber.address}
                  />
                )}
                <InfoRow
                  icon={User}
                  label="Type"
                  value={subscriber.subscriberType}
                />
                {subscriber.gpsCoordinates && (
                  <InfoRow
                    icon={Globe}
                    label="GPS"
                    value={subscriber.gpsCoordinates}
                  />
                )}
              </CardContent>
            </Card>

            {/* Plan & Network */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Wifi className="h-4 w-4" /> Connection Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoRow
                  icon={Package}
                  label="Plan"
                  value={subscriber.plan?.name ?? "No plan"}
                />
                {subscriber.plan && (
                  <InfoRow
                    icon={Wifi}
                    label="Speed"
                    value={`${subscriber.plan.downloadSpeed}/${subscriber.plan.uploadSpeed} ${subscriber.plan.speedUnit}`}
                  />
                )}
                <InfoRow
                  icon={Router}
                  label="NAS"
                  value={
                    subscriber.nasDevice
                      ? `${subscriber.nasDevice.name} (${subscriber.nasDevice.nasIp})`
                      : "Not assigned"
                  }
                />
                <InfoRow
                  icon={MapPin}
                  label="Location"
                  value={subscriber.location?.name ?? "Not set"}
                />
                {subscriber.macAddress && (
                  <InfoRow
                    icon={Wifi}
                    label="MAC"
                    value={subscriber.macAddress}
                  />
                )}
                {subscriber.ipAddress && (
                  <InfoRow
                    icon={Globe}
                    label="IP"
                    value={subscriber.ipAddress}
                  />
                )}
              </CardContent>
            </Card>

            {/* Dates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="h-4 w-4" /> Dates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {subscriber.installationDate && (
                  <InfoRow
                    icon={Calendar}
                    label="Installed"
                    value={format(
                      new Date(subscriber.installationDate),
                      "dd MMM yyyy"
                    )}
                  />
                )}
                {subscriber.lastRenewalDate && (
                  <InfoRow
                    icon={Calendar}
                    label="Last Renewed"
                    value={format(
                      new Date(subscriber.lastRenewalDate),
                      "dd MMM yyyy"
                    )}
                  />
                )}
                {subscriber.expiryDate && (
                  <InfoRow
                    icon={Calendar}
                    label="Expires"
                    value={format(
                      new Date(subscriber.expiryDate),
                      "dd MMM yyyy"
                    )}
                  />
                )}
                <InfoRow
                  icon={Calendar}
                  label="Created"
                  value={format(
                    new Date(subscriber.createdAt),
                    "dd MMM yyyy"
                  )}
                />
              </CardContent>
            </Card>

            {/* Balance & Billing Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CreditCard className="h-4 w-4" /> Billing Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoRow
                  icon={CreditCard}
                  label="Balance"
                  value={`Rs. ${Number(subscriber.balance ?? 0).toFixed(2)}`}
                />
                <InfoRow
                  icon={FileText}
                  label="Total Invoices"
                  value={String(invoices.length)}
                />
                <InfoRow
                  icon={CreditCard}
                  label="Total Payments"
                  value={String(payments.length)}
                />
                <InfoRow
                  icon={MessageSquare}
                  label="Open Tickets"
                  value={String(
                    tickets.filter(
                      (t) =>
                        t.status !== "CLOSED" && t.status !== "RESOLVED"
                    ).length
                  )}
                />
              </CardContent>
            </Card>

            {/* Notes */}
            {subscriber.notes && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {subscriber.notes}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-4">
          {/* Invoices */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4" /> Invoices
              </CardTitle>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">
                  No invoices found
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Tax</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell className="font-medium">
                          {inv.invoiceNumber}
                        </TableCell>
                        <TableCell>
                          {format(new Date(inv.invoiceDate), "dd MMM yyyy")}
                        </TableCell>
                        <TableCell>
                          Rs. {Number(inv.amount).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          Rs. {Number(inv.tax).toFixed(2)}
                        </TableCell>
                        <TableCell className="font-medium">
                          Rs. {Number(inv.total).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          Rs. {Number(inv.balanceDue).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              invoiceStatusVariant[inv.status] ?? "secondary"
                            }
                          >
                            {inv.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Payments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="h-4 w-4" /> Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">
                  No payments found
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((pay) => (
                      <TableRow key={pay.id}>
                        <TableCell>
                          {format(new Date(pay.createdAt), "dd MMM yyyy")}
                        </TableCell>
                        <TableCell>
                          {pay.invoice?.invoiceNumber ?? "-"}
                        </TableCell>
                        <TableCell className="font-medium">
                          Rs. {Number(pay.amount).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{pay.method}</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {pay.transactionId ?? "-"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              pay.status === "COMPLETED"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {pay.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sessions Tab */}
        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-4 w-4" /> RADIUS Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sessions.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">
                  No session history found
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Start</TableHead>
                      <TableHead>Stop</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Upload</TableHead>
                      <TableHead>Download</TableHead>
                      <TableHead>IP</TableHead>
                      <TableHead>NAS IP</TableHead>
                      <TableHead>Term Cause</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="text-xs">
                          {s.acctstarttime
                            ? format(
                                new Date(s.acctstarttime),
                                "dd MMM yyyy HH:mm"
                              )
                            : "-"}
                        </TableCell>
                        <TableCell className="text-xs">
                          {s.acctstoptime
                            ? format(
                                new Date(s.acctstoptime),
                                "dd MMM yyyy HH:mm"
                              )
                            : (
                              <Badge variant="default" className="text-xs">
                                Online
                              </Badge>
                            )}
                        </TableCell>
                        <TableCell className="text-xs">
                          {formatDuration(s.acctsessiontime ? Number(s.acctsessiontime) : null)}
                        </TableCell>
                        <TableCell className="text-xs">
                          {formatBytes(
                            Number(s.acctinputoctets ?? 0)
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          {formatBytes(
                            Number(s.acctoutputoctets ?? 0)
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          {s.framedipaddress ?? "-"}
                        </TableCell>
                        <TableCell className="text-xs">
                          {s.nasipaddress ?? "-"}
                        </TableCell>
                        <TableCell className="text-xs">
                          {s.acctterminatecause ?? "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Complaints Tab */}
        <TabsContent value="complaints">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquare className="h-4 w-4" /> Tickets
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tickets.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">
                  No tickets found
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ticket #</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Comments</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tickets.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">
                          <Link
                            href={`/complaints/${t.id}`}
                            className="hover:underline"
                          >
                            {t.ticketNumber}
                          </Link>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {t.subject}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {t.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              ticketPriorityVariant[t.priority] ?? "secondary"
                            }
                          >
                            {t.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              ticketStatusVariant[t.status] ?? "secondary"
                            }
                          >
                            {t.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {t.assignedTo?.name ?? "-"}
                        </TableCell>
                        <TableCell className="text-xs">
                          {format(new Date(t.createdAt), "dd MMM yyyy")}
                        </TableCell>
                        <TableCell className="text-center">
                          {t._count.comments}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 text-muted-foreground" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm">{value}</p>
      </div>
    </div>
  );
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "-";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

import { requireTenantId } from "@/lib/session";
import { billingService } from "@/services/billing.service";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import {
  Download,
  DollarSign,
  User,
  FileText,
  Calendar,
  CreditCard,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

interface InvoiceDetailPageProps {
  params: Promise<{ id: string }>;
}

const statusColors: Record<string, string> = {
  PAID: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  ISSUED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  OVERDUE: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  CANCELLED: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  DRAFT: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
};

export default async function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  const tenantId = await requireTenantId();
  const { id } = await params;

  const invoice = await billingService.getById(tenantId, id);

  if (!invoice) {
    notFound();
  }

  const canRecordPayment =
    invoice.status !== "PAID" && invoice.status !== "CANCELLED";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">
              {invoice.invoiceNumber}
            </h1>
            <Badge className={statusColors[invoice.status]}>{invoice.status}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Invoice details and payment history
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canRecordPayment && (
            <Button asChild>
              <Link href={`/billing/payments/new?invoiceId=${invoice.id}`}>
                <DollarSign className="mr-2 h-4 w-4" />
                Record Payment
              </Link>
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link href={`/api/invoices/${invoice.id}/pdf`} target="_blank">
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Invoice Details */}
        <div className="space-y-6 lg:col-span-2">
          {/* Subscriber Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Subscriber Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Name</span>
                <Link
                  href={`/subscribers/${invoice.subscriber.id}`}
                  className="text-sm font-medium hover:underline"
                >
                  {invoice.subscriber.name}
                </Link>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Username</span>
                <span className="text-sm font-mono">{invoice.subscriber.username}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Phone</span>
                <span className="text-sm">{invoice.subscriber.phone}</span>
              </div>
              {invoice.subscriber.email && (
                <>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Email</span>
                    <span className="text-sm">{invoice.subscriber.email}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Invoice Line Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Invoice Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {invoice.plan?.name || "Service Charge"}
                        </p>
                        {invoice.description && (
                          <p className="text-sm text-muted-foreground">
                            {invoice.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      ₹{Number(invoice.amount).toFixed(2)}
                    </TableCell>
                  </TableRow>
                  {Number(invoice.tax) > 0 && (
                    <TableRow>
                      <TableCell>Tax</TableCell>
                      <TableCell className="text-right">
                        ₹{Number(invoice.tax).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  )}
                  {Number(invoice.discount) > 0 && (
                    <TableRow>
                      <TableCell>Discount</TableCell>
                      <TableCell className="text-right text-green-600">
                        -₹{Number(invoice.discount).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  )}
                  <TableRow>
                    <TableCell className="font-bold">Total</TableCell>
                    <TableCell className="text-right font-bold">
                      ₹{Number(invoice.total).toFixed(2)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Amount Paid</TableCell>
                    <TableCell className="text-right font-medium text-green-600">
                      ₹{Number(invoice.amountPaid).toFixed(2)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-bold">Balance Due</TableCell>
                    <TableCell className="text-right font-bold text-orange-600">
                      ₹{Number(invoice.balanceDue).toFixed(2)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              {invoice.notes && (
                <div className="mt-4 rounded-lg bg-muted p-3">
                  <p className="text-sm font-medium">Notes</p>
                  <p className="text-sm text-muted-foreground">{invoice.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {invoice.payments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No payments recorded yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="text-sm">
                          {format(new Date(payment.createdAt), "dd MMM yyyy HH:mm")}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{payment.method}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {payment.transactionId || "-"}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ₹{Number(payment.amount).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Dates & Metadata */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Dates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Invoice Date</p>
                <p className="text-sm font-medium">
                  {format(new Date(invoice.invoiceDate), "dd MMM yyyy")}
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground">Due Date</p>
                <p
                  className={`text-sm font-medium ${
                    new Date(invoice.dueDate) < new Date() &&
                    invoice.status !== "PAID"
                      ? "text-destructive"
                      : ""
                  }`}
                >
                  {format(new Date(invoice.dueDate), "dd MMM yyyy")}
                </p>
              </div>
              {invoice.paidDate && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground">Paid Date</p>
                    <p className="text-sm font-medium text-green-600">
                      {format(new Date(invoice.paidDate), "dd MMM yyyy")}
                    </p>
                  </div>
                </>
              )}
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="text-sm">
                  {format(new Date(invoice.createdAt), "dd MMM yyyy HH:mm")}
                </p>
              </div>
            </CardContent>
          </Card>

          {invoice.planDetails && (
            <Card>
              <CardHeader>
                <CardTitle>Plan Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plan</span>
                  <span className="font-medium">
                    {(invoice.planDetails as any).name}
                  </span>
                </div>
                {(invoice.planDetails as any).downloadSpeed && (
                  <>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Speed</span>
                      <span>
                        {(invoice.planDetails as any).downloadSpeed}/
                        {(invoice.planDetails as any).uploadSpeed}{" "}
                        {(invoice.planDetails as any).speedUnit}
                      </span>
                    </div>
                  </>
                )}
                {(invoice.planDetails as any).validityDays && (
                  <>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Validity</span>
                      <span>{(invoice.planDetails as any).validityDays} days</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

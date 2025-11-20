import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import type { Invoice, Subscriber, Plan, Payment } from "@/generated/prisma";
import { format } from "date-fns";

type InvoiceWithRelations = Invoice & {
  subscriber: Subscriber;
  plan: Plan | null;
  payments: Payment[];
};

interface InvoicePDFProps {
  invoice: InvoiceWithRelations;
  tenantName: string;
  tenantLogo: string | null;
  settings: any;
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
  },
  header: {
    marginBottom: 30,
  },
  companyName: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#1f2937",
  },
  label: {
    fontSize: 9,
    color: "#6b7280",
    marginBottom: 3,
  },
  value: {
    fontSize: 10,
    color: "#111827",
    marginBottom: 8,
  },
  table: {
    marginTop: 20,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    padding: 8,
    fontWeight: "bold",
    fontSize: 9,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    padding: 8,
    fontSize: 9,
  },
  tableCol1: {
    width: "60%",
  },
  tableCol2: {
    width: "40%",
    textAlign: "right",
  },
  totalsSection: {
    marginTop: 10,
    alignItems: "flex-end",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 200,
    marginBottom: 5,
  },
  totalLabel: {
    fontSize: 9,
    color: "#6b7280",
  },
  totalValue: {
    fontSize: 9,
    textAlign: "right",
  },
  grandTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 200,
    marginTop: 5,
    paddingTop: 5,
    borderTopWidth: 2,
    borderTopColor: "#111827",
  },
  grandTotalLabel: {
    fontSize: 11,
    fontWeight: "bold",
  },
  grandTotalValue: {
    fontSize: 11,
    fontWeight: "bold",
    textAlign: "right",
  },
  statusBadge: {
    backgroundColor: "#10b981",
    color: "#ffffff",
    padding: 5,
    borderRadius: 3,
    fontSize: 9,
    textAlign: "center",
    width: 60,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 8,
    color: "#6b7280",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 10,
  },
});

export function InvoicePDF({
  invoice,
  tenantName,
  tenantLogo,
  settings,
}: InvoicePDFProps) {
  const statusColors: Record<string, string> = {
    PAID: "#10b981",
    ISSUED: "#3b82f6",
    OVERDUE: "#ef4444",
    CANCELLED: "#6b7280",
    DRAFT: "#f59e0b",
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.companyName}>{tenantName}</Text>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <View>
              <Text style={styles.title}>INVOICE</Text>
              <View style={{ marginBottom: 5 }}>
                <Text style={styles.label}>Invoice Number</Text>
                <Text style={styles.value}>{invoice.invoiceNumber}</Text>
              </View>
              <View style={{ marginBottom: 5 }}>
                <Text style={styles.label}>Invoice Date</Text>
                <Text style={styles.value}>
                  {format(new Date(invoice.invoiceDate), "dd MMM yyyy")}
                </Text>
              </View>
              <View>
                <Text style={styles.label}>Due Date</Text>
                <Text style={styles.value}>
                  {format(new Date(invoice.dueDate), "dd MMM yyyy")}
                </Text>
              </View>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: statusColors[invoice.status] },
                ]}
              >
                <Text>{invoice.status}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bill To Section */}
        <View style={styles.row}>
          <View style={{ width: "48%" }}>
            <Text style={styles.sectionTitle}>Bill To</Text>
            <Text style={styles.value}>{invoice.subscriber.name}</Text>
            {invoice.subscriber.address && (
              <Text style={styles.value}>{invoice.subscriber.address}</Text>
            )}
            <Text style={styles.value}>Phone: {invoice.subscriber.phone}</Text>
            {invoice.subscriber.email && (
              <Text style={styles.value}>Email: {invoice.subscriber.email}</Text>
            )}
            <Text style={[styles.value, { fontFamily: "Courier" }]}>
              Username: {invoice.subscriber.username}
            </Text>
          </View>
        </View>

        {/* Line Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableCol1}>Description</Text>
            <Text style={styles.tableCol2}>Amount</Text>
          </View>
          <View style={styles.tableRow}>
            <View style={styles.tableCol1}>
              <Text style={{ fontWeight: "bold", marginBottom: 3 }}>
                {invoice.plan?.name || "Service Charge"}
              </Text>
              {invoice.description && (
                <Text style={{ fontSize: 8, color: "#6b7280" }}>
                  {invoice.description}
                </Text>
              )}
            </View>
            <Text style={styles.tableCol2}>
              ₹{Number(invoice.amount).toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>
              ₹{Number(invoice.amount).toFixed(2)}
            </Text>
          </View>
          {Number(invoice.tax) > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>
                Tax ({settings.taxName || "GST"})
              </Text>
              <Text style={styles.totalValue}>
                ₹{Number(invoice.tax).toFixed(2)}
              </Text>
            </View>
          )}
          {Number(invoice.discount) > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Discount</Text>
              <Text style={[styles.totalValue, { color: "#10b981" }]}>
                -₹{Number(invoice.discount).toFixed(2)}
              </Text>
            </View>
          )}
          <View style={styles.grandTotal}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <Text style={styles.grandTotalValue}>
              ₹{Number(invoice.total).toFixed(2)}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Amount Paid</Text>
            <Text style={[styles.totalValue, { color: "#10b981" }]}>
              ₹{Number(invoice.amountPaid).toFixed(2)}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Balance Due</Text>
            <Text style={[styles.totalValue, { color: "#ef4444", fontWeight: "bold" }]}>
              ₹{Number(invoice.balanceDue).toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Payment History */}
        {invoice.payments.length > 0 && (
          <View style={[styles.section, { marginTop: 30 }]}>
            <Text style={styles.sectionTitle}>Payment History</Text>
            <View style={styles.tableHeader}>
              <Text style={{ width: "30%" }}>Date</Text>
              <Text style={{ width: "25%" }}>Method</Text>
              <Text style={{ width: "25%" }}>Transaction ID</Text>
              <Text style={{ width: "20%", textAlign: "right" }}>Amount</Text>
            </View>
            {invoice.payments.map((payment) => (
              <View key={payment.id} style={styles.tableRow}>
                <Text style={{ width: "30%" }}>
                  {format(new Date(payment.createdAt), "dd MMM yyyy")}
                </Text>
                <Text style={{ width: "25%" }}>{payment.method}</Text>
                <Text style={{ width: "25%", fontFamily: "Courier", fontSize: 8 }}>
                  {payment.transactionId || "-"}
                </Text>
                <Text style={{ width: "20%", textAlign: "right" }}>
                  ₹{Number(payment.amount).toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Notes */}
        {invoice.notes && (
          <View style={[styles.section, { marginTop: 20 }]}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.value}>{invoice.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            {settings.invoiceFooterText ||
              "Thank you for your business. Please make payment by the due date."}
          </Text>
          <Text style={{ marginTop: 5 }}>
            Generated on {format(new Date(), "dd MMM yyyy HH:mm")}
          </Text>
        </View>
      </Page>
    </Document>
  );
}

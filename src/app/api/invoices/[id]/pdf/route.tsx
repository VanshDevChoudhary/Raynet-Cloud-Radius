import { NextRequest, NextResponse } from "next/server";
import { requireTenantId } from "@/lib/session";
import { billingService } from "@/services/billing.service";
import { renderToStream } from "@react-pdf/renderer";
import { InvoicePDF } from "./invoice-pdf";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = await requireTenantId();
    const { id } = await params;

    // Fetch invoice with all related data
    const invoice = await billingService.getById(tenantId, id);

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Fetch tenant info for branding
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        name: true,
        logo: true,
        settings: true,
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const settings = (tenant.settings as any)?.billing || {};

    // Generate PDF
    const stream = await renderToStream(
      <InvoicePDF
        invoice={invoice}
        tenantName={tenant.name}
        tenantLogo={tenant.logo}
        settings={settings}
      />
    );

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of stream) {
      chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
    }
    const buffer = Buffer.concat(chunks);

    // Return PDF
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}

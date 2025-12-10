"use client";

import { Button } from "@/components/ui/button";
import { Printer, ChevronLeft } from "lucide-react";
import Link from "next/link";

interface PrintableCardsProps {
  batch: {
    id: string;
    batchNumber: string;
    validityDays: number;
    plan: {
      name: string;
      price: { toString(): string };
      downloadSpeed: number;
      uploadSpeed: number;
      speedUnit: string;
      validityDays: number;
      validityUnit: string;
      dataLimit: number | null;
      dataUnit: string;
    };
  };
  vouchers: Array<{
    id: string;
    code: string;
    serialNumber: number;
    status: string;
  }>;
  tenantName: string;
}

export function PrintableCards({ batch, vouchers, tenantName }: PrintableCardsProps) {
  const handlePrint = () => {
    window.print();
  };

  const dataInfo = batch.plan.dataLimit
    ? `${batch.plan.dataLimit} ${batch.plan.dataUnit}`
    : "Unlimited";

  return (
    <div>
      {/* Header - hidden during print */}
      <div className="mb-6 flex items-center justify-between print:hidden">
        <div>
          <Link
            href={`/vouchers/${batch.id}`}
            className="mb-2 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back to Batch
          </Link>
          <h1 className="text-2xl font-bold">Print Voucher Cards</h1>
          <p className="text-sm text-muted-foreground">
            {batch.batchNumber} — {vouchers.length} cards
          </p>
        </div>
        <Button onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" />
          Print
        </Button>
      </div>

      {/* Printable card grid */}
      <div className="grid grid-cols-2 gap-4 print:grid-cols-3 print:gap-2 md:grid-cols-3 lg:grid-cols-4">
        {vouchers.map((voucher) => (
          <div
            key={voucher.id}
            className="rounded-lg border-2 border-gray-300 p-4 print:break-inside-avoid print:rounded-none print:border print:p-3"
          >
            {/* Card header */}
            <div className="mb-2 text-center">
              <p className="text-xs font-bold uppercase tracking-wider text-primary">
                {tenantName}
              </p>
              <p className="text-[10px] text-muted-foreground">WiFi Voucher</p>
            </div>

            {/* Plan info */}
            <div className="mb-2 rounded bg-muted/50 p-2 text-center">
              <p className="text-sm font-semibold">{batch.plan.name}</p>
              <p className="text-xs text-muted-foreground">
                {batch.plan.downloadSpeed}/{batch.plan.uploadSpeed} {batch.plan.speedUnit} · {dataInfo}
              </p>
            </div>

            {/* Voucher code - prominent */}
            <div className="my-3 rounded border border-dashed border-gray-400 bg-white p-2 text-center">
              <p className="text-[10px] uppercase text-muted-foreground">Voucher Code</p>
              <p className="text-lg font-bold tracking-widest">{voucher.code}</p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>#{voucher.serialNumber}</span>
              <span>Valid {batch.validityDays} days</span>
              <span>₹{batch.plan.price.toString()}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .grid,
          .grid * {
            visibility: visible;
          }
          .grid {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          @page {
            size: A4;
            margin: 10mm;
          }
        }
      `}</style>
    </div>
  );
}

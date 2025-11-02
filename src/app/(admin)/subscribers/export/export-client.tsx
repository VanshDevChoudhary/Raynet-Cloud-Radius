"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Download } from "lucide-react";
import Link from "next/link";
import Papa from "papaparse";

interface ExportClientProps {
  data: Record<string, string>[];
}

export function ExportClient({ data }: ExportClientProps) {
  const handleExportCSV = () => {
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `subscribers-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/subscribers">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Export Subscribers</h1>
          <p className="text-sm text-muted-foreground">
            Download subscriber data as CSV
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Export Preview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {data.length} subscriber{data.length !== 1 ? "s" : ""} will be exported.
          </p>

          {data.length > 0 && (
            <div className="overflow-auto rounded border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    {Object.keys(data[0]).map((key) => (
                      <th key={key} className="px-3 py-2 text-left font-medium">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.slice(0, 5).map((row, i) => (
                    <tr key={i} className="border-b">
                      {Object.values(row).map((val, j) => (
                        <td key={j} className="px-3 py-2 whitespace-nowrap">
                          {val}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.length > 5 && (
                <p className="px-3 py-2 text-xs text-muted-foreground">
                  ... and {data.length - 5} more rows
                </p>
              )}
            </div>
          )}

          <Button onClick={handleExportCSV} disabled={data.length === 0}>
            <Download className="mr-2 h-4 w-4" /> Download CSV
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

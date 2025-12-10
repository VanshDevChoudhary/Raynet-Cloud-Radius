"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { format } from "date-fns";
import { markVouchersSold } from "../actions";

interface Voucher {
  id: string;
  code: string;
  serialNumber: number;
  status: string;
  soldTo: string | null;
  soldAt: Date | null;
  redeemedAt: Date | null;
  expiresAt: Date | null;
  batch: {
    batchNumber: string;
    validityDays: number;
    plan: { id: string; name: string; price: { toString(): string } };
  };
  redeemedBy: { id: string; name: string; phone: string } | null;
}

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  GENERATED: "outline",
  SOLD: "secondary",
  REDEEMED: "default",
  EXPIRED: "destructive",
};

interface VoucherListProps {
  vouchers: Voucher[];
  batchId: string;
}

export function VoucherList({ vouchers, batchId }: VoucherListProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [soldDialogOpen, setSoldDialogOpen] = useState(false);
  const [soldTo, setSoldTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const filteredVouchers = vouchers.filter(
    (v) =>
      v.code.toLowerCase().includes(search.toLowerCase()) ||
      v.soldTo?.toLowerCase().includes(search.toLowerCase()) ||
      v.redeemedBy?.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const generatedIds = filteredVouchers
      .filter((v) => v.status === "GENERATED")
      .map((v) => v.id);
    if (selected.size === generatedIds.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(generatedIds));
    }
  };

  const handleMarkSold = async () => {
    if (!soldTo.trim() || selected.size === 0) return;
    setLoading(true);
    try {
      const result = await markVouchersSold(Array.from(selected), { soldTo: soldTo.trim() });
      if (result.success) {
        toast.success(`Marked ${selected.size} vouchers as sold`);
        setSelected(new Set());
        setSoldDialogOpen(false);
        setSoldTo("");
      } else {
        toast.error(result.error || "Failed");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Input
          placeholder="Search vouchers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        {selected.size > 0 && (
          <Button variant="outline" onClick={() => setSoldDialogOpen(true)}>
            Mark {selected.size} as Sold
          </Button>
        )}
      </div>

      <div className="rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="w-10 p-3">
                <Checkbox
                  checked={
                    selected.size > 0 &&
                    selected.size ===
                      filteredVouchers.filter((v) => v.status === "GENERATED").length
                  }
                  onCheckedChange={toggleSelectAll}
                />
              </th>
              <th className="p-3 text-left font-medium">#</th>
              <th className="p-3 text-left font-medium">Code</th>
              <th className="p-3 text-left font-medium">Status</th>
              <th className="p-3 text-left font-medium">Sold To</th>
              <th className="p-3 text-left font-medium">Redeemed By</th>
              <th className="p-3 text-left font-medium">Expires</th>
            </tr>
          </thead>
          <tbody>
            {filteredVouchers.map((v) => (
              <tr key={v.id} className="border-b last:border-0">
                <td className="p-3">
                  {v.status === "GENERATED" && (
                    <Checkbox
                      checked={selected.has(v.id)}
                      onCheckedChange={() => toggleSelect(v.id)}
                    />
                  )}
                </td>
                <td className="p-3 text-muted-foreground">{v.serialNumber}</td>
                <td className="p-3 font-mono font-medium">{v.code}</td>
                <td className="p-3">
                  <Badge variant={statusVariant[v.status]}>{v.status}</Badge>
                </td>
                <td className="p-3 text-muted-foreground">
                  {v.soldTo || "-"}
                  {v.soldAt && (
                    <span className="block text-xs">
                      {format(new Date(v.soldAt), "dd MMM")}
                    </span>
                  )}
                </td>
                <td className="p-3 text-muted-foreground">
                  {v.redeemedBy ? (
                    <span>
                      {v.redeemedBy.name}
                      <span className="block text-xs">{v.redeemedBy.phone}</span>
                    </span>
                  ) : (
                    "-"
                  )}
                </td>
                <td className="p-3 text-muted-foreground">
                  {v.expiresAt
                    ? format(new Date(v.expiresAt), "dd MMM yyyy")
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={soldDialogOpen} onOpenChange={setSoldDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Mark as Sold</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Mark {selected.size} voucher{selected.size > 1 ? "s" : ""} as sold.
            </p>
            <div className="space-y-2">
              <Label htmlFor="soldTo">Sold to (dealer/retailer name) *</Label>
              <Input
                id="soldTo"
                value={soldTo}
                onChange={(e) => setSoldTo(e.target.value)}
                placeholder="e.g., Retailer ABC"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSoldDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleMarkSold} disabled={loading || !soldTo.trim()}>
                {loading ? "Saving..." : "Mark as Sold"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

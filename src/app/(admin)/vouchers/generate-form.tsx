"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { generateVoucherBatch } from "./actions";

interface Plan {
  id: string;
  name: string;
  price: { toString(): string };
  validityDays: number;
}

interface GenerateFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plans: Plan[];
}

export function GenerateForm({ open, onOpenChange, plans }: GenerateFormProps) {
  const [loading, setLoading] = useState(false);
  const [planId, setPlanId] = useState("");
  const [quantity, setQuantity] = useState("20");
  const [prefix, setPrefix] = useState("");
  const [codeLength, setCodeLength] = useState("8");
  const [validityDays, setValidityDays] = useState("30");
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await generateVoucherBatch({
        planId,
        quantity: parseInt(quantity, 10),
        prefix: prefix.toUpperCase(),
        codeLength: parseInt(codeLength, 10),
        validityDays: parseInt(validityDays, 10),
        notes: notes || undefined,
      });

      if (result.success) {
        toast.success(`Generated ${quantity} vouchers successfully`);
        onOpenChange(false);
        resetForm();
      } else {
        toast.error(result.error || "Failed to generate vouchers");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setPlanId("");
    setQuantity("20");
    setPrefix("");
    setCodeLength("8");
    setValidityDays("30");
    setNotes("");
  };

  // Auto-fill validity when plan is selected
  const handlePlanChange = (value: string) => {
    setPlanId(value);
    const plan = plans.find((p) => p.id === value);
    if (plan) {
      setValidityDays(String(plan.validityDays));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Generate Voucher Batch</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="plan">Plan *</Label>
            <Select value={planId} onValueChange={handlePlanChange} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a plan" />
              </SelectTrigger>
              <SelectContent>
                {plans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name} — ₹{plan.price.toString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min={1}
                max={1000}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">Max 1000 per batch</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="validityDays">Validity (days) *</Label>
              <Input
                id="validityDays"
                type="number"
                min={1}
                max={365}
                value={validityDays}
                onChange={(e) => setValidityDays(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prefix">Code Prefix</Label>
              <Input
                id="prefix"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value.toUpperCase())}
                placeholder="e.g., WIFI"
                maxLength={6}
              />
              <p className="text-xs text-muted-foreground">e.g., WIFI-A1B2C3D4</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="codeLength">Code Length</Label>
              <Select value={codeLength} onValueChange={setCodeLength}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6">6 characters</SelectItem>
                  <SelectItem value="8">8 characters</SelectItem>
                  <SelectItem value="10">10 characters</SelectItem>
                  <SelectItem value="12">12 characters</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional batch notes..."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !planId}>
              {loading ? "Generating..." : `Generate ${quantity} Vouchers`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

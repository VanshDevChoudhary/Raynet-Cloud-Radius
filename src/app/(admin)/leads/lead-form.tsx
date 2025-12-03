"use client";

import { useState, useEffect } from "react";
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
import { createLead, updateLead } from "./actions";

interface Location {
  id: string;
  name: string;
  type: string;
}

interface LeadData {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  locationId: string | null;
  source: string;
  status: string;
  notes: string | null;
}

interface LeadFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locations: Location[];
  editData?: LeadData | null;
}

export function LeadForm({ open, onOpenChange, locations, editData }: LeadFormProps) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [locationId, setLocationId] = useState("");
  const [source, setSource] = useState("WALK_IN");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (editData) {
      setName(editData.name);
      setPhone(editData.phone);
      setEmail(editData.email || "");
      setAddress(editData.address || "");
      setLocationId(editData.locationId || "");
      setSource(editData.source);
      setNotes(editData.notes || "");
    } else {
      resetForm();
    }
  }, [editData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        name,
        phone,
        email: email || "",
        address: address || "",
        locationId: locationId || "",
        source,
        notes: notes || "",
      };

      const result = editData
        ? await updateLead(editData.id, data)
        : await createLead(data);

      if (result.success) {
        toast.success(editData ? "Lead updated" : "Lead created");
        onOpenChange(false);
        if (!editData) resetForm();
      } else {
        toast.error(result.error || "Failed to save lead");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setPhone("");
    setEmail("");
    setAddress("");
    setLocationId("");
    setSource("WALK_IN");
    setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editData ? "Edit Lead" : "Add Lead"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+919876543210"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Source *</Label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WALK_IN">Walk In</SelectItem>
                  <SelectItem value="REFERRAL">Referral</SelectItem>
                  <SelectItem value="WEBSITE">Website</SelectItem>
                  <SelectItem value="PHONE">Phone</SelectItem>
                  <SelectItem value="SOCIAL_MEDIA">Social Media</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Area</Label>
              <Select value={locationId || "none"} onValueChange={(v) => setLocationId(v === "none" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select area" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {locations
                    .filter((l) => l.type === "AREA")
                    .map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.name}
                      </SelectItem>
                    ))}
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
              rows={2}
              placeholder="Any additional notes..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : editData ? "Update Lead" : "Add Lead"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

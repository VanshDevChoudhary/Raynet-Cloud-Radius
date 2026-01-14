"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { toast } from "sonner";

interface PortalTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  status: string;
  priority: string;
  category: string;
  createdAt: string;
}

const statusColor: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-800",
  ASSIGNED: "bg-purple-100 text-purple-800",
  IN_PROGRESS: "bg-amber-100 text-amber-800",
  RESOLVED: "bg-green-100 text-green-800",
  CLOSED: "bg-gray-100 text-gray-800",
};

export function PortalComplaintsClient({
  tickets,
  subscriberId,
  tenantId,
}: {
  tickets: {
    data: PortalTicket[];
    total: number;
  };
  subscriberId: string;
  tenantId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("CONNECTIVITY");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) {
      toast.error("Subject is required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/portal/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, description, category }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Complaint submitted");
        setOpen(false);
        setSubject("");
        setDescription("");
        router.refresh();
      } else {
        toast.error(data.error || "Failed to submit");
      }
    } catch {
      toast.error("Failed to submit complaint");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Complaints</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-1 h-4 w-4" />
              New
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>New Complaint</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CONNECTIVITY">Connectivity</SelectItem>
                    <SelectItem value="BILLING">Billing</SelectItem>
                    <SelectItem value="SPEED">Speed</SelectItem>
                    <SelectItem value="INSTALLATION">Installation</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Brief description of the issue"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Details</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your issue in detail"
                  rows={4}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Submitting..." : "Submit Complaint"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {tickets.data.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
          No complaints found
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.data.map((ticket) => (
            <div
              key={ticket.id}
              className="rounded-lg border border-border bg-card p-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-foreground">{ticket.subject}</p>
                  <p className="text-xs text-muted-foreground">
                    {ticket.ticketNumber} &middot; {ticket.category}
                  </p>
                </div>
                <Badge
                  className={statusColor[ticket.status] ?? ""}
                  variant="outline"
                >
                  {ticket.status.replace("_", " ")}
                </Badge>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {format(new Date(ticket.createdAt), "dd MMM yyyy, HH:mm")}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

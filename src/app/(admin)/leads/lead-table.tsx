"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  ArrowRight,
  UserPlus as UserPlusIcon,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import Link from "next/link";
import { LeadForm } from "./lead-form";
import { deleteLead, updateLeadStatus } from "./actions";

interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  locationId: string | null;
  source: string;
  status: string;
  notes: string | null;
  convertedToId: string | null;
  createdAt: Date;
  location: { id: string; name: string } | null;
}

interface Location {
  id: string;
  name: string;
  type: string;
}

interface LeadTableProps {
  leads: Lead[];
  locations: Location[];
  meta: { total: number; page: number; pageSize: number; totalPages: number };
}

const statusColors: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-700",
  CONTACTED: "bg-amber-100 text-amber-700",
  SITE_SURVEY: "bg-purple-100 text-purple-700",
  INSTALLATION_SCHEDULED: "bg-orange-100 text-orange-700",
  CONVERTED: "bg-green-100 text-green-700",
  LOST: "bg-red-100 text-red-700",
};

const statusLabels: Record<string, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  SITE_SURVEY: "Site Survey",
  INSTALLATION_SCHEDULED: "Installation Scheduled",
  CONVERTED: "Converted",
  LOST: "Lost",
};

const sourceLabels: Record<string, string> = {
  WALK_IN: "Walk In",
  REFERRAL: "Referral",
  WEBSITE: "Website",
  PHONE: "Phone",
  SOCIAL_MEDIA: "Social Media",
  OTHER: "Other",
};

const nextStatus: Record<string, string> = {
  NEW: "CONTACTED",
  CONTACTED: "SITE_SURVEY",
  SITE_SURVEY: "INSTALLATION_SCHEDULED",
  INSTALLATION_SCHEDULED: "CONVERTED",
};

export function LeadTable({ leads, locations, meta }: LeadTableProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editData, setEditData] = useState<Lead | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = leads.filter((l) => {
    if (statusFilter !== "all" && l.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        l.name.toLowerCase().includes(q) ||
        l.phone.includes(q) ||
        l.email?.toLowerCase().includes(q) ||
        false
      );
    }
    return true;
  });

  const handleDelete = async () => {
    if (!deleteId) return;
    const result = await deleteLead(deleteId);
    if (result.success) {
      toast.success("Lead deleted");
    } else {
      toast.error(result.error || "Failed to delete");
    }
    setDeleteId(null);
  };

  const handleAdvanceStatus = async (leadId: string, currentStatus: string) => {
    const next = nextStatus[currentStatus];
    if (!next) return;

    if (next === "CONVERTED") {
      // Redirect to subscriber creation with pre-filled data
      const lead = leads.find((l) => l.id === leadId);
      if (lead) {
        const params = new URLSearchParams({
          fromLead: leadId,
          name: lead.name,
          phone: lead.phone,
          ...(lead.email && { email: lead.email }),
          ...(lead.address && { address: lead.address }),
          ...(lead.locationId && { locationId: lead.locationId }),
        });
        window.location.href = `/subscribers?newFromLead=${leadId}&${params.toString()}`;
        return;
      }
    }

    const result = await updateLeadStatus(leadId, next);
    if (result.success) {
      toast.success(`Status updated to ${statusLabels[next]}`);
    } else {
      toast.error(result.error || "Failed to update");
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-4">
        <Input
          placeholder="Search leads..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="NEW">New</SelectItem>
            <SelectItem value="CONTACTED">Contacted</SelectItem>
            <SelectItem value="SITE_SURVEY">Site Survey</SelectItem>
            <SelectItem value="INSTALLATION_SCHEDULED">Scheduled</SelectItem>
            <SelectItem value="CONVERTED">Converted</SelectItem>
            <SelectItem value="LOST">Lost</SelectItem>
          </SelectContent>
        </Select>
        <div className="ml-auto">
          <Button onClick={() => { setEditData(null); setCreateOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Lead
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card p-12 text-center">
          <h3 className="text-lg font-medium">No leads found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {meta.total === 0 ? "Start tracking potential subscribers." : "Try adjusting your filters."}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-3 text-left font-medium">Name</th>
                <th className="p-3 text-left font-medium">Contact</th>
                <th className="p-3 text-left font-medium">Source</th>
                <th className="p-3 text-left font-medium">Area</th>
                <th className="p-3 text-left font-medium">Status</th>
                <th className="p-3 text-left font-medium">Created</th>
                <th className="p-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead) => (
                <tr key={lead.id} className="border-b last:border-0">
                  <td className="p-3 font-medium">{lead.name}</td>
                  <td className="p-3">
                    <p>{lead.phone}</p>
                    {lead.email && (
                      <p className="text-xs text-muted-foreground">{lead.email}</p>
                    )}
                  </td>
                  <td className="p-3">
                    <Badge variant="outline" className="text-xs">
                      {sourceLabels[lead.source] || lead.source}
                    </Badge>
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {lead.location?.name || "-"}
                  </td>
                  <td className="p-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[lead.status]}`}>
                      {statusLabels[lead.status] || lead.status}
                    </span>
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {format(new Date(lead.createdAt), "dd MMM yyyy")}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {nextStatus[lead.status] && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAdvanceStatus(lead.id, lead.status)}
                          title={`Move to ${statusLabels[nextStatus[lead.status]]}`}
                        >
                          {nextStatus[lead.status] === "CONVERTED" ? (
                            <><UserPlusIcon className="mr-1 h-3 w-3" /> Convert</>
                          ) : (
                            <><ArrowRight className="mr-1 h-3 w-3" /> Next</>
                          )}
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setEditData(lead); setCreateOpen(true); }}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          {lead.status !== "CONVERTED" && lead.status !== "LOST" && (
                            <DropdownMenuItem onClick={() => updateLeadStatus(lead.id, "LOST").then(r => {
                              if (r.success) toast.success("Lead marked as lost");
                              else toast.error(r.error || "Failed");
                            })}>
                              <Trash2 className="mr-2 h-4 w-4" /> Mark as Lost
                            </DropdownMenuItem>
                          )}
                          {lead.convertedToId && (
                            <DropdownMenuItem asChild>
                              <Link href={`/subscribers/${lead.convertedToId}`}>
                                <UserPlusIcon className="mr-2 h-4 w-4" /> View Subscriber
                              </Link>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeleteId(lead.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <LeadForm
        open={createOpen}
        onOpenChange={(open) => { setCreateOpen(open); if (!open) setEditData(null); }}
        locations={locations}
        editData={editData}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lead?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this lead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

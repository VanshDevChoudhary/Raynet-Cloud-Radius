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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import Link from "next/link";
import { TicketForm } from "./ticket-form";
import { deleteTicket, updateTicket } from "./actions";

interface Ticket {
  id: string;
  ticketNumber: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  createdAt: Date;
  subscriber: { id: string; name: string; phone: string } | null;
  assignedTo: { id: string; name: string } | null;
  _count: { comments: number };
}

interface TicketTableProps {
  tickets: Ticket[];
  staff: Array<{ id: string; name: string; email: string; role: string }>;
  subscribers: Array<{ id: string; name: string; phone: string }>;
  meta: { total: number; page: number; pageSize: number; totalPages: number };
}

const priorityColors: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-700",
  MEDIUM: "bg-blue-100 text-blue-700",
  HIGH: "bg-orange-100 text-orange-700",
  CRITICAL: "bg-red-100 text-red-700",
};

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  OPEN: "destructive",
  ASSIGNED: "secondary",
  IN_PROGRESS: "default",
  RESOLVED: "outline",
  CLOSED: "outline",
};

export function TicketTable({ tickets, staff, subscribers, meta }: TicketTableProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const filtered = tickets.filter((t) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        t.ticketNumber.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        t.subscriber?.name.toLowerCase().includes(q) ||
        false
      );
    }
    return true;
  });

  const handleDelete = async () => {
    if (!deleteId) return;
    const result = await deleteTicket(deleteId);
    if (result.success) {
      toast.success("Ticket deleted");
    } else {
      toast.error(result.error || "Failed to delete");
    }
    setDeleteId(null);
  };

  const handleStatusChange = async (ticketId: string, status: string) => {
    const result = await updateTicket(ticketId, { status });
    if (result.success) {
      toast.success(`Ticket marked as ${status.toLowerCase().replace("_", " ")}`);
    } else {
      toast.error(result.error || "Failed to update status");
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-4">
        <Input
          placeholder="Search tickets..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="OPEN">Open</SelectItem>
            <SelectItem value="ASSIGNED">Assigned</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="RESOLVED">Resolved</SelectItem>
            <SelectItem value="CLOSED">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="CRITICAL">Critical</SelectItem>
          </SelectContent>
        </Select>
        <div className="ml-auto">
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Ticket
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card p-12 text-center">
          <h3 className="text-lg font-medium">No tickets found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {meta.total === 0 ? "No support tickets yet." : "Try adjusting your filters."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((ticket) => (
            <div
              key={ticket.id}
              className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/50"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/complaints/${ticket.id}`}
                    className="font-medium hover:underline"
                  >
                    {ticket.ticketNumber}
                  </Link>
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${priorityColors[ticket.priority]}`}
                  >
                    {ticket.priority}
                  </span>
                  <Badge variant={statusVariant[ticket.status]}>
                    {ticket.status.replace("_", " ")}
                  </Badge>
                </div>
                <Link
                  href={`/complaints/${ticket.id}`}
                  className="mt-0.5 block text-sm text-muted-foreground hover:text-foreground"
                >
                  {ticket.subject}
                </Link>
                <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                  {ticket.subscriber && (
                    <span>{ticket.subscriber.name}</span>
                  )}
                  <span>·</span>
                  <span>{format(new Date(ticket.createdAt), "dd MMM yyyy HH:mm")}</span>
                  {ticket.assignedTo && (
                    <>
                      <span>·</span>
                      <span>Assigned to {ticket.assignedTo.name}</span>
                    </>
                  )}
                  {ticket._count.comments > 0 && (
                    <>
                      <span>·</span>
                      <span>{ticket._count.comments} comment{ticket._count.comments > 1 ? "s" : ""}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1">
                {ticket.status === "OPEN" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleStatusChange(ticket.id, "IN_PROGRESS")}
                  >
                    Start
                  </Button>
                )}
                {ticket.status === "IN_PROGRESS" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleStatusChange(ticket.id, "RESOLVED")}
                  >
                    Resolve
                  </Button>
                )}
                {ticket.status === "RESOLVED" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleStatusChange(ticket.id, "CLOSED")}
                  >
                    Close
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => setDeleteId(ticket.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <TicketForm
        open={createOpen}
        onOpenChange={setCreateOpen}
        staff={staff}
        subscribers={subscribers}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Ticket?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the ticket and all its comments.
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

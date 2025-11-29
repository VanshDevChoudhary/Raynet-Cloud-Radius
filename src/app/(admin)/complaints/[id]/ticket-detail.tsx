"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import { updateTicket, addComment } from "../actions";
import Link from "next/link";

interface Comment {
  id: string;
  message: string;
  isInternal: boolean;
  createdAt: Date;
  user: { id: string; name: string; role: string };
}

interface TicketData {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  resolvedAt: Date | null;
  closedAt: Date | null;
  createdAt: Date;
  subscriber: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    username: string;
    plan: { name: string } | null;
    location: { name: string } | null;
  } | null;
  assignedTo: { id: string; name: string; email: string } | null;
  comments: Comment[];
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

interface TicketDetailProps {
  ticket: TicketData;
  staff: Array<{ id: string; name: string; email: string; role: string }>;
}

export function TicketDetail({ ticket, staff }: TicketDetailProps) {
  const [commentText, setCommentText] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    setLoading(true);

    try {
      const result = await addComment(ticket.id, {
        message: commentText.trim(),
        isInternal,
      });

      if (result.success) {
        toast.success("Comment added");
        setCommentText("");
        setIsInternal(false);
      } else {
        toast.error(result.error || "Failed to add comment");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    const result = await updateTicket(ticket.id, { status });
    if (result.success) {
      toast.success(`Status updated to ${status.toLowerCase().replace("_", " ")}`);
    } else {
      toast.error(result.error || "Failed to update");
    }
  };

  const handleAssignChange = async (assignedToId: string) => {
    const result = await updateTicket(ticket.id, {
      assignedToId: assignedToId || null,
      status: assignedToId ? "ASSIGNED" : ticket.status,
    });
    if (result.success) {
      toast.success(assignedToId ? "Ticket assigned" : "Ticket unassigned");
    } else {
      toast.error(result.error || "Failed to assign");
    }
  };

  const handlePriorityChange = async (priority: string) => {
    const result = await updateTicket(ticket.id, { priority });
    if (result.success) {
      toast.success("Priority updated");
    } else {
      toast.error(result.error || "Failed to update");
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Main content */}
      <div className="space-y-6 lg:col-span-2">
        {/* Ticket header */}
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">{ticket.ticketNumber}</h1>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${priorityColors[ticket.priority]}`}>
                  {ticket.priority}
                </span>
                <Badge variant={statusVariant[ticket.status]}>
                  {ticket.status.replace("_", " ")}
                </Badge>
              </div>
              <h2 className="mt-1 text-lg">{ticket.subject}</h2>
            </div>
          </div>

          <div className="mt-4 whitespace-pre-wrap text-sm text-muted-foreground">
            {ticket.description}
          </div>

          <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
            <span>Created {format(new Date(ticket.createdAt), "dd MMM yyyy HH:mm")}</span>
            {ticket.resolvedAt && (
              <span>Resolved {format(new Date(ticket.resolvedAt), "dd MMM yyyy HH:mm")}</span>
            )}
            {ticket.closedAt && (
              <span>Closed {format(new Date(ticket.closedAt), "dd MMM yyyy HH:mm")}</span>
            )}
          </div>
        </div>

        {/* Comments */}
        <div className="space-y-4">
          <h3 className="font-semibold">Comments ({ticket.comments.length})</h3>

          {ticket.comments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No comments yet.</p>
          ) : (
            <div className="space-y-3">
              {ticket.comments.map((comment) => (
                <div
                  key={comment.id}
                  className={`rounded-lg border p-4 ${
                    comment.isInternal
                      ? "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950"
                      : "border-border bg-card"
                  }`}
                >
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">{comment.user.name}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {comment.user.role}
                    </Badge>
                    {comment.isInternal && (
                      <Badge variant="secondary" className="text-[10px]">
                        Internal Note
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(comment.createdAt), "dd MMM yyyy HH:mm")}
                    </span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm">{comment.message}</p>
                </div>
              ))}
            </div>
          )}

          {/* Add comment */}
          {ticket.status !== "CLOSED" && (
            <div className="space-y-3 rounded-lg border border-border bg-card p-4">
              <Textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                rows={3}
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    id="internal"
                    checked={isInternal}
                    onCheckedChange={setIsInternal}
                  />
                  <Label htmlFor="internal" className="text-sm">
                    Internal note (not visible to subscriber)
                  </Label>
                </div>
                <Button onClick={handleAddComment} disabled={loading || !commentText.trim()}>
                  {loading ? "Adding..." : "Add Comment"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        {/* Status controls */}
        <div className="rounded-lg border border-border bg-card p-4 space-y-4">
          <h3 className="font-semibold text-sm">Actions</h3>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Status</Label>
            <Select value={ticket.status} onValueChange={handleStatusChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="ASSIGNED">Assigned</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Priority</Label>
            <Select value={ticket.priority} onValueChange={handlePriorityChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Assigned To</Label>
            <Select
              value={ticket.assignedTo?.id || "__unassigned__"}
              onValueChange={(val) =>
                handleAssignChange(val === "__unassigned__" ? "" : val)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__unassigned__">Unassigned</SelectItem>
                {staff.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Category</Label>
            <Badge variant="outline">{ticket.category}</Badge>
          </div>
        </div>

        {/* Subscriber info */}
        {ticket.subscriber && (
          <div className="rounded-lg border border-border bg-card p-4 space-y-3">
            <h3 className="font-semibold text-sm">Subscriber</h3>
            <div className="space-y-1 text-sm">
              <p className="font-medium">
                <Link href={`/subscribers/${ticket.subscriber.id}`} className="hover:underline">
                  {ticket.subscriber.name}
                </Link>
              </p>
              <p className="text-muted-foreground">{ticket.subscriber.phone}</p>
              {ticket.subscriber.email && (
                <p className="text-muted-foreground">{ticket.subscriber.email}</p>
              )}
              <p className="text-muted-foreground">@{ticket.subscriber.username}</p>
              {ticket.subscriber.plan && (
                <p className="text-muted-foreground">Plan: {ticket.subscriber.plan.name}</p>
              )}
              {ticket.subscriber.location && (
                <p className="text-muted-foreground">Area: {ticket.subscriber.location.name}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { createTenantSchema, updateTenantSchema, type CreateTenantInput, type UpdateTenantInput } from "@/lib/validations/user.schema";
import { createTenant, updateTenant, suspendTenant, activateTenant } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Ban, CheckCircle2, Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import type { TenantStatus, PlanTier } from "@/generated/prisma";

interface TenantWithStats {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  status: TenantStatus;
  planTier: PlanTier;
  createdAt: string;
  _count: {
    subscribers: number;
    users: number;
  };
}

interface TenantListProps {
  tenants: TenantWithStats[];
}

function StatusBadge({ status }: { status: TenantStatus }) {
  switch (status) {
    case "ACTIVE":
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>;
    case "TRIAL":
      return <Badge variant="secondary">Trial</Badge>;
    case "SUSPENDED":
      return <Badge variant="destructive">Suspended</Badge>;
    case "INACTIVE":
      return <Badge variant="outline">Inactive</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function TierBadge({ tier }: { tier: PlanTier }) {
  switch (tier) {
    case "STARTER":
      return <Badge variant="outline">Starter</Badge>;
    case "GROWTH":
      return <Badge variant="secondary">Growth</Badge>;
    case "PROFESSIONAL":
      return <Badge>Professional</Badge>;
    case "ENTERPRISE":
      return <Badge className="bg-purple-600 text-white hover:bg-purple-700">Enterprise</Badge>;
    default:
      return <Badge variant="outline">{tier}</Badge>;
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function TenantList({ tenants }: TenantListProps) {
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<TenantWithStats | null>(null);
  const [isPending, startTransition] = useTransition();
  const [actionPending, setActionPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const form = useForm<CreateTenantInput>({
    resolver: zodResolver(createTenantSchema),
    defaultValues: {
      name: "",
      slug: "",
      domain: "",
      planTier: "STARTER",
      adminName: "",
      adminEmail: "",
      adminPassword: "",
    },
  });

  const editForm = useForm<UpdateTenantInput>({
    resolver: zodResolver(updateTenantSchema),
  });

  function onSubmit(data: CreateTenantInput) {
    setError(null);
    startTransition(async () => {
      const result = await createTenant(data);
      if (result.success) {
        setOpen(false);
        form.reset();
        router.refresh();
      } else {
        setError(result.error ?? "Failed to create tenant");
      }
    });
  }

  function handleEdit(tenant: TenantWithStats) {
    setEditingTenant(tenant);
    editForm.reset({
      name: tenant.name,
      domain: tenant.domain ?? "",
      planTier: tenant.planTier,
      status: tenant.status,
      maxOnline: undefined,
    });
    setEditOpen(true);
  }

  function onEditSubmit(data: UpdateTenantInput) {
    if (!editingTenant) return;
    setError(null);
    startTransition(async () => {
      const result = await updateTenant(editingTenant.id, data);
      if (result.success) {
        setEditOpen(false);
        setEditingTenant(null);
        toast.success("Tenant updated");
        router.refresh();
      } else {
        setError(result.error ?? "Failed to update tenant");
      }
    });
  }

  function handleSuspend(id: string) {
    setActionPending(id);
    startTransition(async () => {
      const result = await suspendTenant(id);
      setActionPending(null);
      if (!result.success) {
        setError(result.error ?? "Failed to suspend tenant");
      } else {
        router.refresh();
      }
    });
  }

  function handleActivate(id: string) {
    setActionPending(id);
    startTransition(async () => {
      const result = await activateTenant(id);
      setActionPending(null);
      if (!result.success) {
        setError(result.error ?? "Failed to activate tenant");
      } else {
        router.refresh();
      }
    });
  }

  // Auto-generate slug from name
  function handleNameChange(value: string) {
    form.setValue("name", value);
    const slug = value
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
    form.setValue("slug", slug);
  }

  return (
    <div className="space-y-4">
      {/* Error message */}
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 font-medium underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Create Tenant Dialog */}
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Tenant
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Tenant</DialogTitle>
              <DialogDescription>
                Set up a new ISP operator account with an admin user.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Tenant Details */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Tenant Details
                </h4>
                <div className="space-y-2">
                  <Label htmlFor="name">Tenant Name</Label>
                  <Input
                    id="name"
                    placeholder="My ISP Company"
                    {...form.register("name")}
                    onChange={(e) => handleNameChange(e.target.value)}
                  />
                  {form.formState.errors.name && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    placeholder="my-isp-company"
                    {...form.register("slug")}
                  />
                  {form.formState.errors.slug && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.slug.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="domain">Domain (optional)</Label>
                  <Input
                    id="domain"
                    placeholder="isp.example.com"
                    {...form.register("domain")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="planTier">Plan Tier</Label>
                  <Select
                    value={form.watch("planTier")}
                    onValueChange={(value) =>
                      form.setValue("planTier", value as CreateTenantInput["planTier"])
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select tier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STARTER">Starter</SelectItem>
                      <SelectItem value="GROWTH">Growth</SelectItem>
                      <SelectItem value="PROFESSIONAL">Professional</SelectItem>
                      <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Admin User */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Admin User
                </h4>
                <div className="space-y-2">
                  <Label htmlFor="adminName">Admin Name</Label>
                  <Input
                    id="adminName"
                    placeholder="John Doe"
                    {...form.register("adminName")}
                  />
                  {form.formState.errors.adminName && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.adminName.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminEmail">Admin Email</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    placeholder="admin@isp.example.com"
                    {...form.register("adminEmail")}
                  />
                  {form.formState.errors.adminEmail && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.adminEmail.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminPassword">Admin Password</Label>
                  <Input
                    id="adminPassword"
                    type="password"
                    placeholder="Min 6 characters"
                    {...form.register("adminPassword")}
                  />
                  {form.formState.errors.adminPassword && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.adminPassword.message}
                    </p>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Tenant
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Tenant Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Tenant</DialogTitle>
            <DialogDescription>
              Update tenant details for {editingTenant?.name}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
            {error && editOpen && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Tenant Name</Label>
                <Input
                  id="edit-name"
                  {...editForm.register("name")}
                />
                {editForm.formState.errors.name && (
                  <p className="text-xs text-destructive">
                    {editForm.formState.errors.name.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input value={editingTenant?.slug ?? ""} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">Slug cannot be changed after creation.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-domain">Domain (optional)</Label>
                <Input
                  id="edit-domain"
                  placeholder="isp.example.com"
                  {...editForm.register("domain")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-planTier">Plan Tier</Label>
                <Select
                  value={editForm.watch("planTier") ?? editingTenant?.planTier}
                  onValueChange={(value) =>
                    editForm.setValue("planTier", value as UpdateTenantInput["planTier"])
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STARTER">Starter</SelectItem>
                    <SelectItem value="GROWTH">Growth</SelectItem>
                    <SelectItem value="PROFESSIONAL">Professional</SelectItem>
                    <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={editForm.watch("status") ?? editingTenant?.status}
                  onValueChange={(value) =>
                    editForm.setValue("status", value as UpdateTenantInput["status"])
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="TRIAL">Trial</SelectItem>
                    <SelectItem value="SUSPENDED">Suspended</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-maxOnline">Max Online Users</Label>
                <Input
                  id="edit-maxOnline"
                  type="number"
                  min={1}
                  placeholder="e.g. 100"
                  {...editForm.register("maxOnline")}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Tenants Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead className="text-right">Subscribers</TableHead>
              <TableHead className="text-right">Users</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                  No tenants found. Create your first tenant to get started.
                </TableCell>
              </TableRow>
            ) : (
              tenants.map((tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell className="font-medium">{tenant.name}</TableCell>
                  <TableCell>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                      {tenant.slug}
                    </code>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={tenant.status} />
                  </TableCell>
                  <TableCell>
                    <TierBadge tier={tenant.planTier} />
                  </TableCell>
                  <TableCell className="text-right">
                    {tenant._count.subscribers}
                  </TableCell>
                  <TableCell className="text-right">
                    {tenant._count.users}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(tenant.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(tenant)}
                        title="Edit tenant"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {tenant.status === "SUSPENDED" ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleActivate(tenant.id)}
                          disabled={actionPending === tenant.id}
                          title="Activate tenant"
                        >
                          {actionPending === tenant.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          )}
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSuspend(tenant.id)}
                          disabled={actionPending === tenant.id}
                          title="Suspend tenant"
                        >
                          {actionPending === tenant.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Ban className="h-4 w-4 text-destructive" />
                          )}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

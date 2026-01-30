"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { toast } from "sonner";
import { createUser, updateUser, activateUser, deactivateUser } from "./actions";
import {
  createUserSchema,
  updateUserSchema,
  type CreateUserInput,
  type UpdateUserInput,
} from "@/lib/validations/user.schema";
import { ROLE_LABELS, ASSIGNABLE_ROLES } from "@/lib/rbac";
import {
  Users,
  UserCheck,
  Shield,
  UserPlus,
  Pencil,
  UserX,
  UserCheck2,
} from "lucide-react";
import type { UserRole, UserStatus, LocationType } from "@/generated/prisma";

// ---- Types ----

interface UserData {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  locationId: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  location: {
    id: string;
    name: string;
    type: LocationType;
  } | null;
}

interface LocationData {
  id: string;
  name: string;
  type: LocationType;
}

interface UserManagementProps {
  users: UserData[];
  locations: LocationData[];
  currentUserRole: UserRole;
}

// ---- Helpers ----

const ROLE_BADGE_CLASSES: Record<string, string> = {
  TENANT_ADMIN: "bg-primary text-primary-foreground",
  MANAGER: "bg-blue-100 text-blue-800 border-blue-200",
  STAFF: "bg-secondary text-secondary-foreground",
  COLLECTOR: "border border-input bg-background text-foreground",
  FRANCHISE: "border border-input bg-background text-foreground",
};

const STATUS_VARIANT: Record<UserStatus, "default" | "secondary" | "destructive"> = {
  ACTIVE: "default",
  INACTIVE: "secondary",
  SUSPENDED: "destructive",
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "Never";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ---- Component ----

export function UserManagement({
  users,
  locations,
  currentUserRole,
}: UserManagementProps) {
  const router = useRouter();

  // Dialog state
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);

  // Stats
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.status === "ACTIVE").length;
  const adminCount = users.filter((u) => u.role === "TENANT_ADMIN").length;
  const staffCount = users.filter(
    (u) => u.role === "STAFF" || u.role === "MANAGER"
  ).length;

  // ---- Invite Form (React Hook Form + Zod) ----

  const inviteForm = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      role: "STAFF",
      locationId: "",
    },
  });

  // ---- Edit Form (React Hook Form + Zod) ----

  const editForm = useForm<UpdateUserInput>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      name: "",
      phone: "",
      role: undefined,
      status: undefined,
      locationId: null,
    },
  });

  useEffect(() => {
    if (selectedUser && editOpen) {
      editForm.reset({
        name: selectedUser.name,
        phone: selectedUser.phone || "",
        role: selectedUser.role as UpdateUserInput["role"],
        status: selectedUser.status as UpdateUserInput["status"],
        locationId: selectedUser.locationId || null,
      });
    }
  }, [selectedUser, editOpen, editForm]);

  // ---- Handlers ----

  const handleInviteSubmit = async (data: CreateUserInput) => {
    setLoading(true);
    try {
      const result = await createUser(data);
      if (result.success) {
        toast.success("User created successfully");
        setInviteOpen(false);
        inviteForm.reset();
        router.refresh();
      } else {
        toast.error(result.error || "Failed to create user");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (data: UpdateUserInput) => {
    if (!selectedUser) return;
    setLoading(true);
    try {
      const result = await updateUser(selectedUser.id, data);
      if (result.success) {
        toast.success("User updated successfully");
        setEditOpen(false);
        setSelectedUser(null);
        router.refresh();
      } else {
        toast.error(result.error || "Failed to update user");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (!selectedUser) return;
    setLoading(true);
    try {
      const result = await deactivateUser(selectedUser.id);
      if (result.success) {
        toast.success("User deactivated successfully");
        setDeactivateOpen(false);
        setSelectedUser(null);
        router.refresh();
      } else {
        toast.error(result.error || "Failed to deactivate user");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (u: UserData) => {
    try {
      const result = await activateUser(u.id);
      if (result.success) {
        toast.success(`${u.name} activated successfully`);
        router.refresh();
      } else {
        toast.error(result.error || "Failed to activate user");
      }
    } catch {
      toast.error("An unexpected error occurred");
    }
  };

  const openEdit = (u: UserData) => {
    setSelectedUser(u);
    setEditOpen(true);
  };

  const openDeactivate = (u: UserData) => {
    setSelectedUser(u);
    setDeactivateOpen(true);
  };

  // ---- Render ----

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Staff / Managers
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staffCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {totalUsers} user{totalUsers !== 1 ? "s" : ""} in your organization
        </p>
        <Button onClick={() => setInviteOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Invite User
        </Button>
      </div>

      {/* Users Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Badge
                      className={ROLE_BADGE_CLASSES[u.role] || ""}
                      variant={
                        u.role === "COLLECTOR" || u.role === "FRANCHISE"
                          ? "outline"
                          : u.role === "STAFF"
                            ? "secondary"
                            : "default"
                      }
                    >
                      {ROLE_LABELS[u.role] || u.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {u.location ? u.location.name : (
                      <span className="text-muted-foreground">--</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[u.status]}>
                      {u.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(u.lastLoginAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(u)}
                        title="Edit user"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {u.status === "ACTIVE" ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeactivate(u)}
                          title="Deactivate user"
                        >
                          <UserX className="h-4 w-4 text-destructive" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleActivate(u)}
                          title="Activate user"
                        >
                          <UserCheck2 className="h-4 w-4 text-green-600" />
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

      {/* ---- Invite User Dialog ---- */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Invite User</DialogTitle>
            <DialogDescription>
              Add a new team member to your organization.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={inviteForm.handleSubmit(handleInviteSubmit)}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="invite-name">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="invite-name"
                  {...inviteForm.register("name")}
                  placeholder="John Doe"
                />
                {inviteForm.formState.errors.name && (
                  <p className="text-sm text-destructive">
                    {inviteForm.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="invite-email">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="invite-email"
                  type="email"
                  {...inviteForm.register("email")}
                  placeholder="john@example.com"
                />
                {inviteForm.formState.errors.email && (
                  <p className="text-sm text-destructive">
                    {inviteForm.formState.errors.email.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="invite-phone">Phone</Label>
                <Input
                  id="invite-phone"
                  {...inviteForm.register("phone")}
                  placeholder="+919876543210"
                />
                {inviteForm.formState.errors.phone && (
                  <p className="text-sm text-destructive">
                    {inviteForm.formState.errors.phone.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="invite-password">
                  Password <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="invite-password"
                  type="password"
                  {...inviteForm.register("password")}
                  placeholder="Min 6 characters"
                />
                {inviteForm.formState.errors.password && (
                  <p className="text-sm text-destructive">
                    {inviteForm.formState.errors.password.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  Role <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={inviteForm.watch("role")}
                  onValueChange={(val) =>
                    inviteForm.setValue(
                      "role",
                      val as CreateUserInput["role"]
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSIGNABLE_ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {inviteForm.formState.errors.role && (
                  <p className="text-sm text-destructive">
                    {inviteForm.formState.errors.role.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Location</Label>
                <Select
                  value={inviteForm.watch("locationId") || "none"}
                  onValueChange={(val) =>
                    inviteForm.setValue(
                      "locationId",
                      val === "none" ? "" : val
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No location</SelectItem>
                    {locations.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {loc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setInviteOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create User"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ---- Edit User Dialog ---- */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update {selectedUser?.name}&apos;s details.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={editForm.handleSubmit(handleEditSubmit)}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  {...editForm.register("name")}
                />
                {editForm.formState.errors.name && (
                  <p className="text-sm text-destructive">
                    {editForm.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  {...editForm.register("phone")}
                />
                {editForm.formState.errors.phone && (
                  <p className="text-sm text-destructive">
                    {editForm.formState.errors.phone.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={editForm.watch("role") || selectedUser?.role}
                  onValueChange={(val) =>
                    editForm.setValue(
                      "role",
                      val as UpdateUserInput["role"]
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSIGNABLE_ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={editForm.watch("status") || selectedUser?.status}
                  onValueChange={(val) =>
                    editForm.setValue(
                      "status",
                      val as UpdateUserInput["status"]
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="SUSPENDED">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Location</Label>
              <Select
                value={editForm.watch("locationId") ?? "none"}
                onValueChange={(val) =>
                  editForm.setValue(
                    "locationId",
                    val === "none" ? null : val
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No location</SelectItem>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ---- Deactivate Confirmation ---- */}
      <AlertDialog open={deactivateOpen} onOpenChange={setDeactivateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate{" "}
              <strong>{selectedUser?.name}</strong>? They will no longer be able
              to log in. This action can be reversed by changing their status
              back to Active.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivate}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={loading}
            >
              {loading ? "Deactivating..." : "Deactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

"use client";

import { useState, useTransition, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { Subscriber, Plan, NasDevice, Location } from "@/generated/prisma";
import type { SubscriberStatus } from "@/generated/prisma";
import type { Serialized } from "@/lib/types";
import { DataTable } from "@/components/tables/data-table";
import { getSubscriberColumns } from "./columns";
import { SubscriberForm } from "./subscriber-form";
import { deleteSubscriber, updateSubscriberStatus } from "./actions";
import { Button } from "@/components/ui/button";
import { Plus, Download, Upload } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

type SubscriberWithRelations = Serialized<Subscriber & {
  plan: Pick<Plan, "id" | "name" | "downloadSpeed" | "uploadSpeed" | "speedUnit"> | null;
  nasDevice: Pick<NasDevice, "id" | "name" | "nasIp"> | null;
  location: Pick<Location, "id" | "name" | "type"> | null;
}>;

interface SubscriberTableProps {
  data: SubscriberWithRelations[];
  plans: Serialized<Plan>[];
  nasDevices: NasDevice[];
  locations: Location[];
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}

export interface LeadPrefill {
  fromLeadId: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  locationId?: string;
}

export function SubscriberTable({
  data,
  plans,
  nasDevices,
  locations,
  canCreate = true,
  canEdit = true,
  canDelete = true,
}: SubscriberTableProps) {
  const [editSubscriber, setEditSubscriber] = useState<SubscriberWithRelations | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [leadPrefill, setLeadPrefill] = useState<LeadPrefill | null>(null);
  const [, startTransition] = useTransition();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Auto-open form with lead data when redirected from lead conversion
  useEffect(() => {
    const fromLead = searchParams.get("newFromLead");
    if (fromLead) {
      setLeadPrefill({
        fromLeadId: fromLead,
        name: searchParams.get("name") || "",
        phone: searchParams.get("phone") || "",
        email: searchParams.get("email") || undefined,
        address: searchParams.get("address") || undefined,
        locationId: searchParams.get("locationId") || undefined,
      });
      setEditSubscriber(null);
      setShowForm(true);
      // Clean up URL params
      router.replace("/subscribers", { scroll: false });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleEdit = (subscriber: SubscriberWithRelations) => {
    setEditSubscriber(subscriber);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this subscriber?")) return;
    startTransition(async () => {
      const result = await deleteSubscriber(id);
      if (result.success) {
        toast.success("Subscriber deleted");
      } else {
        toast.error(result.error ?? "Failed to delete");
      }
    });
  };

  const handleStatusChange = (id: string, status: string) => {
    startTransition(async () => {
      const result = await updateSubscriberStatus(id, status as SubscriberStatus);
      if (result.success) {
        toast.success(`Subscriber ${status.toLowerCase()}`);
      } else {
        toast.error(result.error ?? "Failed to update status");
      }
    });
  };

  const columns = getSubscriberColumns({
    onEdit: canEdit ? handleEdit : undefined,
    onDelete: canDelete ? handleDelete : undefined,
    onStatusChange: canEdit ? handleStatusChange : undefined,
  });

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        searchPlaceholder="Search by name, phone, username..."
        filters={[
          {
            key: "status",
            label: "Status",
            options: [
              { label: "Active", value: "ACTIVE" },
              { label: "Expired", value: "EXPIRED" },
              { label: "Suspended", value: "SUSPENDED" },
              { label: "Disabled", value: "DISABLED" },
              { label: "Trial", value: "TRIAL" },
            ],
          },
          {
            key: "connectionType",
            label: "Connection",
            options: [
              { label: "PPPoE", value: "PPPOE" },
              { label: "Hotspot", value: "HOTSPOT" },
              { label: "Static IP", value: "STATIC_IP" },
              { label: "MAC Bind", value: "MAC_BIND" },
            ],
          },
        ]}
        toolbar={
          <div className="flex items-center gap-2">
            {canCreate && (
              <Button variant="outline" size="sm" asChild title="Import CSV">
                <Link href="/subscribers/import">
                  <Upload className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Import CSV</span>
                </Link>
              </Button>
            )}
            <Button variant="outline" size="sm" asChild title="Export">
              <Link href="/subscribers/export">
                <Download className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Export</span>
              </Link>
            </Button>
            {canCreate && (
              <Button
                size="sm"
                title="Add Subscriber"
                onClick={() => {
                  setEditSubscriber(null);
                  setShowForm(true);
                }}
              >
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Add Subscriber</span>
              </Button>
            )}
          </div>
        }
      />

      <SubscriberForm
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open);
          if (!open) {
            setEditSubscriber(null);
            setLeadPrefill(null);
          }
        }}
        subscriber={editSubscriber}
        plans={plans}
        nasDevices={nasDevices as NasDevice[]}
        locations={locations as Location[]}
        leadPrefill={leadPrefill}
      />
    </>
  );
}

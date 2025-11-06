"use client";

import { useState, useTransition } from "react";
import type { Location } from "@/generated/prisma";
import { DataTable } from "@/components/tables/data-table";
import { getNasColumns, type NasWithLocation } from "./columns";
import { NasForm } from "./nas-form";
import { deleteNasDevice } from "./actions";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";

interface NasTableProps {
  data: NasWithLocation[];
  locations: Location[];
}

export function NasTable({ data, locations }: NasTableProps) {
  const [editNas, setEditNas] = useState<NasWithLocation | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [, startTransition] = useTransition();

  const handleEdit = (nas: NasWithLocation) => {
    setEditNas(nas);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this NAS device?")) return;
    startTransition(async () => {
      const result = await deleteNasDevice(id);
      if (result.success) {
        toast.success("NAS device deleted");
      } else {
        toast.error(result.error ?? "Failed to delete");
      }
    });
  };

  const columns = getNasColumns({ onEdit: handleEdit, onDelete: handleDelete });

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        searchPlaceholder="Search NAS devices..."
        filters={[
          {
            key: "status",
            label: "Status",
            options: [
              { label: "Active", value: "ACTIVE" },
              { label: "Inactive", value: "INACTIVE" },
              { label: "Unreachable", value: "UNREACHABLE" },
            ],
          },
          {
            key: "nasType",
            label: "Type",
            options: [
              { label: "MikroTik", value: "MIKROTIK" },
              { label: "Cisco", value: "CISCO" },
              { label: "Ubiquiti", value: "UBIQUITI" },
              { label: "Other", value: "OTHER" },
            ],
          },
        ]}
        toolbar={
          <Button
            size="sm"
            onClick={() => {
              setEditNas(null);
              setShowForm(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Add NAS Device
          </Button>
        }
      />

      <NasForm
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open);
          if (!open) setEditNas(null);
        }}
        nas={editNas}
        locations={locations}
      />
    </>
  );
}

"use client";

import { useState, useTransition } from "react";
import type { Serialized } from "@/lib/types";
import { DataTable } from "@/components/tables/data-table";
import { getPlanColumns, type PlanWithCount } from "./columns";
import { PlanForm } from "./plan-form";
import { togglePlanStatus, deletePlan } from "./actions";
import { Button } from "@/components/ui/button";
import { Plus, Download } from "lucide-react";
import { toast } from "sonner";

interface PlanTableProps {
  data: Serialized<PlanWithCount>[];
}

export function PlanTable({ data }: PlanTableProps) {
  const [editPlan, setEditPlan] = useState<Serialized<PlanWithCount> | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [, startTransition] = useTransition();

  const handleEdit = (plan: Serialized<PlanWithCount>) => {
    setEditPlan(plan);
    setShowForm(true);
  };

  const handleClone = (plan: Serialized<PlanWithCount>) => {
    // Clone by opening form with plan data but no ID
    setEditPlan({ ...plan, id: "", name: `${plan.name} (Copy)` });
    setShowForm(true);
  };

  const handleToggle = (id: string) => {
    startTransition(async () => {
      const result = await togglePlanStatus(id);
      if (result.success) {
        toast.success("Plan status updated");
      } else {
        toast.error(result.error ?? "Failed to update status");
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this plan?")) return;
    startTransition(async () => {
      const result = await deletePlan(id);
      if (result.success) {
        toast.success("Plan deleted");
      } else {
        toast.error(result.error ?? "Failed to delete plan");
      }
    });
  };

  const columns = getPlanColumns({
    onEdit: handleEdit,
    onToggle: handleToggle,
    onDelete: handleDelete,
    onClone: handleClone,
  });

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        searchPlaceholder="Search plans..."
        filters={[
          {
            key: "status",
            label: "Status",
            options: [
              { label: "Active", value: "ACTIVE" },
              { label: "Inactive", value: "INACTIVE" },
            ],
          },
          {
            key: "planType",
            label: "Type",
            options: [
              { label: "PPPoE", value: "PPPOE" },
              { label: "Hotspot", value: "HOTSPOT" },
              { label: "Both", value: "BOTH" },
            ],
          },
          {
            key: "billingType",
            label: "Billing",
            options: [
              { label: "Prepaid", value: "PREPAID" },
              { label: "Postpaid", value: "POSTPAID" },
            ],
          },
        ]}
        toolbar={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setEditPlan(null);
                setShowForm(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" /> Create Plan
            </Button>
          </div>
        }
      />

      <PlanForm
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open);
          if (!open) setEditPlan(null);
        }}
        plan={editPlan}
      />
    </>
  );
}

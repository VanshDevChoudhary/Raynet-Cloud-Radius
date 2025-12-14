"use client";

import { useState, useTransition } from "react";
import type { Location } from "@/generated/prisma";
import { LocationForm } from "./location-form";
import { deleteLocation } from "./actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronRight,
  MapPin,
  Building2,
  Map,
  Plus,
  Pencil,
  Trash2,
  Users,
  Router,
} from "lucide-react";
import { toast } from "sonner";

interface TreeNode {
  id: string;
  name: string;
  type: string;
  parentId: string | null;
  _count: { children: number; subscribers: number; nasDevices: number };
  children: TreeNode[];
}

interface LocationTreeProps {
  tree: TreeNode[];
  allLocations: Location[];
}

export function LocationTree({ tree, allLocations }: LocationTreeProps) {
  const [showForm, setShowForm] = useState(false);
  const [editLocation, setEditLocation] = useState<Location | null>(null);
  const [defaultParentId, setDefaultParentId] = useState<string | null>(null);
  const [defaultType, setDefaultType] = useState<string>("REGION");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setEditLocation(null);
              setDefaultParentId(null);
              setDefaultType("REGION");
              setShowForm(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Region
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        {tree.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-muted-foreground">
            No locations yet. Start by adding a region.
          </div>
        ) : (
          <div className="divide-y">
            {tree.map((node) => (
              <TreeNodeItem
                key={node.id}
                node={node}
                depth={0}
                onEdit={(loc) => {
                  setEditLocation(loc as unknown as Location);
                  setShowForm(true);
                }}
                onAddChild={(parentId, childType) => {
                  setEditLocation(null);
                  setDefaultParentId(parentId);
                  setDefaultType(childType);
                  setShowForm(true);
                }}
              />
            ))}
          </div>
        )}
      </div>

      <LocationForm
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open);
          if (!open) {
            setEditLocation(null);
            setDefaultParentId(null);
          }
        }}
        location={editLocation}
        allLocations={allLocations}
        defaultParentId={defaultParentId}
        defaultType={defaultType}
      />
    </div>
  );
}

function TreeNodeItem({
  node,
  depth,
  onEdit,
  onAddChild,
}: {
  node: TreeNode;
  depth: number;
  onEdit: (loc: TreeNode) => void;
  onAddChild: (parentId: string, childType: string) => void;
}) {
  const [expanded, setExpanded] = useState(depth < 1);
  const [, startTransition] = useTransition();
  const hasChildren = node.children.length > 0;

  const icon =
    node.type === "REGION" ? Map : node.type === "CITY" ? Building2 : MapPin;
  const Icon = icon;
  const childType = node.type === "REGION" ? "CITY" : "AREA";

  const handleDelete = () => {
    if (!confirm(`Delete "${node.name}"?`)) return;
    startTransition(async () => {
      const result = await deleteLocation(node.id);
      if (result.success) {
        toast.success("Location deleted");
      } else {
        toast.error(result.error ?? "Failed to delete");
      }
    });
  };

  return (
    <div>
      <div
        className="flex items-center gap-2 px-4 py-2.5 hover:bg-muted/50"
        style={{ paddingLeft: `${depth * 24 + 16}px` }}
      >
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex h-5 w-5 items-center justify-center"
        >
          {hasChildren ? (
            expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )
          ) : (
            <span className="w-4" />
          )}
        </button>

        <Icon className="h-4 w-4 text-muted-foreground" />

        <span className="font-medium">{node.name}</span>

        <Badge variant="outline" className="text-xs">
          {node.type}
        </Badge>

        {node._count.subscribers > 0 && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3 w-3" /> {node._count.subscribers}
          </span>
        )}

        {node._count.nasDevices > 0 && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Router className="h-3 w-3" /> {node._count.nasDevices}
          </span>
        )}

        <div className="ml-auto flex items-center gap-1">
          {node.type !== "AREA" && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onAddChild(node.id, childType)}
              title={`Add ${childType.toLowerCase()}`}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onEdit(node)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive"
            onClick={handleDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {expanded &&
        hasChildren &&
        node.children.map((child) => (
          <TreeNodeItem
            key={child.id}
            node={child}
            depth={depth + 1}
            onEdit={onEdit}
            onAddChild={onAddChild}
          />
        ))}
    </div>
  );
}

"use client";

import { useState, useCallback, useTransition } from "react";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Upload, FileSpreadsheet, Loader2, Check, X } from "lucide-react";
import Link from "next/link";
import { createSubscriber } from "../actions";
import { toast } from "sonner";

interface ImportClientProps {
  plans: { id: string; name: string }[];
  nasDevices: { id: string; name: string }[];
  locations: { id: string; name: string }[];
}

const REQUIRED_FIELDS = ["name", "phone", "username", "password"] as const;
const OPTIONAL_FIELDS = [
  "email",
  "address",
  "connectionType",
  "subscriberType",
  "macAddress",
  "ipAddress",
  "status",
  "expiryDate",
  "notes",
] as const;
const ALL_FIELDS = [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS];

type FieldMapping = Record<string, string>;

export function ImportClient({ plans, nasDevices, locations }: ImportClientProps) {
  const [csvData, setCsvData] = useState<Record<string, string>[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [fieldMapping, setFieldMapping] = useState<FieldMapping>({});
  const [step, setStep] = useState<"upload" | "map" | "preview" | "importing" | "done">("upload");
  const [importResults, setImportResults] = useState<{ success: number; failed: number }>({
    success: 0,
    failed: 0,
  });
  const [defaultPlanId, setDefaultPlanId] = useState<string>("");
  const [defaultNasId, setDefaultNasId] = useState<string>("");
  const [defaultLocationId, setDefaultLocationId] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const data = result.data as Record<string, string>[];
        const headers = result.meta.fields ?? [];
        setCsvData(data);
        setCsvHeaders(headers);

        // Auto-map headers with matching names
        const autoMapping: FieldMapping = {};
        for (const field of ALL_FIELDS) {
          const match = headers.find(
            (h) => h.toLowerCase().replace(/[_\s-]/g, "") === field.toLowerCase()
          );
          if (match) autoMapping[field] = match;
        }
        setFieldMapping(autoMapping);
        setStep("map");
      },
      error: () => {
        toast.error("Failed to parse CSV file");
      },
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"] },
    maxFiles: 1,
  });

  const handleImport = () => {
    startTransition(async () => {
      setStep("importing");
      let success = 0;
      let failed = 0;

      for (const row of csvData) {
        const mapped: Record<string, string> = {};
        for (const [field, csvCol] of Object.entries(fieldMapping)) {
          if (csvCol) mapped[field] = row[csvCol] ?? "";
        }

        const result = await createSubscriber({
          name: mapped.name ?? "",
          phone: mapped.phone ?? "",
          username: mapped.username ?? "",
          password: mapped.password ?? "default123",
          email: mapped.email ?? "",
          address: mapped.address ?? "",
          connectionType: mapped.connectionType || "PPPOE",
          subscriberType: mapped.subscriberType || "RESIDENTIAL",
          macAddress: mapped.macAddress ?? "",
          ipAddress: mapped.ipAddress ?? "",
          status: (mapped.status as "ACTIVE") || "ACTIVE",
          expiryDate: mapped.expiryDate ?? "",
          notes: mapped.notes ?? "",
          planId: defaultPlanId || null,
          nasDeviceId: defaultNasId || null,
          locationId: defaultLocationId || null,
        });

        if (result.success) success++;
        else failed++;
      }

      setImportResults({ success, failed });
      setStep("done");
      toast.success(`Imported ${success} subscribers, ${failed} failed`);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/subscribers">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Import Subscribers</h1>
          <p className="text-sm text-muted-foreground">
            Bulk import subscribers from CSV file
          </p>
        </div>
      </div>

      {step === "upload" && (
        <Card>
          <CardContent className="p-6">
            <div
              {...getRootProps()}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition ${
                isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="mb-4 h-10 w-10 text-muted-foreground" />
              <p className="text-sm font-medium">
                {isDragActive ? "Drop CSV file here" : "Drag & drop a CSV file, or click to browse"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Required columns: name, phone, username, password
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "map" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Map CSV Columns ({csvData.length} rows found)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {ALL_FIELDS.map((field) => (
                <div key={field} className="flex items-center gap-2">
                  <span className="w-32 text-sm font-medium">
                    {field}
                    {REQUIRED_FIELDS.includes(field as typeof REQUIRED_FIELDS[number]) && (
                      <span className="text-destructive">*</span>
                    )}
                  </span>
                  <Select
                    value={fieldMapping[field] ?? "skip"}
                    onValueChange={(v) =>
                      setFieldMapping((m) => ({ ...m, [field]: v === "skip" ? "" : v }))
                    }
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Skip" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="skip">-- Skip --</SelectItem>
                      {csvHeaders.map((h) => (
                        <SelectItem key={h} value={h}>
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-3 border-t pt-4">
              <div className="space-y-1">
                <span className="text-sm font-medium">Default Plan</span>
                <Select value={defaultPlanId} onValueChange={setDefaultPlanId}>
                  <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {plans.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <span className="text-sm font-medium">Default NAS</span>
                <Select value={defaultNasId} onValueChange={setDefaultNasId}>
                  <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {nasDevices.map((n) => (
                      <SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <span className="text-sm font-medium">Default Location</span>
                <Select value={defaultLocationId} onValueChange={setDefaultLocationId}>
                  <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {locations.map((l) => (
                      <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setStep("upload")}>
                Back
              </Button>
              <Button
                onClick={handleImport}
                disabled={
                  !REQUIRED_FIELDS.every((f) => fieldMapping[f]) || isPending
                }
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Import {csvData.length} Subscribers
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "importing" && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12">
            <Loader2 className="mb-4 h-10 w-10 animate-spin text-primary" />
            <p className="text-sm font-medium">Importing subscribers...</p>
          </CardContent>
        </Card>
      )}

      {step === "done" && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600" />
                <Badge variant="default">{importResults.success} imported</Badge>
              </div>
              {importResults.failed > 0 && (
                <div className="flex items-center gap-2">
                  <X className="h-5 w-5 text-red-600" />
                  <Badge variant="destructive">{importResults.failed} failed</Badge>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button asChild>
                <Link href="/subscribers">View Subscribers</Link>
              </Button>
              <Button variant="outline" onClick={() => { setCsvData([]); setStep("upload"); }}>
                Import More
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

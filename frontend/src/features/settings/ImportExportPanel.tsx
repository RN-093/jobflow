import { useState, type ChangeEvent } from "react";
import { useMutation } from "@tanstack/react-query";

import * as transferApi from "@/api/transfer";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/cn";
import type { ImportCommitResult, ImportPreview } from "@/types";

const IMPORT_FIELDS = [
  "title",
  "company",
  "location",
  "remote_status",
  "employment_type",
  "salary_min",
  "salary_max",
  "salary_currency",
  "salary_period",
  "source",
  "reference_id",
  "posting_url",
  "company_website",
  "description",
  "stage",
  "date_sourced",
  "date_applied",
  "deadline",
  "follow_up_date",
  "offer_date",
  "rejection_date",
];

export function ImportExportPanel() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [columnMap, setColumnMap] = useState<Record<string, string>>({});
  const [mode, setMode] = useState<"skip_duplicates" | "import_all">("skip_duplicates");
  const [result, setResult] = useState<ImportCommitResult | null>(null);

  const previewMutation = useMutation({
    mutationFn: (f: File) => transferApi.previewCsv(f),
    onSuccess: (data) => {
      setPreview(data);
      setColumnMap(data.suggested_mapping);
      setResult(null);
    },
    onError: () => toast("Failed to preview file", "error"),
  });

  const commitMutation = useMutation({
    mutationFn: () => {
      if (!file) throw new Error("No file selected");
      return transferApi.commitCsv(file, columnMap, mode);
    },
    onSuccess: (data) => {
      setResult(data);
      toast(`Imported ${data.imported} job(s)`);
    },
    onError: () => toast("Import failed", "error"),
  });

  async function handleExport(): Promise<void> {
    try {
      await transferApi.exportCsv();
    } catch {
      toast("Export failed", "error");
    }
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>): void {
    const selected = e.target.files?.[0] ?? null;
    setFile(selected);
    setPreview(null);
    setResult(null);
    if (selected) previewMutation.mutate(selected);
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 text-sm font-semibold text-text">Export</h3>
        <Button variant="secondary" size="sm" onClick={handleExport}>
          Export all jobs to CSV
        </Button>
      </div>

      <div className="border-t border-border pt-4">
        <h3 className="mb-2 text-sm font-semibold text-text">Import</h3>
        <input type="file" accept=".csv" onChange={handleFileChange} className="text-sm text-muted" />

        {preview && (
          <div className="mt-4 space-y-4">
            <div className="flex flex-wrap gap-2">
              {IMPORT_FIELDS.map((field) => (
                <label key={field} className="flex items-center gap-1 text-xs text-muted">
                  {field}
                  <Select
                    value={columnMap[field] ?? ""}
                    onChange={(e) => setColumnMap((m) => ({ ...m, [field]: e.target.value }))}
                    className="w-32"
                  >
                    <option value="">—</option>
                    {preview.columns.map((col) => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                  </Select>
                </label>
              ))}
            </div>

            <div className="max-h-72 overflow-auto rounded-xl border border-border">
              <table className="w-full text-xs">
                <thead className="bg-surface-hover text-left text-muted">
                  <tr>
                    <th className="px-2 py-1">Row</th>
                    <th className="px-2 py-1">Status</th>
                    <th className="px-2 py-1">Title</th>
                    <th className="px-2 py-1">Company</th>
                    <th className="px-2 py-1">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {preview.rows.map((row) => (
                    <tr key={row.row_index}>
                      <td className="px-2 py-1">{row.row_index + 1}</td>
                      <td className="px-2 py-1">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 font-medium",
                            row.status === "ok" && "bg-success/10 text-success",
                            row.status === "warning" && "bg-warning/10 text-warning",
                            row.status === "error" && "bg-danger/10 text-danger"
                          )}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="px-2 py-1">{String(row.parsed.title ?? "")}</td>
                      <td className="px-2 py-1">{String(row.parsed.company ?? "")}</td>
                      <td className="px-2 py-1 text-muted">{[...row.errors, ...row.warnings].join("; ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select value={mode} onChange={(e) => setMode(e.target.value as typeof mode)} className="w-48">
                <option value="skip_duplicates">Skip duplicates</option>
                <option value="import_all">Import all</option>
              </Select>
              <Button size="sm" disabled={commitMutation.isPending} onClick={() => commitMutation.mutate()}>
                Commit import
              </Button>
            </div>

            {result && (
              <div className="rounded-xl border border-border bg-surface-hover p-3 text-sm text-text">
                Imported {result.imported}, skipped {result.skipped}
                {result.error_rows.length > 0 && `, ${result.error_rows.length} row(s) had errors`}.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

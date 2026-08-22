import { api, downloadFile } from "@/api/client";
import type { ImportCommitResult, ImportPreview } from "@/types";

export function exportCsv(): Promise<void> {
  return downloadFile("/export/csv", "jobflow_jobs.csv");
}

export function previewCsv(file: File, columnMap?: Record<string, string>): Promise<ImportPreview> {
  const formData = new FormData();
  formData.append("file", file);
  if (columnMap) {
    formData.append("column_map", JSON.stringify(columnMap));
  }
  return api.postForm<ImportPreview>("/import/csv/preview", formData);
}

export function commitCsv(
  file: File,
  columnMap: Record<string, string>,
  mode: "skip_duplicates" | "import_all"
): Promise<ImportCommitResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("column_map", JSON.stringify(columnMap));
  formData.append("mode", mode);
  return api.postForm<ImportCommitResult>("/import/csv/commit", formData);
}

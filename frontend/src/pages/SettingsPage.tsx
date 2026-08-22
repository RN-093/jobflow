import { ImportExportPanel } from "@/features/settings/ImportExportPanel";
import { SourcesPanel } from "@/features/settings/SourcesPanel";
import { StagesManager } from "@/features/settings/StagesManager";

export default function SettingsPage() {
  return (
    <div className="max-w-3xl space-y-8">
      <h1 className="text-xl font-semibold text-text">Settings</h1>

      <section>
        <h2 className="mb-3 text-lg font-medium text-text">Pipeline stages</h2>
        <StagesManager />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-text">Sources</h2>
        <SourcesPanel />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-text">Import &amp; export</h2>
        <ImportExportPanel />
      </section>
    </div>
  );
}

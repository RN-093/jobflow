import { Modal } from "@/components/ui/Modal";

interface ShortcutsDialogProps {
  open: boolean;
  onClose: () => void;
}

const SHORTCUTS: [string, string][] = [
  ["N", "New job"],
  ["/", "Open search / command palette"],
  ["⌘K / Ctrl+K", "Command palette"],
  ["?", "Show this dialog"],
  ["G then D", "Go to Dashboard"],
  ["G then P", "Go to Board (Pipeline)"],
  ["G then J", "Go to Jobs"],
  ["G then C", "Go to Calendar"],
  ["G then A", "Go to Analytics"],
  ["Esc", "Close modal / dialog"],
];

export function ShortcutsDialog({ open, onClose }: ShortcutsDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title="Keyboard shortcuts">
      <div className="space-y-2">
        {SHORTCUTS.map(([key, label]) => (
          <div key={key} className="flex items-center justify-between text-sm">
            <span className="text-muted">{label}</span>
            <kbd className="rounded border border-border bg-bg px-2 py-0.5 font-mono text-xs text-text">{key}</kbd>
          </div>
        ))}
      </div>
    </Modal>
  );
}

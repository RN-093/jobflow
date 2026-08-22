import { SearchBar } from "@/components/layout/SearchBar";
import { Select } from "@/components/ui/Select";
import { REMOTE_STATUS_OPTIONS } from "@/lib/constants";

interface BoardFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  remoteStatus: string;
  onRemoteStatusChange: (value: string) => void;
}

export function BoardFilters({ search, onSearchChange, remoteStatus, onRemoteStatusChange }: BoardFiltersProps) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <SearchBar value={search} onChange={onSearchChange} className="w-full max-w-xs" />
      <Select value={remoteStatus} onChange={(e) => onRemoteStatusChange(e.target.value)} className="w-auto">
        <option value="">All locations</option>
        {REMOTE_STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
    </div>
  );
}

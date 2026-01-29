import { Filter } from "lucide-react";
import type React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SubmissionStatus } from "@/types/models/enums";

interface SubmissionFiltersProps {
  statusFilter: SubmissionStatus | "all";
  onStatusChange: (value: SubmissionStatus | "all") => void;
}

export const SubmissionFilters: React.FC<SubmissionFiltersProps> = ({
  statusFilter,
  onStatusChange,
}) => {
  return (
    <div className="flex items-center gap-2">
      <Filter className="h-4 w-4 text-muted-foreground" />
      <Select
        value={statusFilter}
        onValueChange={(value) =>
          onStatusChange(value as SubmissionStatus | "all")
        }
      >
        <SelectTrigger className="w-45">
          <SelectValue placeholder="All Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="submitted">Submitted</SelectItem>
          <SelectItem value="approved">Approved</SelectItem>
          <SelectItem value="failed">Failed</SelectItem>
          <SelectItem value="rejected">Rejected</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

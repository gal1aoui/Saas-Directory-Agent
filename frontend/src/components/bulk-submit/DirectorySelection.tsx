import { AlertCircle } from "lucide-react";
import type React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import type { Directory } from "../../types/schema";

interface DirectorySelectionProps {
  directories: Directory[];
  selectedDirectories: number[];
  onToggleDirectory: (dirId: number) => void;
  onSelectAll: () => void;
}

export const DirectorySelection: React.FC<DirectorySelectionProps> = ({
  directories,
  selectedDirectories,
  onToggleDirectory,
  onSelectAll,
}) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>
              2. Select Directories
              {selectedDirectories.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {selectedDirectories.length} selected
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Choose which directories to submit to
            </CardDescription>
          </div>
          {directories.length > 0 && (
            <Button variant="outline" size="sm" onClick={onSelectAll}>
              {selectedDirectories.length === directories.length
                ? "Deselect All"
                : "Select All"}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {directories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-muted p-3 mb-3">
              <AlertCircle className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg">
              No active directories found
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Please add some directories before submitting
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
            {directories.map((directory) => (
              <div
                key={directory.id}
                onClick={() => onToggleDirectory(directory.id)}
                className={`
                  flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition
                  ${
                    selectedDirectories.includes(directory.id)
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 hover:border-primary/50"
                  }
                `}
              >
                <Checkbox
                  checked={selectedDirectories.includes(directory.id)}
                  onCheckedChange={() => onToggleDirectory(directory.id)}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium truncate">
                    {directory.name}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate">
                    {directory.url}
                  </p>
                  <div className="flex gap-2 mt-2">
                    {directory.domain_authority && (
                      <Badge variant="secondary" className="text-xs">
                        DA: {directory.domain_authority}
                      </Badge>
                    )}
                    {directory.category && (
                      <Badge variant="outline" className="text-xs">
                        {directory.category}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

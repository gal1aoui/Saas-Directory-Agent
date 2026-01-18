import { AlertCircle, CheckSquare, Loader, Send, Square } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { useBulkSubmit, useDirectories, useSaasProducts } from "../store";
import type { Submission } from "../types/schema";

interface BulkSubmitResult {
  success: boolean;
  message: string;
  submissions?: Submission[];
}

const BulkSubmit: React.FC = () => {
  const { data: saasProducts = [], isLoading: loadingSaas } = useSaasProducts();
  const { data: directories = [], isLoading: loadingDirs } = useDirectories({
    status: "active",
  });

  const [selectedSaas, setSelectedSaas] = useState<number | "">("");
  const [selectedDirectories, setSelectedDirectories] = useState<number[]>([]);
  const [result, setResult] = useState<BulkSubmitResult | null>(null);

  const bulkSubmitMutation = useBulkSubmit();

  const toggleDirectory = (dirId: number) => {
    setSelectedDirectories((prev) =>
      prev.includes(dirId)
        ? prev.filter((id) => id !== dirId)
        : [...prev, dirId],
    );
  };

  const selectAll = () => {
    if (selectedDirectories.length === directories.length) {
      setSelectedDirectories([]);
    } else {
      setSelectedDirectories(directories.map((d) => d.id));
    }
  };

  const handleSubmit = async () => {
    if (!selectedSaas || selectedDirectories.length === 0) {
      alert("Please select a SaaS product and at least one directory");
      return;
    }

    try {
      setResult(null);

      const submissions = await bulkSubmitMutation.mutateAsync({
        saas_product_id: Number(selectedSaas),
        directory_ids: selectedDirectories,
      });

      const successCount = submissions.filter(
        (s) => s.status === "submitted",
      ).length;
      const failedCount = submissions.filter(
        (s) => s.status === "failed",
      ).length;

      setResult({
        success: true,
        message: `Submitted to ${submissions.length} directories (${successCount} successful, ${failedCount} failed)`,
        submissions,
      });

      // Reset selections
      setSelectedDirectories([]);
    } catch (error: any) {
      setResult({
        success: false,
        message: `Error: ${error.detail || "Something went wrong"}`,
      });
    }
  };

  const loading = loadingSaas || loadingDirs;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Bulk Submit</h1>
          <p className="text-gray-600 mt-2">
            Submit your SaaS product to multiple directories at once
          </p>
        </div>

        {/* SaaS Product Selection */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            1. Select SaaS Product
          </h2>

          {saasProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p>No SaaS products found. Please add one first.</p>
            </div>
          ) : (
            <select
              value={selectedSaas}
              onChange={(e) =>
                setSelectedSaas(e.target.value ? Number(e.target.value) : "")
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">-- Select a SaaS Product --</option>
              {saasProducts.map((saas) => (
                <option key={saas.id} value={saas.id}>
                  {saas.name} - {saas.website_url}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Directory Selection */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              2. Select Directories ({selectedDirectories.length} selected)
            </h2>
            {directories.length > 0 && (
              <button
                type="button"
                onClick={selectAll}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                {selectedDirectories.length === directories.length
                  ? "Deselect All"
                  : "Select All"}
              </button>
            )}
          </div>

          {directories.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p>No active directories found. Please add some first.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
              {directories.map((directory) => (
                <div
                  key={directory.id}
                  onClick={() => toggleDirectory(directory.id)}
                  className={`
                    flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition
                    ${
                      selectedDirectories.includes(directory.id)
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }
                  `}
                >
                  {selectedDirectories.includes(directory.id) ? (
                    <CheckSquare className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                  ) : (
                    <Square className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {directory.name}
                    </h3>
                    <p className="text-xs text-gray-500 truncate">
                      {directory.url}
                    </p>
                    <div className="flex gap-2 mt-1">
                      {directory.domain_authority && (
                        <span className="inline-block text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                          DA: {directory.domain_authority}
                        </span>
                      )}
                      {directory.category && (
                        <span className="inline-block text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                          {directory.category}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="bg-white rounded-lg shadow p-6">
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={
              bulkSubmitMutation.isPending ||
              !selectedSaas ||
              selectedDirectories.length === 0
            }
            className={`
              w-full flex items-center justify-center gap-2 px-6 py-4 rounded-lg
              font-semibold text-white transition
              ${
                bulkSubmitMutation.isPending ||
                !selectedSaas ||
                selectedDirectories.length === 0
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }
            `}
          >
            {bulkSubmitMutation.isPending ? (
              <>
                <Loader className="h-5 w-5 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-5 w-5" />
                Submit to {selectedDirectories.length} Director
                {selectedDirectories.length !== 1 ? "ies" : "y"}
              </>
            )}
          </button>

          {result && (
            <div
              className={`
              mt-4 p-4 rounded-lg
              ${result.success ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}
            `}
            >
              <p className="font-medium">{result.message}</p>
              {result.success && result.submissions && (
                <div className="mt-2 text-sm">
                  <p>
                    ✓{" "}
                    {
                      result.submissions.filter((s) => s.status === "submitted")
                        .length
                    }{" "}
                    successful
                  </p>
                  <p>
                    ✗{" "}
                    {
                      result.submissions.filter((s) => s.status === "failed")
                        .length
                    }{" "}
                    failed
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">About Bulk Submissions</p>
              <p>
                Submissions are processed concurrently with automatic retry
                logic. Each directory will be analyzed by AI to detect form
                fields, then filled and submitted automatically. This process
                may take several minutes depending on the number of directories.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkSubmit;

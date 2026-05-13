import * as React from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface EraseRestoreModalProps {
  jobId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EraseRestoreModal: React.FC<EraseRestoreModalProps> = ({ jobId, open, onOpenChange }) => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  if (!open) return null;

  const handleErase = async () => {
    if (!jobId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/erase/${jobId}`, {
        method: "POST",
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Erase failed");
      }
      // job re‑queued
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!jobId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/restore/${jobId}`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Restore failed");
      }
      // restored image blob can be handled elsewhere
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
      <div className="relative bg-card border border-border rounded-xl shadow-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Erase / Restore</h2>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mb-4">Choose an action for the selected image.</p>
        {error && <p className="text-sm text-red-500 mb-2">{error}</p>}
        <div className="flex space-x-2 justify-end">
          <Button variant="destructive" onClick={handleErase} disabled={loading}>
            {loading ? "Erasing…" : "Erase"}
          </Button>
          <Button variant="default" onClick={handleRestore} disabled={loading}>
            {loading ? "Restoring…" : "Restore"}
          </Button>
        </div>
      </div>
    </div>
  );
};

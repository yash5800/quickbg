import * as React from "react";
import { Button } from "@/components/ui/button";
import { EraseRestoreModal } from "@/components/ui/erase-restore-modal";
import { useJobStatus } from "@/hooks/useJobStatus";
import { JobRecord } from "@/types/job";

function JobCard({ job }: { job: JobRecord }) {
  const { status, progress } = useJobStatus(job.job_id);
  const [modalOpen, setModalOpen] = React.useState(false);

  return (
    <div key={job.job_id} className="border rounded-lg p-4 bg-card">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="font-medium">Job ID: {job.job_id}</p>
          <p className="text-sm text-muted-foreground">Status: {status}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setModalOpen(true)}>
          Actions
        </Button>
      </div>
      <div className="w-full bg-muted rounded h-3 overflow-hidden">
        <div className="bg-primary h-3" style={{ width: `${progress}%` }} />
      </div>
      <EraseRestoreModal jobId={job.job_id} open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
}

export const JobDashboard: React.FC = () => {
  const [jobs, setJobs] = React.useState<JobRecord[]>([]);
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  React.useEffect(() => {
    if (!isClient) return;
    
    const fetchJobs = async () => {
      try {
        const resp = await fetch("/api/jobs?limit=100", { cache: "no-store" });
        if (resp.ok) {
          const data: JobRecord[] = await resp.json();
          setJobs(data);
        }
      } catch {
        // ignore errors silently for now
      }
    };
    fetchJobs();
    const interval = setInterval(fetchJobs, 5000);
    return () => clearInterval(interval);
  }, [isClient]);

  const activeJobs = jobs.filter((j) => j.status !== "completed" && j.status !== "failed");

  if (!isClient || activeJobs.length === 0) {
    return null;
  }

  return (
    <div className="p-4" suppressHydrationWarning>
      <h2 className="text-xl font-semibold mb-4">Job Dashboard</h2>
      <div className="space-y-4">
        {activeJobs.map((job) => (
          <JobCard key={job.job_id} job={job} />
        ))}
      </div>
    </div>
  );
};

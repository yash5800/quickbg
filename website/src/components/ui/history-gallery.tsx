import * as React from "react";
import { Button } from "@/components/ui/button";
import { JobRecord } from "@/types/job";

// eslint-disable-next-line @next/next/no-img-element
export const HistoryGallery: React.FC = () => {
  const [jobs, setJobs] = React.useState<JobRecord[]>([]);
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  React.useEffect(() => {
    if (!isClient) return;
    
    const fetchJobs = async () => {
      try {
        const resp = await fetch("/jobs?limit=200");
        if (resp.ok) {
          const data: JobRecord[] = await resp.json();
          setJobs(data.filter((j) => j.status === "completed"));
        }
      } catch {
        // ignore
      }
    };
    fetchJobs();
  }, [isClient]);

  const download = async (jobId: string) => {
    const resp = await fetch(`/result/${jobId}`);
    if (!resp.ok) return;
    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${jobId}.png`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isClient || jobs.length === 0) return null;

  return (
    <div className="p-4" suppressHydrationWarning>
      <h2 className="text-xl font-semibold mb-4">History Gallery</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {jobs.map((job) => (
          <div key={job.job_id} className="border rounded overflow-hidden bg-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
<img src={`/result/${job.job_id}`} alt="Processed" className="w-full h-32 object-cover" />
            <div className="p-2 flex justify-between items-center">
              <span className="text-sm truncate">{job.fileName}</span>
              <Button variant="ghost" size="sm" onClick={() => download(job.job_id)}>
                Download
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

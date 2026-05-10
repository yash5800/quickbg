"use client";

import * as React from "react";
import { Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JobRecord } from "@/types/job";
import { motion } from "framer-motion";

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
        const resp = await fetch("/api/jobs?limit=20", { cache: "no-store" }); // Changed to /api/jobs
        if (resp.ok) {
          const data: JobRecord[] = await resp.json();
          setJobs(data.filter((j) => j.status === "completed"));
        }
      } catch {
        // ignore
      }
    };
    fetchJobs();
    const interval = setInterval(fetchJobs, 10000);
    return () => clearInterval(interval);
  }, [isClient]);

  const download = async (jobId: string, fileName?: string) => {
    try {
        const resp = await fetch(`/api/result/${jobId}`); // Changed to /api/result
        if (!resp.ok) return;
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName ? `quickbg-${fileName.split('.')[0]}.png` : `${jobId}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (err) {
        console.error("Download failed:", err);
    }
  };

  if (!isClient || jobs.length === 0) return null;

  return (
    <div className="space-y-6" suppressHydrationWarning>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {jobs.map((job, idx) => (
          <motion.div 
            key={job.job_id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            className="group relative aspect-square rounded-2xl overflow-hidden border border-border/40 bg-card/30 backdrop-blur-sm hover:border-primary/30 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-primary/5"
          >
            <img 
              src={`/api/result/${job.job_id}`} 
              alt="Processed" 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
              loading="lazy"
            />
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
              <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest mb-1 truncate">
                {job.fileName || 'Unnamed Image'}
              </p>
              <div className="flex gap-1.5">
                <Button 
                    variant="secondary" 
                    size="sm" 
                    className="h-7 flex-1 text-[10px] font-bold rounded-lg bg-white/10 hover:bg-white/20 border-white/10 backdrop-blur-md text-white"
                    onClick={() => download(job.job_id, job.fileName)}
                >
                  <Download className="h-3 w-3 mr-1" />
                  SAVE
                </Button>
                <Button 
                    variant="secondary" 
                    size="icon" 
                    className="h-7 w-7 rounded-lg bg-white/10 hover:bg-white/20 border-white/10 backdrop-blur-md text-white"
                    asChild
                >
                    <a href={`/api/result/${job.job_id}`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3 w-3" />
                    </a>
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

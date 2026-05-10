"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Image,
  Activity,
  Settings,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Trash2,
  BarChart3,
  Server,
  LogOut,
  AlertTriangle,
} from "lucide-react";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

interface Stats {
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  queuedJobs: number;
  runningJobs: number;
  totalUploads: number;
  hourlyLimit: number;
  remaining: number;
  resetInSeconds: number;
}

interface RecentJob {
  id: string;
  fileName: string;
  status: string;
  createdAt: string;
  duration?: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication
  useEffect(() => {
    const auth = sessionStorage.getItem("adminAuth");
    if (auth !== "true") {
      router.push("/admin/login");
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  }, []);

  const fetchRecentJobs = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/recent-jobs");
      if (response.ok) {
        const data = await response.json();
        setRecentJobs(data);
      }
    } catch (error) {
      console.error("Failed to fetch recent jobs:", error);
    }
  }, []);

  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([fetchStats(), fetchRecentJobs()]);
    setIsRefreshing(false);
    addToast({ type: "success", title: "Data refreshed", duration: 2000 });
  }, [fetchStats, fetchRecentJobs, addToast]);

  // Fetch data only when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    const init = async () => {
      setIsLoading(true);
      await Promise.all([fetchStats(), fetchRecentJobs()]);
      setIsLoading(false);
    };
    init();

    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, fetchStats, fetchRecentJobs]);

  const tabs = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "jobs", label: "Jobs", icon: Activity },
    { id: "usage", label: "Usage", icon: BarChart3 },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const statusColors = {
    completed: "text-green-500 bg-green-500/10",
    failed: "text-red-500 bg-red-500/10",
    queued: "text-yellow-500 bg-yellow-500/10",
    running: "text-blue-500 bg-blue-500/10",
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">Monitor and manage your application</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={refreshData} disabled={isRefreshing}>
              <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
              Refresh
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                sessionStorage.removeItem("adminAuth");
                router.push("/admin/login");
              }}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-border overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all whitespace-nowrap",
                activeTab === tab.id
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="h-4 w-20 bg-muted rounded mb-4" />
                <div className="h-8 w-16 bg-muted rounded" />
              </Card>
            ))}
          </div>
        ) : (
          <>
            {activeTab === "overview" && <OverviewTab stats={stats} recentJobs={recentJobs} statusColors={statusColors} />}
            {activeTab === "jobs" && <JobsTab recentJobs={recentJobs} statusColors={statusColors} />}
            {activeTab === "usage" && <UsageTab stats={stats} />}
            {activeTab === "settings" && <SettingsTab />}
          </>
        )}
      </div>
    </AppLayout>
  );
}

function StatCard({ title, value, icon: Icon, color, subtitle }: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  subtitle?: string;
}) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        <div className={cn("p-3 rounded-xl", color)}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Card>
  );
}

function OverviewTab({ stats, recentJobs, statusColors }: {
  stats: Stats | null;
  recentJobs: RecentJob[];
  statusColors: Record<string, string>;
}) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Jobs" value={stats?.totalJobs ?? 0} icon={Activity} color="bg-primary/10 text-primary" subtitle="All time" />
        <StatCard title="Completed" value={stats?.completedJobs ?? 0} icon={CheckCircle2} color="bg-green-500/10 text-green-500" />
        <StatCard title="In Queue" value={(stats?.queuedJobs ?? 0) + (stats?.runningJobs ?? 0)} icon={Clock} color="bg-yellow-500/10 text-yellow-500" />
        <StatCard title="Failed" value={stats?.failedJobs ?? 0} icon={XCircle} color="bg-red-500/10 text-red-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Usage Today
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Credits Used</span>
              <span className="font-semibold">{stats?.totalUploads ?? 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Credits Remaining</span>
              <span className="font-semibold">{stats?.remaining ?? 0}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${((stats?.totalUploads ?? 0) / (stats?.hourlyLimit ?? 25)) * 100}%` }} />
            </div>
            <p className="text-xs text-muted-foreground">
              Resets in {Math.floor((stats?.resetInSeconds ?? 0) / 60)}m {(stats?.resetInSeconds ?? 0) % 60}s
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Server className="h-5 w-5" />
            System Status
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">MongoDB</span>
              <span className="text-green-500 font-semibold">Connected</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Worker API</span>
              <span className="text-green-500 font-semibold">Online</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Hourly Limit</span>
              <span className="font-semibold">{stats?.hourlyLimit ?? 25}</span>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Jobs
        </h3>
        {recentJobs.length > 0 ? (
          <div className="space-y-3">
            {recentJobs.slice(0, 10).map((job) => (
              <div key={job.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3 min-w-0">
                  <Image className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  <span className="text-sm font-medium truncate max-w-[200px]">{job.fileName}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn("px-2 py-1 rounded-full text-xs font-medium capitalize", statusColors[job.status])}>
                    {job.status}
                  </span>
                  <span className="text-xs text-muted-foreground w-20 text-right">
                    {new Date(job.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">No recent jobs</p>
        )}
      </Card>
    </div>
  );
}

function JobsTab({ recentJobs, statusColors }: { recentJobs: RecentJob[]; statusColors: Record<string, string> }) {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="font-semibold mb-4">All Jobs</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">File Name</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Duration</th>
              </tr>
            </thead>
            <tbody>
              {recentJobs.map((job) => (
                <tr key={job.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="py-3 px-4 font-medium truncate max-w-[300px]">{job.fileName}</td>
                  <td className="py-3 px-4">
                    <span className={cn("px-2 py-1 rounded-full text-xs font-medium capitalize", statusColors[job.status])}>
                      {job.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">
                    {new Date(job.createdAt).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">
                    {job.duration ? `${(job.duration / 1000).toFixed(2)}s` : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {recentJobs.length === 0 && (
            <p className="text-center py-8 text-muted-foreground">No jobs found</p>
          )}
        </div>
      </Card>
    </div>
  );
}

function UsageTab({ stats }: { stats: Stats | null }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 col-span-1 md:col-span-2">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Usage Statistics
          </h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Hourly Usage</span>
                <span className="text-sm text-muted-foreground">
                  {stats?.totalUploads ?? 0} / {stats?.hourlyLimit ?? 25}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-4">
                <div
                  className="bg-gradient-to-r from-primary to-primary/60 h-4 rounded-full transition-all"
                  style={{ width: `${((stats?.totalUploads ?? 0) / (stats?.hourlyLimit ?? 25)) * 100}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-muted/30">
                <p className="text-sm text-muted-foreground">Completed Today</p>
                <p className="text-2xl font-bold text-green-500">{stats?.completedJobs ?? 0}</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/30">
                <p className="text-sm text-muted-foreground">Failed Today</p>
                <p className="text-2xl font-bold text-red-500">{stats?.failedJobs ?? 0}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Time Until Reset
          </h3>
          <div className="text-center">
            <div className="text-4xl font-bold text-primary">
              {Math.floor((stats?.resetInSeconds ?? 0) / 60)}:{(stats?.resetInSeconds ?? 0) % 60}
            </div>
            <p className="text-sm text-muted-foreground mt-2">minutes : seconds</p>
          </div>
        </Card>
      </div>
    </div>
  );
}

function SettingsTab() {
  const { addToast } = useToast();
  const [isCleaning, setIsCleaning] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleCleanup = async () => {
    setIsCleaning(true);
    try {
      const response = await fetch("/api/admin/cleanup", { method: "POST" });
      if (response.ok) {
        const result = await response.json();
        addToast({ type: "success", title: `Cleaned up ${result.deletedCount} old jobs`, duration: 3000 });
      }
    } catch {
      addToast({ type: "error", title: "Cleanup failed", duration: 3000 });
    }
    setIsCleaning(false);
  };

  const handleDeleteAllData = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch("/api/admin/delete-all-data", { method: "DELETE" });
      if (response.ok) {
        const result = await response.json();
        addToast({
          type: "success",
          title: "All data deleted",
          description: `${result.deletedCounts.user_uploads} uploads, ${result.deletedCounts.jobs} jobs removed`,
          duration: 5000,
        });
        setShowConfirm(false);
      }
    } catch {
      addToast({ type: "error", title: "Delete failed", duration: 3000 });
    }
    setIsDeleting(false);
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Database Management</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
            <div>
              <p className="font-medium">Cleanup Old Jobs</p>
              <p className="text-sm text-muted-foreground">Remove completed/failed jobs older than 7 days</p>
            </div>
            <Button variant="outline" onClick={handleCleanup} disabled={isCleaning}>
              {isCleaning ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Clean Up
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-destructive/5 border border-destructive/20">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div>
                <p className="font-medium text-destructive">Delete All Data</p>
                <p className="text-sm text-muted-foreground">Remove all user uploads, jobs, and usage data</p>
              </div>
            </div>
            {!showConfirm ? (
              <Button variant="destructive" onClick={() => setShowConfirm(true)}>
                Delete All
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowConfirm(false)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteAllData}
                  disabled={isDeleting}
                >
                  {isDeleting ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                  Confirm Delete
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold mb-4">Rate Limits</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
            <div>
              <p className="font-medium">Hourly Upload Limit</p>
              <p className="text-sm text-muted-foreground">Maximum uploads per hour per session</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg">25</span>
              <span className="text-muted-foreground">uploads/hour</span>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold mb-4">System Information</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Version</span>
            <span>1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Environment</span>
            <span>{process.env.NODE_ENV || "development"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">API Base</span>
            <span>{process.env.NEXT_PUBLIC_WORKER_API_URL || "http://localhost:8000"}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
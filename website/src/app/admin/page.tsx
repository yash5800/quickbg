"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient, type UseMutationResult } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Briefcase,
  Clock,
  Gauge,
  ImageIcon,
  LayoutDashboard,
  LogOut,
  RefreshCw,
  Search,
  Server,
  Shield,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppLayout } from "@/components/app-layout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

interface AnalyticsDay {
  date: string;
  jobs: number;
  unique_users: number;
}

interface AnalyticsResponse {
  data: AnalyticsDay[];
  totals: { totalJobs: number; totalUniqueUsers: number };
  hourlyTotals: { hour: number; jobs: number; users: number }[];
}

interface RecentJob {
  id: string;
  fileName: string;
  status: string;
  createdAt: string;
  duration?: number;
}

type AdminTab = "overview" | "jobs" | "usage" | "maintenance";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { cache: "no-store", ...init });
  if (!response.ok) {
    throw new Error(response.status === 401 ? "Unauthorized" : `Request failed: ${response.status}`);
  }
  return response.json();
}

function formatDuration(durationMs?: number): string {
  if (!durationMs) return "-";
  if (durationMs < 1000) return `${durationMs}ms`;
  return `${(durationMs / 1000).toFixed(2)}s`;
}

function formatRelativeTime(isoTime: string): string {
  const diffSec = Math.max(0, Math.floor((Date.now() - new Date(isoTime).getTime()) / 1000));
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}

function formatReset(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function statusVariant(status: string): "success" | "warning" | "destructive" | "outline" {
  const normalized = status.toLowerCase();
  if (normalized === "completed") return "success";
  if (normalized === "queued" || normalized === "running") return "warning";
  if (normalized === "failed" || normalized === "error") return "destructive";
  return "outline";
}

export default function AdminDashboard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [jobQuery, setJobQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const sessionQuery = useQuery({
    queryKey: ["admin", "session"],
    queryFn: () => fetchJson<{ authenticated: boolean }>("/api/admin/session"),
    retry: false,
  });

  const isAuthenticated = sessionQuery.data?.authenticated === true;

  useEffect(() => {
    if (sessionQuery.isError) {
      router.push("/admin/login");
    }
  }, [router, sessionQuery.isError]);

  const statsQuery = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => fetchJson<Stats>("/api/admin/stats"),
    enabled: isAuthenticated,
    refetchInterval: 15000,
  });

  const analyticsQuery = useQuery({
    queryKey: ["admin", "analytics"],
    queryFn: () => fetchJson<AnalyticsResponse>("/api/admin/analytics"),
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  const jobsQuery = useQuery({
    queryKey: ["admin", "recent-jobs"],
    queryFn: () => fetchJson<RecentJob[]>("/api/admin/recent-jobs"),
    enabled: isAuthenticated,
    refetchInterval: 15000,
  });

  const invalidateAdmin = async () => {
    await queryClient.invalidateQueries({ queryKey: ["admin"] });
  };

  const logoutMutation = useMutation({
    mutationFn: () => fetchJson<{ success: boolean }>("/api/admin/logout", { method: "POST" }),
    onSuccess: () => router.push("/admin/login"),
  });

  const cleanupMutation = useMutation({
    mutationFn: () => fetchJson<{ deletedCount: number }>("/api/admin/cleanup", { method: "POST" }),
    onSuccess: async (data) => {
      addToast({ type: "success", title: `Cleaned ${data.deletedCount} stale jobs`, duration: 3000 });
      await invalidateAdmin();
    },
    onError: () => addToast({ type: "error", title: "Cleanup failed", duration: 3000 }),
  });

  const clearAnalyticsMutation = useMutation({
    mutationFn: () => fetchJson<{ deletedCounts: { analytics: number; seenRecords: number } }>("/api/admin/analytics?confirm=CONFIRM", { method: "DELETE" }),
    onSuccess: async (data) => {
      addToast({
        type: "success",
        title: "Analytics cleared",
        description: `${data.deletedCounts.analytics} days removed`,
        duration: 4000,
      });
      await invalidateAdmin();
    },
    onError: () => addToast({ type: "error", title: "Delete failed", duration: 3000 }),
  });

  const deleteAllMutation = useMutation({
    mutationFn: () => fetchJson<{ deletedCounts: Record<string, number> }>("/api/admin/delete-all-data", { method: "DELETE" }),
    onSuccess: async () => {
      addToast({ type: "success", title: "All job data deleted", duration: 4000 });
      await invalidateAdmin();
    },
    onError: () => addToast({ type: "error", title: "Delete failed", duration: 3000 }),
  });

  const stats = statsQuery.data ?? null;
  const analytics = analyticsQuery.data ?? null;
  const jobs = useMemo(() => jobsQuery.data ?? [], [jobsQuery.data]);

  const filteredJobs = useMemo(() => {
    const query = jobQuery.trim().toLowerCase();
    return jobs.filter((job) => {
      const matchesStatus = statusFilter === "all" || job.status === statusFilter;
      const matchesQuery =
        query.length === 0 ||
        job.fileName.toLowerCase().includes(query) ||
        job.id.toLowerCase().includes(query);
      return matchesStatus && matchesQuery;
    });
  }, [jobs, jobQuery, statusFilter]);

  const lastUpdated = Math.max(
    statsQuery.dataUpdatedAt || 0,
    analyticsQuery.dataUpdatedAt || 0,
    jobsQuery.dataUpdatedAt || 0
  );

  if (sessionQuery.isLoading) {
    return (
      <AppLayout>
        <AdminSkeleton title="Checking admin session" />
      </AppLayout>
    );
  }

  if (!isAuthenticated) {
    return (
      <AppLayout>
        <AdminSkeleton title="Redirecting to login" />
      </AppLayout>
    );
  }

  const hasDataError = statsQuery.isError || analyticsQuery.isError || jobsQuery.isError;

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 border-b border-border pb-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Admin Console</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">QuickBG Operations</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Monitor background-removal traffic, queue health, usage, and maintenance tasks.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {lastUpdated > 0 && (
              <Badge variant="outline">Updated {formatRelativeTime(new Date(lastUpdated).toISOString())}</Badge>
            )}
            <Button variant="outline" size="sm" onClick={invalidateAdmin}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button variant="ghost" size="sm" onClick={() => logoutMutation.mutate()}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        {hasDataError && (
          <Alert className="mb-6 border-destructive/30 bg-destructive/5">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Some admin data could not load</AlertTitle>
            <AlertDescription>
              Check the database/worker connection, then refresh the dashboard.
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as AdminTab)} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto">
            <TabsTrigger value="overview"><LayoutDashboard className="mr-2 h-4 w-4" />Overview</TabsTrigger>
            <TabsTrigger value="jobs"><Activity className="mr-2 h-4 w-4" />Jobs</TabsTrigger>
            <TabsTrigger value="usage"><BarChart3 className="mr-2 h-4 w-4" />Usage</TabsTrigger>
            <TabsTrigger value="maintenance"><ShieldCheck className="mr-2 h-4 w-4" />Ops</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            {statsQuery.isLoading ? (
              <MetricSkeletonGrid />
            ) : (
              <OverviewPanel stats={stats} analytics={analytics} jobs={jobs} />
            )}
          </TabsContent>
          <TabsContent value="jobs">
            <JobsPanel
              jobs={filteredJobs}
              allJobsCount={jobs.length}
              query={jobQuery}
              setQuery={setJobQuery}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              isLoading={jobsQuery.isLoading}
            />
          </TabsContent>
          <TabsContent value="usage">
            <UsagePanel stats={stats} analytics={analytics} isLoading={analyticsQuery.isLoading} />
          </TabsContent>
          <TabsContent value="maintenance">
            <MaintenancePanel
              cleanupMutation={cleanupMutation}
              clearAnalyticsMutation={clearAnalyticsMutation}
              deleteAllMutation={deleteAllMutation}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

function AdminSkeleton({ title }: { title: string }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <p className="mb-6 text-sm text-muted-foreground">{title}</p>
      <MetricSkeletonGrid />
    </div>
  );
}

function MetricSkeletonGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[0, 1, 2, 3].map((item) => (
        <Card key={item} className="p-5">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="mt-4 h-9 w-20" />
        </Card>
      ))}
    </div>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: typeof Activity;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-1 text-3xl font-bold">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="rounded-lg bg-primary/10 p-2 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

function OverviewPanel({
  stats,
  analytics,
  jobs,
}: {
  stats: Stats | null;
  analytics: AnalyticsResponse | null;
  jobs: RecentJob[];
}) {
  const total = stats?.totalJobs ?? 0;
  const completed = stats?.completedJobs ?? 0;
  const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100);
  const chartData = (analytics?.data ?? [])
    .slice(0, 14)
    .reverse()
    .map((day) => ({ date: day.date.slice(5), jobs: day.jobs, users: day.unique_users }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Total Jobs" value={total} icon={Briefcase} />
        <MetricCard title="Completion Rate" value={`${completionRate}%`} icon={Gauge} />
        <MetricCard title="Queue" value={`${stats?.queuedJobs ?? 0} queued`} subtitle={`${stats?.runningJobs ?? 0} running`} icon={Server} />
        <MetricCard title="Uploads Left" value={stats?.remaining ?? 0} subtitle={`Resets in ${formatReset(stats?.resetInSeconds ?? 0)}`} icon={Clock} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" />Traffic</CardTitle>
          <CardDescription>Jobs and unique users over the last 14 days.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Legend />
                <Area type="monotone" dataKey="jobs" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.18} name="Jobs" />
                <Area type="monotone" dataKey="users" stroke="#22c55e" fill="#22c55e" fillOpacity={0.15} name="Users" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ImageIcon className="h-5 w-5" />Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {jobs.slice(0, 8).map((job) => (
            <div key={job.id} className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{job.fileName}</p>
                <p className="text-xs text-muted-foreground">{job.id.slice(0, 8)} · {formatDuration(job.duration)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <Badge variant={statusVariant(job.status)}>{job.status}</Badge>
                <span className="hidden w-20 text-right text-xs text-muted-foreground sm:block">{formatRelativeTime(job.createdAt)}</span>
              </div>
            </div>
          ))}
          {jobs.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No recent jobs</p>}
        </CardContent>
      </Card>
    </div>
  );
}

function JobsPanel({
  jobs,
  allJobsCount,
  query,
  setQuery,
  statusFilter,
  setStatusFilter,
  isLoading,
}: {
  jobs: RecentJob[];
  allJobsCount: number;
  query: string;
  setQuery: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  isLoading: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Job Explorer</CardTitle>
            <CardDescription>Showing {jobs.length} of {allJobsCount} recent jobs.</CardDescription>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search file or id" className="pl-9 sm:w-64" />
            </div>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option value="all">All statuses</option>
              <option value="queued">Queued</option>
              <option value="running">Running</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <MetricSkeletonGrid />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job</TableHead>
                <TableHead>File</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Duration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{job.id.slice(0, 8)}</TableCell>
                  <TableCell className="max-w-[280px] truncate font-medium">{job.fileName}</TableCell>
                  <TableCell><Badge variant={statusVariant(job.status)}>{job.status}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{formatRelativeTime(job.createdAt)}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDuration(job.duration)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {!isLoading && jobs.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No jobs found</p>}
      </CardContent>
    </Card>
  );
}

function UsagePanel({
  stats,
  analytics,
  isLoading,
}: {
  stats: Stats | null;
  analytics: AnalyticsResponse | null;
  isLoading: boolean;
}) {
  const [range, setRange] = useState<"7" | "30">("7");
  const dailyData = (analytics?.data ?? [])
    .slice(0, Number(range))
    .reverse()
    .map((day) => ({ date: day.date.slice(5), jobs: day.jobs, users: day.unique_users }));
  const hourlyData = (analytics?.hourlyTotals ?? []).map((hour) => ({ hour: `${hour.hour}:00`, jobs: hour.jobs, users: hour.users }));

  if (isLoading) return <MetricSkeletonGrid />;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Total Uploads" value={stats?.totalUploads ?? 0} icon={ImageIcon} />
        <MetricCard title="Failed Jobs" value={stats?.failedJobs ?? 0} icon={AlertTriangle} />
        <MetricCard title="Unique Users" value={analytics?.totals.totalUniqueUsers ?? 0} icon={Users} />
        <MetricCard title="Hourly Limit" value={stats?.hourlyLimit ?? 25} icon={Gauge} />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Daily Jobs</CardTitle>
              <CardDescription>Compare job volume by day.</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant={range === "7" ? "default" : "outline"} onClick={() => setRange("7")}>7 days</Button>
              <Button size="sm" variant={range === "30" ? "default" : "outline"} onClick={() => setRange("30")}>30 days</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Bar dataKey="jobs" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hourly Distribution</CardTitle>
          <CardDescription>Jobs and users by hour of day.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="hour" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Legend />
                <Line dataKey="jobs" stroke="#3b82f6" strokeWidth={2} dot={false} />
                <Line dataKey="users" stroke="#22c55e" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MaintenancePanel({
  cleanupMutation,
  clearAnalyticsMutation,
  deleteAllMutation,
}: {
  cleanupMutation: UseMutationResult<{ deletedCount: number }, Error, void>;
  clearAnalyticsMutation: UseMutationResult<{ deletedCounts: { analytics: number; seenRecords: number } }, Error, void>;
  deleteAllMutation: UseMutationResult<{ deletedCounts: Record<string, number> }, Error, void>;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" />Security & Privacy</CardTitle>
          <CardDescription>Current protections and operational policies.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {[
            "Admin routes require a signed session cookie.",
            "Upload limits are keyed to the anonymous session id.",
            "Analytics use aggregated counters for daily usage.",
            "Old completed/failed jobs can be cleaned by retention policy.",
          ].map((item) => (
            <div key={item} className="flex items-start gap-3 rounded-lg border border-border p-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 text-green-600" />
              <p className="text-sm text-muted-foreground">{item}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Maintenance Actions</CardTitle>
          <CardDescription>Use destructive operations carefully.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ActionRow
            title="Cleanup stale jobs"
            description="Remove completed/failed jobs older than the retention window."
            action="Run cleanup"
            loading={cleanupMutation.isPending}
            onClick={() => cleanupMutation.mutate()}
          />
          <ActionRow
            title="Clear analytics"
            description="Delete aggregated traffic analytics while keeping jobs."
            action="Clear analytics"
            loading={clearAnalyticsMutation.isPending}
            onClick={() => clearAnalyticsMutation.mutate()}
          />
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" />
                <div>
                  <p className="font-medium text-destructive">Delete all job data</p>
                  <p className="text-sm text-muted-foreground">Permanently removes uploads, jobs, and usage counters.</p>
                </div>
              </div>
              <Button variant="destructive" onClick={() => setConfirmOpen(true)}>Delete all</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete all job data?</DialogTitle>
            <DialogDescription>
              Type DELETE to confirm. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <Input value={confirmText} onChange={(event) => setConfirmText(event.target.value)} placeholder="DELETE" />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={confirmText !== "DELETE" || deleteAllMutation.isPending}
              onClick={() => {
                deleteAllMutation.mutate();
                setConfirmOpen(false);
                setConfirmText("");
              }}
            >
              {deleteAllMutation.isPending ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Delete everything
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ActionRow({
  title,
  description,
  action,
  loading,
  onClick,
}: {
  title: string;
  description: string;
  action: string;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Button variant="outline" disabled={loading} onClick={onClick}>
        {loading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
        {action}
      </Button>
    </div>
  );
}

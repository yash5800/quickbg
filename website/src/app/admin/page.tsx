"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ImageIcon,
  Activity,
  TrendingUp,
  Clock,
  CheckCircle2,
  RefreshCw,
  Trash2,
  BarChart3,
  Server,
  LogOut,
  AlertTriangle,
  Search,
  Filter,
  Gauge,
  ShieldCheck,
  Users,
  Briefcase,
  TrendingDown,
  Eye,
  EyeOff,
  Shield,
} from "lucide-react";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { Input } from "@/components/ui/input";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart,
  Legend,
} from "recharts";

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
  hours: Record<string, { jobs: number; users: number }>;
}

interface AnalyticsResponse {
  data: AnalyticsDay[];
  totals: { totalJobs: number; totalUniqueUsers: number };
  hourlyTotals: { hour: number; jobs: number; users: number }[];
  period: { days: number; startDate: string | null; endDate: string | null };
}

interface RecentJob {
  id: string;
  fileName: string;
  status: string;
  createdAt: string;
  duration?: number;
}

type AdminTab = "overview" | "jobs" | "usage" | "maintenance";

function formatDuration(durationMs?: number): string {
  if (!durationMs) return "-";
  if (durationMs < 1000) return `${durationMs}ms`;
  return `${(durationMs / 1000).toFixed(2)}s`;
}

function formatRelativeTime(isoTime: string): string {
  const now = Date.now();
  const then = new Date(isoTime).getTime();
  const diffSec = Math.max(0, Math.floor((now - then) / 1000));

  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}

function getStatusMeta(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === "completed") {
    return { label: "Completed", className: "bg-green-500/10 text-green-600 border-green-500/20" };
  }
  if (normalized === "failed") {
    return { label: "Failed", className: "bg-red-500/10 text-red-600 border-red-500/20" };
  }
  if (normalized === "running") {
    return { label: "Running", className: "bg-blue-500/10 text-blue-600 border-blue-500/20" };
  }
  if (normalized === "queued") {
    return { label: "Queued", className: "bg-amber-500/10 text-amber-600 border-amber-500/20" };
  }
  return { label: normalized, className: "bg-slate-500/10 text-slate-600 border-slate-500/20" };
}

export default function AdminDashboard() {
  const router = useRouter();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [stats, setStats] = useState<Stats | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsResponse | null>(null);
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [jobQuery, setJobQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const checkSession = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/session");
      if (response.ok) {
        setIsAuthenticated(true);
        return true;
      }
    } catch (error) {
      console.error("Failed to verify admin session:", error);
    }

    setIsAuthenticated(false);
    router.push("/admin/login");
    return false;
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

  const fetchAnalytics = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/analytics");
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
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
    if (!isAuthenticated) return;

    setIsRefreshing(true);
    await Promise.all([fetchStats(), fetchAnalytics(), fetchRecentJobs()]);
    setIsRefreshing(false);
    addToast({ type: "success", title: "Data refreshed", duration: 2000 });
  }, [isAuthenticated, fetchStats, fetchAnalytics, fetchRecentJobs, addToast]);

  useEffect(() => {
    const init = async () => {
      const sessionReady = await checkSession();
      if (!sessionReady) return;

      setIsLoading(true);
      await Promise.all([fetchStats(), fetchAnalytics(), fetchRecentJobs()]);
      setIsLoading(false);
    };
    init();

    const interval = setInterval(() => {
      if (isAuthenticated) {
        Promise.all([fetchStats(), fetchAnalytics(), fetchRecentJobs()]);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [checkSession, isAuthenticated, fetchStats, fetchAnalytics, fetchRecentJobs]);

  const tabs: { id: AdminTab; label: string; icon: typeof LayoutDashboard }[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "jobs", label: "Jobs", icon: Activity },
    { id: "usage", label: "Usage", icon: BarChart3 },
    { id: "maintenance", label: "Maintenance", icon: ShieldCheck },
  ];

  const filteredJobs = useMemo(() => {
    return recentJobs.filter((job) => {
      const matchesFilter = statusFilter === "all" || job.status === statusFilter;
      const query = jobQuery.trim().toLowerCase();
      const matchesQuery =
        query.length === 0 ||
        job.fileName.toLowerCase().includes(query) ||
        job.id.toLowerCase().includes(query);
      return matchesFilter && matchesQuery;
    });
  }, [recentJobs, statusFilter, jobQuery]);

  return (
    <AppLayout>
      {!isAuthenticated ? null : (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-background to-background p-6"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Control Center</p>
              <h1 className="mt-1 text-3xl font-bold">Background Platform Admin</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Traffic analytics, job diagnostics, and maintenance operations.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={refreshData} disabled={isRefreshing}>
                <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
                Refresh
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  await fetch("/api/admin/logout", { method: "POST" });
                  router.push("/admin/login");
                }}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </motion.div>

        <div className="grid gap-6 xl:grid-cols-[250px_minmax(0,1fr)]">
          <Card className="p-3 h-fit xl:sticky xl:top-24">
            <div className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full rounded-xl px-3 py-2.5 text-left text-sm transition-colors flex items-center gap-3",
                    activeTab === tab.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="mt-4 rounded-xl border border-border p-3">
              <p className="text-xs text-muted-foreground">Queue Snapshot</p>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span>Queued</span>
                <span className="font-semibold">{stats?.queuedJobs ?? 0}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-sm">
                <span>Running</span>
                <span className="font-semibold">{stats?.runningJobs ?? 0}</span>
              </div>
            </div>
          </Card>

          <div>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="p-6 animate-pulse">
                    <div className="h-4 w-24 bg-muted rounded mb-4" />
                    <div className="h-8 w-20 bg-muted rounded" />
                  </Card>
                ))}
              </div>
            ) : (
              <>
                {activeTab === "overview" && (
                  <OverviewPanel stats={stats} analyticsData={analyticsData} recentJobs={recentJobs} />
                )}
                {activeTab === "jobs" && (
                  <JobsPanel
                    jobs={filteredJobs}
                    allJobsCount={recentJobs.length}
                    query={jobQuery}
                    setQuery={setJobQuery}
                    statusFilter={statusFilter}
                    setStatusFilter={setStatusFilter}
                  />
                )}
                {activeTab === "usage" && <UsagePanel stats={stats} analyticsData={analyticsData} />}
                {activeTab === "maintenance" && <MaintenancePanel />}
              </>
            )}
          </div>
        </div>
      </div>
      )}
    </AppLayout>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  className,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: typeof Activity;
  trend?: "up" | "down" | "neutral";
  className?: string;
}) {
  return (
    <Card className={cn("p-5", className)}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="rounded-xl bg-primary/10 p-2 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          {trend && (
            <span
              className={cn(
                "text-xs",
                trend === "up" && "text-green-600",
                trend === "down" && "text-red-600",
                trend === "neutral" && "text-muted-foreground"
              )}
            >
              {trend === "up" && <TrendingUp className="h-3 w-3" />}
              {trend === "down" && <TrendingDown className="h-3 w-3" />}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}

function OverviewPanel({
  stats,
  analyticsData,
  recentJobs,
}: {
  stats: Stats | null;
  analyticsData: AnalyticsResponse | null;
  recentJobs: RecentJob[];
}) {
  const total = stats?.totalJobs ?? 0;
  const done = stats?.completedJobs ?? 0;

  const safePct = (value: number) => {
    if (total === 0) return 0;
    return Math.max(0, Math.round((value / total) * 100));
  };

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!analyticsData?.data) return [];
    return analyticsData.data
      .slice(0, 14)
      .reverse()
      .map((d) => ({
        date: d.date.slice(5),
        jobs: d.jobs,
        users: d.unique_users,
      }));
  }, [analyticsData]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Total Jobs" value={total} icon={Briefcase} />
        <MetricCard title="Completed" value={done} icon={CheckCircle2} />
        <MetricCard title="Unique Users" value={analyticsData?.totals.totalUniqueUsers ?? 0} icon={Users} />
        <MetricCard title="Completion Rate" value={`${safePct(done)}%`} icon={Gauge} />
      </div>

      {/* Traffic Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Traffic Overview (Last 14 Days)
          </CardTitle>
          <CardDescription>Daily jobs and unique users — no IPs stored</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="jobs"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.2}
                  name="Jobs"
                />
                <Area
                  type="monotone"
                  dataKey="users"
                  stroke="#22c55e"
                  fill="#22c55e"
                  fillOpacity={0.2}
                  name="Unique Users"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Live Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Live Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentJobs.length > 0 ? (
            <div className="space-y-2">
              {recentJobs.slice(0, 10).map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/20"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <ImageIcon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate max-w-[240px]">{job.fileName}</p>
                      <p className="text-xs text-muted-foreground">{job.id.slice(0, 8)}... • {formatDuration(job.duration)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "px-2 py-1 rounded-full border text-xs font-medium",
                        getStatusMeta(job.status).className
                      )}
                    >
                      {getStatusMeta(job.status).label}
                    </span>
                    <span className="text-xs text-muted-foreground w-20 text-right">
                      {formatRelativeTime(job.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No recent jobs</p>
          )}
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
}: {
  jobs: RecentJob[];
  allJobsCount: number;
  query: string;
  setQuery: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
}) {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
          <div>
            <h3 className="font-semibold">Job Explorer</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Showing {jobs.length} of {allJobsCount} jobs
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search file or id"
                className="pl-9"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-border bg-background py-2 pl-9 pr-8 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="all">All</option>
                <option value="queued">Queued</option>
                <option value="running">Running</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="py-3 px-4 text-sm font-medium text-muted-foreground">Job</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">File Name</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Created</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Duration</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="py-3 px-4 text-sm font-mono text-muted-foreground">
                    {job.id.slice(0, 8)}...
                  </td>
                  <td className="py-3 px-4 font-medium truncate max-w-[300px]">{job.fileName}</td>
                  <td className="py-3 px-4">
                    <span
                      className={cn(
                        "px-2 py-1 rounded-full border text-xs font-medium",
                        getStatusMeta(job.status).className
                      )}
                    >
                      {getStatusMeta(job.status).label}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">
                    {new Date(job.createdAt).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">{formatDuration(job.duration)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {jobs.length === 0 && <p className="text-center py-8 text-muted-foreground">No jobs found</p>}
        </div>
      </Card>
    </div>
  );
}

function UsagePanel({ stats, analyticsData }: { stats: Stats | null; analyticsData: AnalyticsResponse | null }) {
  const [timeRange, setTimeRange] = useState<"day" | "week" | "month">("week");
  const [showHourly, setShowHourly] = useState(false);

  // Prepare hourly chart data
  const hourlyChartData = useMemo(() => {
    if (!analyticsData?.hourlyTotals) return [];
    return analyticsData.hourlyTotals.map((h) => ({
      hour: `${h.hour}:00`,
      jobs: h.jobs,
      users: h.users,
    }));
  }, [analyticsData]);

  // Prepare daily comparison data
  const dailyChartData = useMemo(() => {
    if (!analyticsData?.data) return [];
    const days = timeRange === "day" ? 1 : timeRange === "week" ? 7 : 30;
    return analyticsData.data.slice(0, days).reverse().map((d) => ({
      date: d.date,
      jobs: d.jobs,
      users: d.unique_users,
    }));
  }, [analyticsData, timeRange]);

  const totals = analyticsData?.totals ?? { totalJobs: 0, totalUniqueUsers: 0 };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Total Jobs" value={totals.totalJobs} icon={Briefcase} />
        <MetricCard title="Unique Users" value={totals.totalUniqueUsers} icon={Users} />
        <MetricCard title="Avg Jobs/Day" value={Math.round(totals.totalJobs / (analyticsData?.data.length || 1))} icon={BarChart3} />
        <MetricCard title="Jobs/Hour" value={Math.round(totals.totalJobs / ((analyticsData?.data.length || 1) * 24) * 100) / 100} icon={Clock} />
      </div>

      {/* Time Range Toggle */}
      <div className="flex items-center gap-2">
        <Button
          variant={timeRange === "day" ? "default" : "outline"}
          size="sm"
          onClick={() => setTimeRange("day")}
        >
          Today
        </Button>
        <Button
          variant={timeRange === "week" ? "default" : "outline"}
          size="sm"
          onClick={() => setTimeRange("week")}
        >
          7 Days
        </Button>
        <Button
          variant={timeRange === "month" ? "default" : "outline"}
          size="sm"
          onClick={() => setTimeRange("month")}
        >
          30 Days
        </Button>
      </div>

      {/* Jobs Per Day Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Jobs Per Day
          </CardTitle>
          <CardDescription>Daily job count breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar dataKey="jobs" fill="#3b82f6" name="Jobs" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Hourly Distribution */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Hourly Distribution
              </CardTitle>
              <CardDescription>Jobs and users per hour (24-hour view)</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowHourly(!showHourly)}>
              {showHourly ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showHourly ? "Hide" : "Show"}
            </Button>
          </div>
        </CardHeader>
        {showHourly && (
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={hourlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="hour" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="jobs"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                    name="Jobs"
                  />
                  <Line
                    type="monotone"
                    dataKey="users"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={false}
                    name="Users"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Reset Timer */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TimerReset className="h-5 w-5" />
            Rate Limit Timer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-4xl font-bold text-primary">
              {Math.floor((stats?.resetInSeconds ?? 0) / 60)}:
              {String((stats?.resetInSeconds ?? 0) % 60).padStart(2, "0")}
            </div>
            <p className="text-sm text-muted-foreground mt-2">minutes : seconds until reset</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function TimerReset({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l4 2" />
    </svg>
  );
}

function MaintenancePanel() {
  const { addToast: addToastLocal } = useToast();
  const [isCleaning, setIsCleaning] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeletingAnalytics, setIsDeletingAnalytics] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleCleanup = async () => {
    setIsCleaning(true);
    try {
      const response = await fetch("/api/admin/cleanup", { method: "POST" });
      if (response.ok) {
        const result = await response.json();
        addToastLocal({ type: "success", title: `Cleaned up ${result.deletedCount} old jobs`, duration: 3000 });
      } else {
        addToastLocal({ type: "error", title: "Cleanup failed", duration: 3000 });
      }
    } catch {
      addToastLocal({ type: "error", title: "Cleanup failed", duration: 3000 });
    }
    setIsCleaning(false);
  };

  const handleDeleteAllJobs = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch("/api/admin/delete-all-data", { method: "DELETE" });
      if (response.ok) {
        const result = await response.json();
        addToastLocal({
          type: "success",
          title: "All data deleted",
          description: `${result.deletedCounts.user_uploads} uploads, ${result.deletedCounts.jobs} jobs removed`,
          duration: 5000,
        });
        setShowConfirm(false);
        setShowConfirm(false);
      } else {
        addToastLocal({ type: "error", title: "Delete failed", duration: 3000 });
      }
    } catch {
      addToastLocal({ type: "error", title: "Delete failed", duration: 3000 });
    }
    setIsDeleting(false);
  };

  const handleDeleteAnalytics = async () => {
    setIsDeletingAnalytics(true);
    try {
      const response = await fetch("/api/admin/analytics?confirm=CONFIRM", { method: "DELETE" });
      if (response.ok) {
        const result = await response.json();
        addToastLocal({
          type: "success",
          title: "Analytics cleared",
          description: `${result.deletedCounts.analytics} days, ${result.deletedCounts.seenRecords} records removed`,
          duration: 5000,
        });
      } else {
        addToastLocal({ type: "error", title: "Delete failed", duration: 3000 });
      }
    } catch {
      addToastLocal({ type: "error", title: "Delete failed", duration: 3000 });
    }
    setIsDeletingAnalytics(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security & Privacy
          </CardTitle>
          <CardDescription>
            Data protection measures in place
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-xl border border-green-500/20 bg-green-500/5">
              <ShieldCheck className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-600">No IP Logging</p>
                <p className="text-sm text-muted-foreground">User IPs are never stored in the database</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl border border-green-500/20 bg-green-500/5">
              <ShieldCheck className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-600">Hashed Client Keys</p>
                <p className="text-sm text-muted-foreground">Only SHA-256 hashed identifiers are stored for unique user counts</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl border border-green-500/20 bg-green-500/5">
              <ShieldCheck className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-600">SQL Injection Protection</p>
                <p className="text-sm text-muted-foreground">All queries use parameterized statements</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl border border-green-500/20 bg-green-500/5">
              <ShieldCheck className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-600">Rate Limiting</p>
                <p className="text-sm text-muted-foreground">Admin routes are protected with rate limiting</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Maintenance Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">Cleanup Stale Jobs</p>
                <p className="text-sm text-muted-foreground">Removes completed/failed jobs older than retention policy.</p>
              </div>
              <Button variant="outline" onClick={handleCleanup} disabled={isCleaning}>
                {isCleaning ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Run Cleanup
              </Button>
            </div>

            <div className="flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">Clear Analytics Data</p>
                <p className="text-sm text-muted-foreground">Removes all traffic statistics but keeps jobs.</p>
              </div>
              <Button variant="outline" onClick={handleDeleteAnalytics} disabled={isDeletingAnalytics}>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Analytics
              </Button>
            </div>

            <div className="flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                <div>
                  <p className="font-medium text-destructive">Danger Zone: Delete All Jobs Data</p>
                  <p className="text-sm text-muted-foreground">Permanently removes all uploads, jobs, and hourly usage records.</p>
                </div>
              </div>
              <Button variant="destructive" onClick={() => { setShowConfirm(true); }}>
                Delete All
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="text-destructive">Confirm Deletion</CardTitle>
              <CardDescription>
                This action cannot be undone. Are you sure?
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-3">
              <Button variant="outline" onClick={() => { setShowConfirm(false); }}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteAllJobs}
                disabled={isDeleting}
              >
                {isDeleting ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                Delete Everything
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            System Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Environment</span>
              <span>{process.env.NODE_ENV || "development"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Worker API</span>
              <span>{process.env.NEXT_PUBLIC_WORKER_API_URL || "http://localhost:8000"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Hourly Limit</span>
              <span>25 uploads / hour</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Build</span>
              <span>v1.0.0</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
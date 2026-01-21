import { format } from "date-fns";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Database,
  Globe,
  type LucideIcon,
  Send,
  TrendingUp,
  XCircle,
  BarChart3,
  Activity,
} from "lucide-react";
import type React from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useDashboardStats, useSubmissions } from "../store";
import type { SubmissionStatus } from "../types/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface StatCard {
  title: string;
  value: number;
  icon: LucideIcon;
  color: string;
  trend?: string;
}

interface ChartData {
  name: string;
  value: number;
  color: string;
  [key: string]: string | number;
}

const Dashboard: React.FC = () => {
  const {
    data: stats,
    isLoading: statsLoading,
    refetch: refetchStats,
    error: statsError,
  } = useDashboardStats();
  const { data: recentSubmissions = [], isLoading: submissionsLoading } =
    useSubmissions({ limit: 10 });

  const loading = statsLoading || submissionsLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (statsError || !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-white" />
              <CardTitle>Error Loading Dashboard</CardTitle>
            </div>
            <CardDescription>
              Failed to load dashboard data. Please try again.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => refetchStats()} className="w-full">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statCards: StatCard[] = [
    {
      title: "Total Submissions",
      value: stats.total_submissions,
      icon: Send,
      color: "blue",
    },
    {
      title: "Approved",
      value: stats.approved_submissions,
      icon: CheckCircle,
      color: "green",
    },
    {
      title: "Pending",
      value: stats.pending_submissions,
      icon: Clock,
      color: "yellow",
    },
    {
      title: "Failed",
      value: stats.failed_submissions,
      icon: XCircle,
      color: "red",
    },
  ];

  const chartData: ChartData[] = [
    { name: "Approved", value: stats.approved_submissions, color: "#10b981" },
    { name: "Submitted", value: stats.submitted_submissions, color: "#3b82f6" },
    { name: "Pending", value: stats.pending_submissions, color: "#f59e0b" },
    { name: "Failed", value: stats.failed_submissions, color: "#ef4444" },
  ].filter((item) => item.value > 0);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Overview of your SaaS directory submissions
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">
              <BarChart3 className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <Activity className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {statCards.map((stat, index) => (
                <Card key={index}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {stat.title}
                    </CardTitle>
                    <stat.icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stat.title.toLowerCase()} this month
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Charts Row */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              {/* Success Rate Card */}
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Success Rate</CardTitle>
                  <CardDescription>
                    Based on {stats.total_submissions} total submissions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-bold text-green-600">
                          {stats.success_rate.toFixed(1)}%
                        </span>
                        <TrendingUp className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Successful
                          </span>
                          <span className="font-medium">
                            {stats.approved_submissions +
                              stats.submitted_submissions}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Failed</span>
                          <span className="font-medium">
                            {stats.failed_submissions}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Directories Card */}
              <Card className="col-span-3">
                <CardHeader>
                  <CardTitle>Directories</CardTitle>
                  <CardDescription>Active submission targets</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Total</span>
                    </div>
                    <span className="text-2xl font-bold">
                      {stats.total_directories}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Active</span>
                    </div>
                    <Badge variant="success" className="text-lg px-3 py-1">
                      {stats.active_directories}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Bottom Row */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Submissions Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Submissions Breakdown</CardTitle>
                  <CardDescription>
                    Distribution by status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) =>
                            `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                          }
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                      <Database className="h-12 w-12 mb-2 text-muted" />
                      <p>No submissions yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Submissions */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Submissions</CardTitle>
                  <CardDescription>Latest 5 submissions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentSubmissions.slice(0, 5).map((submission) => (
                      <div
                        key={submission.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <StatusIcon status={submission.status} />
                          <div>
                            <p className="text-sm font-medium">
                              {submission.directory.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(
                                new Date(submission.created_at),
                                "MMM dd, yyyy"
                              )}
                            </p>
                          </div>
                        </div>
                        <Badge variant={getStatusVariant(submission.status)}>
                          {submission.status}
                        </Badge>
                      </div>
                    ))}
                    {recentSubmissions.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                        <Database className="h-12 w-12 mb-2" />
                        <p className="text-sm">No submissions yet</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Advanced Analytics</CardTitle>
                <CardDescription>
                  Detailed insights and trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Activity className="h-16 w-16 mb-4" />
                  <p className="text-lg font-medium">Coming Soon</p>
                  <p className="text-sm">
                    Advanced analytics features will be available here
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

const StatusIcon: React.FC<{ status: SubmissionStatus }> = ({ status }) => {
  const iconClass = "h-5 w-5";

  switch (status) {
    case "approved":
      return <CheckCircle className={`${iconClass} text-green-600`} />;
    case "submitted":
      return <Send className={`${iconClass} text-blue-600`} />;
    case "pending":
      return <Clock className={`${iconClass} text-yellow-600`} />;
    case "failed":
      return <XCircle className={`${iconClass} text-red-600`} />;
    case "rejected":
      return <XCircle className={`${iconClass} text-red-600`} />;
    default:
      return <AlertCircle className={`${iconClass} text-gray-600`} />;
  }
};

const getStatusVariant = (
  status: SubmissionStatus
): "success" | "warning" | "destructive" | "info" | "default" => {
  switch (status) {
    case "approved":
      return "success";
    case "submitted":
      return "info";
    case "pending":
      return "warning";
    case "failed":
    case "rejected":
      return "destructive";
    default:
      return "default";
  }
};

export default Dashboard;

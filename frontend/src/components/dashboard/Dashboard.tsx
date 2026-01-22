import {
  Activity,
  AlertCircle,
  BarChart3,
  CheckCircle,
  Clock,
  Send,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDashboardStats, useSubmissions } from "../../store";
import { DashboardOverview } from "./DashboardOverview";

export default function Dashboard() {
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

  const statCards = [
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
            <DashboardOverview
              stats={stats}
              statCards={statCards}
              recentSubmissions={recentSubmissions}
            />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Advanced Analytics</CardTitle>
                <CardDescription>Detailed insights and trends</CardDescription>
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

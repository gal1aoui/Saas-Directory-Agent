import { Activity, Globe, type LucideIcon, TrendingUp } from "lucide-react";
import type React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  DashboardStats,
  SubmissionWithDetails,
} from "../../types/schema";
import { RecentSubmissions } from "./RecentSubmissions";
import { SubmissionsChart } from "./SubmissionsChart";

interface StatCard {
  title: string;
  value: number;
  icon: LucideIcon;
  color: string;
  trend?: string;
}

interface DashboardOverviewProps {
  stats: DashboardStats;
  statCards: StatCard[];
  recentSubmissions: SubmissionWithDetails[];
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  stats,
  statCards,
  recentSubmissions,
}) => {
  return (
    <>
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
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
                    <span className="text-muted-foreground">Successful</span>
                    <span className="font-medium">
                      {stats.approved_submissions + stats.submitted_submissions}
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
        <SubmissionsChart stats={stats} />
        <RecentSubmissions submissions={recentSubmissions} />
      </div>
    </>
  );
};

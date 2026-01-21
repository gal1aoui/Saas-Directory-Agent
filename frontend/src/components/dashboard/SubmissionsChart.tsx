import { Database } from "lucide-react";
import type React from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DashboardStats } from "../../types/schema";

interface ChartData {
  name: string;
  value: number;
  color: string;
  [key: string]: string | number;
}

interface SubmissionsChartProps {
  stats: DashboardStats;
}

export const SubmissionsChart: React.FC<SubmissionsChartProps> = ({
  stats,
}) => {
  const chartData: ChartData[] = [
    { name: "Approved", value: stats.approved_submissions, color: "#10b981" },
    { name: "Submitted", value: stats.submitted_submissions, color: "#3b82f6" },
    { name: "Pending", value: stats.pending_submissions, color: "#f59e0b" },
    { name: "Failed", value: stats.failed_submissions, color: "#ef4444" },
  ].filter((item) => item.value > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submissions Breakdown</CardTitle>
        <CardDescription>Distribution by status</CardDescription>
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
  );
};

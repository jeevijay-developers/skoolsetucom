import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";
import { TrendingUp, TrendingDown, Award, Users } from "lucide-react";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2, 160 60% 45%))",
  "hsl(var(--chart-3, 30 80% 55%))",
  "hsl(var(--chart-4, 280 65% 60%))",
  "hsl(var(--chart-5, 340 75% 55%))",
];

interface ClassPerformance {
  className: string;
  avgPercentage: number;
  studentCount: number;
}

interface SubjectPerformance {
  subject: string;
  avgPercentage: number;
  passRate: number;
}

interface TopPerformer {
  name: string;
  className: string;
  percentage: number;
}

interface ExamTrend {
  examName: string;
  avgPercentage: number;
}

interface PassFailData {
  name: string;
  value: number;
}

export function ClassPerformanceChart({ data }: { data: ClassPerformance[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Class-wise Average Performance</CardTitle>
        <CardDescription>Average percentage per class</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No data available</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="className" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))" }}
                formatter={(value: number) => [`${value.toFixed(1)}%`, "Avg %"]}
              />
              <Bar dataKey="avgPercentage" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function SubjectPerformanceChart({ data }: { data: SubjectPerformance[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Subject-wise Performance</CardTitle>
        <CardDescription>Average score and pass rate by subject</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No data available</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="subject" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))" }}
                formatter={(value: number, name: string) => [
                  `${value.toFixed(1)}%`,
                  name === "avgPercentage" ? "Avg %" : "Pass Rate",
                ]}
              />
              <Legend />
              <Bar dataKey="avgPercentage" name="Avg %" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="passRate" name="Pass Rate" fill="hsl(var(--chart-2, 160 60% 45%))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function PassFailChart({ data }: { data: PassFailData[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Pass / Fail Ratio</CardTitle>
        <CardDescription>Overall pass vs fail distribution</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-center">
        {data.every((d) => d.value === 0) ? (
          <p className="text-center text-muted-foreground py-8">No data available</p>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {data.map((_, idx) => (
                  <Cell key={idx} fill={idx === 0 ? "hsl(var(--chart-2, 160 60% 45%))" : "hsl(var(--destructive))"} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function ExamTrendChart({ data }: { data: ExamTrend[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Exam-over-Exam Trend</CardTitle>
        <CardDescription>Average percentage trend across exams</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No data available</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="examName" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))" }}
                formatter={(value: number) => [`${value.toFixed(1)}%`, "Avg %"]}
              />
              <Line
                type="monotone"
                dataKey="avgPercentage"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function TopPerformersCard({
  title,
  performers,
  icon,
}: {
  title: string;
  performers: TopPerformer[];
  icon: "top" | "bottom";
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          {icon === "top" ? (
            <TrendingUp className="h-4 w-4 text-green-600" />
          ) : (
            <TrendingDown className="h-4 w-4 text-destructive" />
          )}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {performers.length === 0 ? (
          <p className="text-sm text-muted-foreground">No data</p>
        ) : (
          <div className="space-y-3">
            {performers.map((p, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground w-5">{idx + 1}.</span>
                  <div>
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.className}</p>
                  </div>
                </div>
                <Badge variant={p.percentage >= 75 ? "default" : p.percentage >= 50 ? "secondary" : "destructive"}>
                  {p.percentage.toFixed(1)}%
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Student progress chart for student results page
export function StudentProgressChart({ data }: { data: ExamTrend[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Performance Trend
        </CardTitle>
        <CardDescription>Your percentage across exams</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length < 2 ? (
          <p className="text-center text-muted-foreground py-8">Need at least 2 exams to show trend</p>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="examName" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))" }}
                formatter={(value: number) => [`${value.toFixed(1)}%`, "Score"]}
              />
              <Line
                type="monotone"
                dataKey="avgPercentage"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))", r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

// Subject strength indicator for student
export function SubjectStrengthCard({ data }: { data: SubjectPerformance[] }) {
  const sorted = [...data].sort((a, b) => b.avgPercentage - a.avgPercentage);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Award className="h-4 w-4 text-primary" />
          Subject Strength
        </CardTitle>
        <CardDescription>Your strongest and weakest subjects</CardDescription>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground">No data</p>
        ) : (
          <div className="space-y-3">
            {sorted.map((s, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-sm font-medium">{s.subject}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(s.avgPercentage, 100)}%`,
                        backgroundColor:
                          s.avgPercentage >= 75
                            ? "hsl(var(--chart-2, 160 60% 45%))"
                            : s.avgPercentage >= 50
                            ? "hsl(var(--primary))"
                            : "hsl(var(--destructive))",
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium w-12 text-right">{s.avgPercentage.toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Teacher summary stats cards
export function TeacherStatsCards({
  stats,
}: {
  stats: {
    avgMarks: number;
    passRate: number;
    highestScorer: string;
    lowestScorer: string;
    totalStudents: number;
  };
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-4 pb-4">
          <p className="text-xs text-muted-foreground">Avg Marks</p>
          <p className="text-xl font-bold">{stats.avgMarks.toFixed(1)}%</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4 pb-4">
          <p className="text-xs text-muted-foreground">Pass Rate</p>
          <p className="text-xl font-bold">{stats.passRate.toFixed(1)}%</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4 pb-4">
          <p className="text-xs text-muted-foreground">Highest Scorer</p>
          <p className="text-sm font-bold truncate">{stats.highestScorer || "N/A"}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4 pb-4">
          <p className="text-xs text-muted-foreground">Lowest Scorer</p>
          <p className="text-sm font-bold truncate">{stats.lowestScorer || "N/A"}</p>
        </CardContent>
      </Card>
    </div>
  );
}

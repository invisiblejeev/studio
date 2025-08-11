"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"
import type { ChartConfig } from "@/components/ui/chart"

const chartData = [
  { category: "Jobs", count: 186 },
  { category: "Events", count: 305 },
  { category: "Buy/Sell", count: 237 },
  { category: "General", count: 73 },
  { category: "Spam", count: 209 },
  { category: "Other", count: 214 },
]

const chartConfig = {
  count: {
    label: "Messages",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

const spamLogs = [
    { id: 1, message: "!!! FREE IPHONE CLICK HERE !!!", timestamp: "2023-10-27 10:00 AM", reason: "Contains 'FREE'" },
    { id: 2, message: "Make $1000 a day from home, ask me how", timestamp: "2023-10-27 11:30 AM", reason: "Contains 'Make $'" },
    { id: 3, message: "URGENT: Your account is compromised, click to fix", timestamp: "2023-10-27 01:15 PM", reason: "Contains 'URGENT'" },
    { id: 4, message: "Win a lottery you never entered!", timestamp: "2023-10-27 02:00 PM", reason: "Contains 'lottery'" },
]

export default function AdminPage() {
    return (
        <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
              <p className="text-muted-foreground">Overview of community activity and AI moderation.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Daily Summary</CardTitle>
                    <CardDescription>AI-generated summary of today's activity.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p>Today, we saw a total of 1018 messages. 209 messages were flagged as spam, primarily due to keywords like 'FREE' and 'make money'. The AI successfully categorized 186 job-related queries, 305 event discussions, and 237 buy/sell requests, helping to keep our community channels organized.</p>
                </CardContent>
            </Card>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-7">
                <Card className="lg:col-span-4">
                    <CardHeader>
                        <CardTitle>AI Classifications</CardTitle>
                        <CardDescription>Breakdown of message categories for today.</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                         <ChartContainer config={chartConfig} className="h-[300px] w-full">
                            <ResponsiveContainer>
                                <BarChart accessibilityLayer data={chartData}>
                                    <CartesianGrid vertical={false} />
                                    <XAxis
                                    dataKey="category"
                                    tickLine={false}
                                    tickMargin={10}
                                    axisLine={false}
                                    />
                                    <YAxis />
                                    <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                                    <Bar dataKey="count" fill="var(--color-count)" radius={8} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>Spam Log</CardTitle>
                        <CardDescription>Messages automatically flagged as spam.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Message</TableHead>
                                    <TableHead>Reason</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {spamLogs.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell className="font-medium truncate max-w-[150px]">{log.message}</TableCell>
                                        <TableCell><span className="text-xs bg-destructive/20 text-destructive-foreground rounded-full px-2 py-1">{log.reason}</span></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}


"use client"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"
import type { ChartConfig } from "@/components/ui/chart"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Shield, TrendingUp, ShieldAlert, Bot, Eye, Ban } from "lucide-react"

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

const spamReports = [
    { 
        id: 1, 
        status: "HIDDEN",
        message: "Get rich quick! Make $5000 per day working from home!", 
        timestamp: "8/10/2025 10:57:58 PM", 
        user: "spam.user@email.com",
        state: "California",
        keywords: ["get rich quick", "make money"]
    },
    { 
        id: 2, 
        status: "HIDDEN",
        message: "Buy cheap medications online without prescription", 
        timestamp: "8/10/2025 9:57:58 PM", 
        user: "suspicious.account@email.com",
        state: "Texas",
        keywords: ["medications", "without prescription"]
    },
    { 
        id: 3, 
        status: "PENDING",
        message: "Free iPhone giveaway! Click this link now!", 
        timestamp: "8/10/2025 8:57:58 PM",
        user: "fake.giveaway@email.com",
        state: "New York",
        keywords: []
    },
]

export default function AdminPage() {
    return (
        <div className="space-y-4 p-4">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
            </div>

            <Tabs defaultValue="spam-reports" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="analytics"><TrendingUp className="w-4 h-4 mr-2" />Analytics</TabsTrigger>
                    <TabsTrigger value="spam-reports"><ShieldAlert className="w-4 h-4 mr-2" />Spam Reports</TabsTrigger>
                    <TabsTrigger value="ai-insights"><Bot className="w-4 h-4 mr-2" />AI Insights</TabsTrigger>
                </TabsList>
                <TabsContent value="analytics" className="mt-6">
                    <Card>
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
                </TabsContent>
                <TabsContent value="spam-reports" className="mt-6 space-y-4">
                    {spamReports.map((report) => (
                        <Card key={report.id}>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <Badge variant={report.status === 'HIDDEN' ? 'secondary' : 'destructive'}>{report.status}</Badge>
                                    <p className="text-xs text-muted-foreground">{report.timestamp}</p>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="font-medium">{report.message}</p>
                                <div>
                                    <p className="text-sm text-muted-foreground">User: {report.user}</p>
                                    <p className="text-sm text-muted-foreground">State: {report.state}</p>
                                </div>
                                {report.keywords.length > 0 && (
                                    <div>
                                        <p className="text-sm font-semibold">Flagged Keywords:</p>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {report.keywords.map(keyword => (
                                                <Badge key={keyword} variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">{keyword}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter className="flex gap-2">
                                <Button variant="outline"><Eye className="w-4 h-4 mr-2" />Review</Button>
                                <Button variant="destructive"><Ban className="w-4 h-4 mr-2" />Ban User</Button>
                            </CardFooter>
                        </Card>
                    ))}
                </TabsContent>
                <TabsContent value="ai-insights" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Daily Summary</CardTitle>
                            <CardDescription>AI-generated summary of today's activity.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p>Today, we saw a total of 1018 messages. 209 messages were flagged as spam, primarily due to keywords like 'FREE' and 'make money'. The AI successfully categorized 186 job-related queries, 305 event discussions, and 237 buy/sell requests, helping to keep our community channels organized.</p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

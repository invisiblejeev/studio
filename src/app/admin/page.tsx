
"use client"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"
import type { ChartConfig } from "@/components/ui/chart"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Shield, TrendingUp, ShieldAlert, Bot, Eye, Ban, Database } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { db } from "@/lib/firebase"
import { collection, onSnapshot, query, orderBy } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"

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

interface SpamReport {
    id: string;
    status: "HIDDEN" | "PENDING";
    message: string;
    timestamp: any;
    user: string;
    state: string;
    keywords: string[];
}

interface DailySummary {
    id: string;
    summary: string;
    timestamp: any;
}


export default function AdminPage() {
    const [spamReports, setSpamReports] = useState<SpamReport[]>([]);
    const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
    const { toast } = useToast();
    const [permissionError, setPermissionError] = useState(false);

    useEffect(() => {
        const handleError = (error: any) => {
            if (error.code === 'permission-denied') {
                console.error("Firestore Permission Denied. Make sure your account has admin privileges and your Firestore security rules are configured correctly to allow access to admin collections.");
                toast({
                    title: "Permission Denied",
                    description: "You do not have permission to view admin data.",
                    variant: "destructive"
                });
                setPermissionError(true);
            } else {
                console.error("Error fetching admin data:", error);
            }
        };

        const spamQuery = query(collection(db, "spam-reports"), orderBy("timestamp", "desc"));
        const spamUnsubscribe = onSnapshot(spamQuery, (snapshot) => {
            const reports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SpamReport));
            setSpamReports(reports);
            if(permissionError) setPermissionError(false);
        }, handleError);

        const summaryQuery = query(collection(db, "daily-summaries"), orderBy("timestamp", "desc"));
        const summaryUnsubscribe = onSnapshot(summaryQuery, (snapshot) => {
            if (!snapshot.empty) {
                const summaryDoc = snapshot.docs[0];
                setDailySummary({ id: summaryDoc.id, ...summaryDoc.data() } as DailySummary);
            }
             if(permissionError) setPermissionError(false);
        }, handleError);

        return () => {
            spamUnsubscribe();
            summaryUnsubscribe();
        }
    }, [toast, permissionError]);

    const formatTimestamp = (timestamp: any) => {
        if (!timestamp) return "No date";
        return timestamp.toDate().toLocaleString();
    }

    if (permissionError) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                 <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
                <h2 className="text-2xl font-bold">Permission Denied</h2>
                <p className="text-muted-foreground max-w-md">
                    You do not have the necessary permissions to view this page. Please contact your administrator or check your Firestore security rules to ensure your account has access to the 'spam-reports' and 'daily-summaries' collections.
                </p>
                 <Link href="/admin/seed" className="mt-4">
                    <Button variant="outline">
                        <Database className="w-4 h-4 mr-2" />
                        Seed Data
                    </Button>
                </Link>
            </div>
        )
    }

    return (
        <div className="space-y-4 p-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Shield className="w-6 h-6 text-primary" />
                    <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
                </div>
                <Link href="/admin/seed">
                    <Button variant="outline">
                        <Database className="w-4 h-4 mr-2" />
                        Seed Data
                    </Button>
                </Link>
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
                    {spamReports.length > 0 ? spamReports.map((report) => (
                        <Card key={report.id}>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <Badge variant={report.status === 'HIDDEN' ? 'secondary' : 'destructive'}>{report.status}</Badge>
                                    <p className="text-xs text-muted-foreground">{formatTimestamp(report.timestamp)}</p>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="font-medium">{report.message}</p>
                                <div>
                                    <p className="text-sm text-muted-foreground">User: {report.user}</p>
                                    <p className="text-sm text-muted-foreground">State: {report.state}</p>
                                </div>
                                {report.keywords && report.keywords.length > 0 && (
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
                    )) : (
                        <p className="text-center text-muted-foreground py-8">No spam reports found. Try seeding some data!</p>
                    )}
                </TabsContent>
                <TabsContent value="ai-insights" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Daily Summary</CardTitle>
                            <CardDescription>AI-generated summary of today's activity.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p>{dailySummary ? dailySummary.summary : "No daily summary available. Try seeding some data!"}</p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

    
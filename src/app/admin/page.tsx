
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { ShieldCheck, LoaderCircle, Tag, Bell } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ChartData {
  name: string;
  count: number;
}

interface AdminData {
  requirementsByCategory: ChartData[];
  offersByType: ChartData[];
  totalRequirements: number;
  totalOffers: number;
}

export default function AdminDashboardPage() {
    const [adminData, setAdminData] = useState<AdminData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Fetch Requirements
                const reqsSnapshot = await getDocs(collection(db, 'requirements'));
                const requirementsByCategory: { [key: string]: number } = {};
                reqsSnapshot.forEach(doc => {
                    const category = doc.data().category || 'Other';
                    requirementsByCategory[category] = (requirementsByCategory[category] || 0) + 1;
                });
                
                // Fetch Offers
                const offersSnapshot = await getDocs(collection(db, 'offers'));
                const offersByType: { [key: string]: number } = {};
                offersSnapshot.forEach(doc => {
                    const type = doc.data().type || 'Other';
                    offersByType[type] = (offersByType[type] || 0) + 1;
                });

                setAdminData({
                    requirementsByCategory: Object.entries(requirementsByCategory).map(([name, count]) => ({ name, count })),
                    offersByType: Object.entries(offersByType).map(([name, count]) => ({ name, count })),
                    totalRequirements: reqsSnapshot.size,
                    totalOffers: offersSnapshot.size,
                });

            } catch (error) {
                console.error("Failed to fetch admin dashboard data:", error);
                 toast({ title: "Error", description: "Could not fetch dashboard data. Check Firestore rules.", variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [toast]);


    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <LoaderCircle className="w-8 h-8 animate-spin" />
                <p className="ml-2">Loading Admin Dashboard...</p>
            </div>
        )
    }

    return (
      <div className="space-y-8 p-4 md:p-6 lg:p-8 relative pb-24">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <ShieldCheck className="h-8 w-8 text-primary" />
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                    <p className="text-muted-foreground">
                        High-level overview of community activity.
                    </p>
                </div>
            </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Requirements</CardTitle>
                    <Tag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{adminData?.totalRequirements || 0}</div>
                    <p className="text-xs text-muted-foreground">Active posts from the community</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Offers</CardTitle>
                    <Bell className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{adminData?.totalOffers || 0}</div>
                     <p className="text-xs text-muted-foreground">Coupons & deals available</p>
                </CardContent>
            </Card>
        </div>


        <div className="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Requirements Analysis</CardTitle>
                    <CardDescription>Breakdown of community needs by category.</CardDescription>
                </CardHeader>
                <CardContent>
                   <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={adminData?.requirementsByCategory}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="count" fill="hsl(var(--primary))" name="Posts" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Offers Analysis</CardTitle>
                    <CardDescription>Breakdown of available offers by type.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={adminData?.offersByType}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false}/>
                            <YAxis fontSize={12} tickLine={false} axisLine={false}/>
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="count" fill="hsl(var(--primary))" name="Offers" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
      </div>
    )
}

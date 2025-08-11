import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const jobs = [
    { id: 1, user: { name: "Ravi Patel", avatar: "https://placehold.co/40x40.png" }, text: "Hiring a Senior React Developer in Austin, TX. 5+ years of experience needed. DM for details." },
    { id: 2, user: { name: "Sunita Rao", avatar: "https://placehold.co/40x40.png" }, text: "My startup is looking for a backend engineer (Python/Django). Fully remote position." }
]
const events = [
    { id: 1, user: { name: "Anjali Mehta", avatar: "https://placehold.co/40x40.png" }, text: "Navratri Garba event in San Jose this Saturday. Tickets are selling fast!" },
    { id: 2, user: { name: "Vikram Singh", avatar: "https://placehold.co/40x40.png" }, text: "Is anyone going to the Diwali Mela in Edison, NJ?" }
]
const buySell = [
    { id: 1, user: { name: "Priya Sharma", avatar: "https://placehold.co/40x40.png" }, text: "I'm selling my 2018 Honda Civic. Low mileage and in great condition. Looking for $15,000." },
    { id: 2, user: { name: "Rajesh Kumar", avatar: "https://placehold.co/40x40.png" }, text: "Looking to buy a used dining table. Should be able to seat 6 people. Budget is $200." }
]

const RequirementCard = ({ req }: { req: { id: number; user: { name: string; avatar: string }; text: string } }) => (
    <Card>
        <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-3">
            <Avatar>
                <AvatarImage src={req.user.avatar} data-ai-hint="person face" />
                <AvatarFallback>{req.user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <CardTitle className="text-base font-semibold">{req.user.name}</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground">{req.text}</p>
        </CardContent>
    </Card>
)

export default function RequirementsPage() {
    return (
        <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Community Requirements</h1>
              <p className="text-muted-foreground">
                  AI-categorized posts from the community chat.
              </p>
            </div>
            <Tabs defaultValue="jobs" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="jobs">Job Search</TabsTrigger>
                    <TabsTrigger value="events">Event Needs</TabsTrigger>
                    <TabsTrigger value="buy-sell">Buy/Sell Requests</TabsTrigger>
                </TabsList>
                <TabsContent value="jobs" className="mt-6 space-y-4">
                    {jobs.map(job => <RequirementCard key={job.id} req={job} />)}
                </TabsContent>
                <TabsContent value="events" className="mt-6 space-y-4">
                    {events.map(event => <RequirementCard key={event.id} req={event} />)}
                </TabsContent>
                <TabsContent value="buy-sell" className="mt-6 space-y-4">
                    {buySell.map(item => <RequirementCard key={item.id} req={item} />)}
                </TabsContent>
            </Tabs>
        </div>
    );
}

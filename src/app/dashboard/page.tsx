import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DollarSign,
  ShoppingCart,
  Users,
  Globe,
  TrendingUp,
  TrendingDown,
  Activity,
} from "lucide-react";

const stats = [
  {
    title: "Total Revenue",
    value: "$48,250",
    change: "+12.5%",
    trend: "up",
    icon: DollarSign,
    description: "vs last month",
  },
  {
    title: "Active Orders",
    value: "156",
    change: "+8.2%",
    trend: "up",
    icon: ShoppingCart,
    description: "vs last month",
  },
  {
    title: "Total Customers",
    value: "2,847",
    change: "+3.1%",
    trend: "up",
    icon: Users,
    description: "vs last month",
  },
  {
    title: "eSIMs Activated",
    value: "1,423",
    change: "-2.4%",
    trend: "down",
    icon: Globe,
    description: "vs last month",
  },
];

const recentOrders = [
  { id: "#ORD-001", customer: "John Smith", product: "eSIM - USA 5GB", amount: "$24.99", status: "completed" as const, date: "2026-07-22" },
  { id: "#ORD-002", customer: "Sarah Johnson", product: "Data Bundle - UK 10GB", amount: "$39.99", status: "processing" as const, date: "2026-07-22" },
  { id: "#ORD-003", customer: "Mike Chen", product: "eSIM - Japan 3GB", amount: "$19.99", status: "pending" as const, date: "2026-07-21" },
  { id: "#ORD-004", customer: "Emily Davis", product: "Top-Up - France 5GB", amount: "$14.99", status: "completed" as const, date: "2026-07-21" },
  { id: "#ORD-005", customer: "Alex Wilson", product: "eSIM - Global 1GB", amount: "$9.99", status: "processing" as const, date: "2026-07-20" },
];

const topProducts = [
  { name: "eSIM - USA 5GB", revenue: "$12,450", units: 498, growth: "+15%" },
  { name: "Data Bundle - UK 10GB", revenue: "$8,920", units: 223, growth: "+8%" },
  { name: "eSIM - Japan 3GB", revenue: "$6,380", units: 319, growth: "+22%" },
  { name: "eSIM - Global 1GB", revenue: "$4,950", units: 495, growth: "+5%" },
  { name: "Top-Up - France 5GB", revenue: "$3,720", units: 248, growth: "+12%" },
];

const statusVariant = {
  completed: "default" as const,
  processing: "secondary" as const,
  pending: "outline" as const,
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back! Here&apos;s what&apos;s happening with your platform today.
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center gap-1 mt-1">
                  {stat.trend === "up" ? (
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                  <span
                    className={`text-sm font-medium ${
                      stat.trend === "up" ? "text-emerald-500" : "text-red-500"
                    }`}
                  >
                    {stat.change}
                  </span>
                  <span className="text-sm text-muted-foreground ml-1">
                    {stat.description}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Two column layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Latest orders across all channels</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>{order.customer}</TableCell>
                    <TableCell className="max-w-[140px] truncate">{order.product}</TableCell>
                    <TableCell>{order.amount}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[order.status]}>
                        {order.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
            <CardDescription>Best selling products this month</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Units</TableHead>
                  <TableHead>Growth</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topProducts.map((product) => (
                  <TableRow key={product.name}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.revenue}</TableCell>
                    <TableCell>{product.units}</TableCell>
                    <TableCell>
                      <span className="text-emerald-500 font-medium">{product.growth}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Activity summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Platform Activity</CardTitle>
          </div>
          <CardDescription>
            Real-time summary of your telecom distribution platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Orders Today</p>
              <p className="text-2xl font-bold mt-1">24</p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                <span className="text-sm text-emerald-500 font-medium">+18%</span>
              </div>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Revenue Today</p>
              <p className="text-2xl font-bold mt-1">$1,847</p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                <span className="text-sm text-emerald-500 font-medium">+7%</span>
              </div>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Active eSIMs</p>
              <p className="text-2xl font-bold mt-1">892</p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingDown className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-500 font-medium">-3%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

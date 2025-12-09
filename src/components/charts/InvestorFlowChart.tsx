
"use client";

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { type InvestorFlow } from "@/types";

interface InvestorFlowChartProps {
    data: readonly InvestorFlow[];
    ticker: string;
}

export function InvestorFlowChart({ data, ticker }: InvestorFlowChartProps) {
    if (data.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Investor Flow for {ticker}</CardTitle>
                    <CardDescription>No flow data available</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Investor Flow for {ticker}</CardTitle>
                <CardDescription>
                    Inflow and Outflow per quarter
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={[...data]}
                            margin={{
                                top: 5,
                                right: 30,
                                left: 20,
                                bottom: 5,
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.25)" />
                            <XAxis
                                dataKey="quarter"
                                tick={{ fill: "#6b7280", fontSize: 12 }}
                                tickLine={{ stroke: "#6b7280" }}
                                axisLine={{ stroke: "#6b7280" }}
                            />
                            <YAxis
                                tick={{ fill: "#6b7280", fontSize: 12 }}
                                tickLine={{ stroke: "#6b7280" }}
                                axisLine={{ stroke: "#6b7280" }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "hsl(var(--card))",
                                    borderColor: "hsl(var(--border))",
                                    borderRadius: "var(--radius)",
                                    color: "hsl(var(--foreground))"
                                }}
                            />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="inflow"
                                name="Inflow"
                                stroke="#15803d" // Green similar to 'opened'
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 6 }}
                            />
                            <Line
                                type="monotone"
                                dataKey="outflow"
                                name="Outflow"
                                stroke="#dc2626" // Red similar to 'closed'
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}

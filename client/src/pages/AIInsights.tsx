import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BrainCircuit, TrendingUp, TrendingDown, Minus, Trophy, Brain } from 'lucide-react';
import api from '../api/axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export default function AIInsights() {
  const { data: scores = [], isLoading } = useQuery({
    queryKey: ['ai-scores'],
    queryFn: async () => {
      const res = await api.get('/ai/scores');
      return res.data.data || [];
    }
  });

  const getTrendIcon = (trend: string) => {
    switch(trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-emerald-500" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-destructive" />;
      default: return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
            <BrainCircuit className="w-8 h-8 text-primary mr-3" />
            AI Workforce Intelligence
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Real-time productivity scoring based on smart task completion algorithms.
          </p>
        </div>
      </div>

      {isLoading ? (
        <Card>
          <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
          </CardContent>
        </Card>
      ) : scores.length === 0 ? (
        <Card className="border-dashed bg-muted/10">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BrainCircuit className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No Data Available Yet</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              The AI engine requires employees to complete tasks before it can generate a productivity score. Assign and complete a task to see insights here!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 shadow-sm border-border overflow-hidden">
            <CardHeader className="bg-muted/30 pb-4">
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                Performance Leaderboard
              </CardTitle>
              <CardDescription>Rankings based on speed, complexity, and volume of tasks completed.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="w-[50px] text-center">Rank</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Productivity Score</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                    <TableHead className="text-right pr-6">Trend</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scores.map((score: any, index: number) => {
                    const numScore = parseFloat(score.productivity_score) || 0;
                    const clampedScore = Math.min(100, Math.max(0, numScore));
                    const isTop = index === 0;

                    return (
                      <TableRow key={index} className="transition-colors hover:bg-muted/30">
                        <TableCell className="text-center font-medium">
                          {isTop ? (
                            <Trophy className="w-5 h-5 text-amber-500 mx-auto" />
                          ) : (
                            <span className="text-muted-foreground">{index + 1}</span>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {score.name}
                          {isTop && <Badge variant="outline" className="ml-2 bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px] py-0">Top</Badge>}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">{score.role}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-3">
                            <Progress value={clampedScore} className="h-2 w-[80px]" />
                            <span className="font-bold w-10 text-sm">{clampedScore.toFixed(0)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground font-mono text-xs">
                          {(parseFloat(score.task_completion_rate || 0) * 100).toFixed(0)}%
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <div className="flex items-center justify-end gap-1.5">
                            {getTrendIcon(score.trend)}
                            <span className="text-[10px] text-muted-foreground uppercase font-bold">{score.trend}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border h-fit">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                Strategic Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
                <p className="text-xs font-bold uppercase text-primary mb-1">Skill Optimization</p>
                <p className="text-sm">The AI suggests training 2 more employees in "Solidity" to handle upcoming Web3 tasks.</p>
              </div>
              <div className="p-4 rounded-lg border border-border">
                <p className="text-xs font-bold uppercase text-muted-foreground mb-1">Workload Prediction</p>
                <p className="text-sm">Based on current trends, your team will hit peak capacity in 12 days. Plan resources accordingly.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
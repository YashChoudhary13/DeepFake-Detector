// src/components/DashboardItem.tsx
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import React from "react";

interface DashboardItemProps {
  item: {
    job_id: string;
    // thumbnail removed intentionally
    created_at?: string | number | null;
    consensus?: {
      decision: string;
      score: number;
    };
  };
}

export default function DashboardItem({ item }: DashboardItemProps) {
  // KEEP YOUR ORIGINAL LOGIC
  const decision = item.consensus?.decision || "PENDING";
  const score = Math.round((item.consensus?.score || 0) * 100);

  // Robust timestamp parsing:
  // - Accepts numeric (seconds or ms) and ISO strings
  // - If ISO parse fails, attempts to append 'Z' (treat as UTC)
  const parseTimestamp = (ts?: string | number | null): Date | null => {
    if (!ts) return null;

    // numeric string or number
    if (typeof ts === "number" || /^\d+$/.test(String(ts))) {
      const n = Number(ts);
      // heuristics: >1e12 -> milliseconds, else seconds
      return new Date(n > 1e12 ? n : n * 1000);
    }

    // try Date parsing for ISO-like strings
    let d = new Date(String(ts));
    if (!isNaN(d.getTime())) return d;

    // append Z (UTC) in case string missed timezone
    d = new Date(String(ts) + "Z");
    if (!isNaN(d.getTime())) return d;

    return null;
  };

  const parsedDate = parseTimestamp(item.created_at ?? null);

  const timeText = parsedDate
    ? formatDistanceToNow(parsedDate, { addSuffix: true })
    : "Recently";

  const getConsensusBadge = () => {
    if (!item.consensus) {
      return <Badge variant="outline">Processing</Badge>;
    }

    switch (decision) {
      case "REAL":
        return <Badge className="bg-green-600 hover:bg-green-700">Real</Badge>;
      case "FAKE":
        return <Badge variant="destructive">Fake</Badge>;
      case "UNCERTAIN":
        return <Badge className="bg-yellow-600 hover:bg-yellow-700">Uncertain</Badge>;
      default:
        return <Badge variant="outline">{decision}</Badge>;
    }
  };

  return (
    <Card className="p-6 hover-elevate transition-shadow" data-testid={`card-job-${item.job_id}`}>
      <div className="flex items-center gap-6">
        {/* Thumbnail removed intentionally */}

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium truncate" data-testid="text-job-filename">
                {item.job_id}
              </h3>

              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span data-testid="text-job-timestamp">{timeText}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {getConsensusBadge()}
              <Badge variant="secondary" data-testid="badge-job-confidence">
                {score}%
              </Badge>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-sm text-muted-foreground">
              Status: <span className="capitalize" data-testid="text-job-status">{decision.toLowerCase()}</span>
            </span>

            <Button variant="ghost" size="sm" asChild data-testid="button-view-report">
              <Link href={`/${item.job_id}`} legacyBehavior>
                <a className="flex items-center">
                  View Report
                  <ArrowRight className="h-4 w-4 ml-2" />
                </a>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

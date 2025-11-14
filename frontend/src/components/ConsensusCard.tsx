// src/components/ConsensusCard.tsx
import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, HelpCircle } from "lucide-react";

interface ConsensusProps {
  consensus?: {
    decision: string;
    score: number;
    explanation?: string[];
  };
  imageUrl?: string;
}

export default function ConsensusCard({ consensus, imageUrl }: ConsensusProps) {
  // Preserve original logic exactly
  const decision = consensus?.decision || "PENDING";
  const score = Math.round((consensus?.score || 0) * 100);
  const explanations = consensus?.explanation ?? [];

  // Map decision -> config used by Prompt UI
  const getConsensusConfig = () => {
    switch (decision) {
      case "REAL":
        return {
          icon: CheckCircle2,
          color: "text-green-600",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          label: "Likely Authentic",
        };
      case "FAKE":
        return {
          icon: XCircle,
          color: "text-red-600",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
            label: "Likely Manipulated",
        };
      case "UNCERTAIN":
        return {
          icon: HelpCircle,
          color: "text-yellow-600",
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-200",
          label: "Uncertain",
        };
      default:
        return {
          icon: HelpCircle,
          color: "text-slate-600",
          bgColor: "bg-slate-50",
          borderColor: "border-slate-200",
          label: decision,
        };
    }
  };

  const config = getConsensusConfig();
  const Icon = config.icon;

  return (
    <Card className={`p-6 border-2 ${config.borderColor}`} data-testid="card-consensus">
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`h-12 w-12 rounded-full ${config.bgColor} flex items-center justify-center flex-shrink-0`}>
              <Icon className={`h-6 w-6 ${config.color}`} />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-1" data-testid="text-consensus-label">
                {config.label}
              </h2>
              <p className="text-sm text-muted-foreground">
                Final verdict based on multiple detection models
              </p>
            </div>
          </div>

          <Badge variant="secondary" className="text-lg font-bold px-4 py-1.5" data-testid="badge-confidence">
            {score}%
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Confidence Score</span>
            <span className="text-muted-foreground">{score}%</span>
          </div>
          <Progress value={score} className="h-2" data-testid="progress-confidence" />
        </div>

        {explanations.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Key Findings</h3>
            <ul className="space-y-2" data-testid="list-explanations">
              {explanations.map((explanation, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="text-primary mt-0.5">•</span>
                  <span className="text-muted-foreground">{explanation}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
}

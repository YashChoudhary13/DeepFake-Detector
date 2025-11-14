// src/components/FeatureCard.tsx
import { Card } from "@/components/ui/card";
import { LucideIcon, Sparkles } from "lucide-react";

interface Props {
  title: string;
  desc: string;
  icon?: LucideIcon; // optional so your old code still works
}

export default function FeatureCard({ title, desc, icon: Icon }: Props) {
  const testId = `card-feature-${title.toLowerCase().replace(/\s+/g, "-")}`;

  // Default icon fallback → Sparkles (matches your current version)
  const FinalIcon = Icon || Sparkles;

  return (
    <Card
      className="p-6 hover-elevate transition-shadow"
      data-testid={testId}
    >
      <div className="flex flex-col gap-4">
        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
          <FinalIcon className="h-6 w-6 text-primary" />
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {desc}
          </p>
        </div>
      </div>
    </Card>
  );
}

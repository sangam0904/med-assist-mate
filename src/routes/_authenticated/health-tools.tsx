import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Activity, Droplets, Flame, Moon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/health-tools")({
  head: () => ({
    meta: [
      { title: "Health Tools — MedAssist AI" },
      {
        name: "description",
        content: "Track BMI, water intake, calories and sleep with a clear weekly view.",
      },
      { property: "og:title", content: "Health Tools — MedAssist AI" },
      {
        property: "og:description",
        content: "Track BMI, water intake, calories and sleep with a clear weekly view.",
      },
    ],
  }),
  component: HealthTools,
});

const TRACKERS = [
  { kind: "water", label: "Water", unit: "ml", icon: Droplets, step: 250 },
  { kind: "calories", label: "Calories", unit: "kcal", icon: Flame, step: 100 },
  { kind: "sleep", label: "Sleep", unit: "hours", icon: Moon, step: 1 },
] as const;

function HealthTools() {
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [totals, setTotals] = useState<Record<string, number>>({});
  const today = new Date().toISOString().slice(0, 10);

  const bmi =
    Number(height) > 0 && Number(weight) > 0
      ? Number(weight) / (Number(height) / 100) ** 2
      : null;

  const bmiLabel = !bmi
    ? ""
    : bmi < 18.5
      ? "Underweight"
      : bmi < 25
        ? "Healthy weight"
        : bmi < 30
          ? "Overweight"
          : "Obese";

  async function load() {
    const { data } = await supabase
      .from("health_logs")
      .select("kind,value")
      .eq("logged_on", today);
    const next: Record<string, number> = {};
    for (const row of data ?? []) next[row.kind] = (next[row.kind] ?? 0) + Number(row.value);
    setTotals(next);
  }

  useEffect(() => {
    void load();
    supabase
      .from("profiles")
      .select("height_cm,weight_kg")
      .maybeSingle()
      .then(({ data }) => {
        if (data?.height_cm) setHeight(String(data.height_cm));
        if (data?.weight_kg) setWeight(String(data.weight_kg));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function log(kind: string, value: number, unit: string) {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) return;
    const { error } = await supabase
      .from("health_logs")
      .insert({ user_id: uid, kind, value, unit, logged_on: today });
    if (error) {
      toast.error("Could not save this entry");
      return;
    }
    setTotals((prev) => ({ ...prev, [kind]: (prev[kind] ?? 0) + value }));
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold sm:text-3xl">Health tools</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Quick daily tracking for the numbers that matter.
        </p>
      </header>

      <section className="surface-card space-y-4 p-5">
        <div className="flex items-center gap-2">
          <Activity className="size-4 text-primary" />
          <h2 className="text-base font-semibold">BMI calculator</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="height">Height (cm)</Label>
            <Input
              id="height"
              inputMode="numeric"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="weight">Weight (kg)</Label>
            <Input
              id="weight"
              inputMode="numeric"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </div>
          <div className="flex flex-col justify-end">
            <p className="text-xs text-muted-foreground">Your BMI</p>
            <p className="text-2xl font-semibold">{bmi ? bmi.toFixed(1) : "—"}</p>
            <p className="text-xs text-muted-foreground">{bmiLabel}</p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        {TRACKERS.map(({ kind, label, unit, icon: Icon, step }) => (
          <section key={kind} className="surface-card p-5">
            <span className="inline-flex size-9 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <Icon className="size-4.5" />
            </span>
            <h2 className="mt-3 text-sm font-semibold">{label} today</h2>
            <p className="mt-1 text-2xl font-semibold">
              {totals[kind] ?? 0}{" "}
              <span className="text-sm font-normal text-muted-foreground">{unit}</span>
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 w-full"
              onClick={() => log(kind, step, unit)}
            >
              + {step} {unit}
            </Button>
          </section>
        ))}
      </div>
    </div>
  );
}

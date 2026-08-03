import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Activity,
  ArrowRight,
  Droplets,
  FileText,
  MessageSquareHeart,
  Pill,
  Stethoscope,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { MEDICAL_DISCLAIMER } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — MedAssist AI" },
      {
        name: "description",
        content: "Your health overview: medicines due today, recent checks and daily tracking.",
      },
      { property: "og:title", content: "Dashboard — MedAssist AI" },
      {
        property: "og:description",
        content: "Your health overview: medicines due today, recent checks and daily tracking.",
      },
    ],
  }),
  component: Dashboard,
});

const QUICK_ACTIONS = [
  { to: "/chat", label: "Ask the AI doctor", icon: MessageSquareHeart },
  { to: "/symptoms", label: "Check symptoms", icon: Stethoscope },
  { to: "/reports", label: "Analyse a report", icon: FileText },
  { to: "/health-tools", label: "Log health data", icon: Activity },
] as const;

type Stats = {
  name: string;
  medicines: number;
  checks: number;
  reports: number;
  water: number;
  lastRisk: string | null;
};

function riskClass(risk: string | null) {
  if (risk === "high") return "bg-risk-high text-risk-high-foreground";
  if (risk === "medium") return "bg-risk-medium text-risk-medium-foreground";
  if (risk === "low") return "bg-risk-low text-risk-low-foreground";
  return "bg-muted text-muted-foreground";
}

function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      const today = new Date().toISOString().slice(0, 10);
      const [profile, medicines, checks, reports, water] = await Promise.all([
        supabase.from("profiles").select("full_name").maybeSingle(),
        supabase.from("medicines").select("id,times").eq("active", true),
        supabase
          .from("symptom_checks")
          .select("risk_level,created_at")
          .order("created_at", { ascending: false })
          .limit(5),
        supabase.from("lab_reports").select("id"),
        supabase.from("health_logs").select("value").eq("kind", "water").eq("logged_on", today),
      ]);
      if (!active) return;
      setStats({
        name: profile.data?.full_name ?? "there",
        medicines: (medicines.data ?? []).reduce((sum, m) => sum + (m.times?.length ?? 0), 0),
        checks: checks.data?.length ?? 0,
        reports: reports.data?.length ?? 0,
        water: (water.data ?? []).reduce((sum, r) => sum + Number(r.value), 0),
        lastRisk: checks.data?.[0]?.risk_level ?? null,
      });
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm text-muted-foreground">Welcome back</p>
        <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">
          Hello, {stats?.name ?? "there"} 👋
        </h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Here's a snapshot of your health today.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Pill}
          label="Doses scheduled today"
          value={stats ? String(stats.medicines) : "—"}
          to="/medicines"
        />
        <StatCard
          icon={Droplets}
          label="Water today"
          value={stats ? `${stats.water} ml` : "—"}
          to="/health-tools"
        />
        <StatCard
          icon={FileText}
          label="Lab reports saved"
          value={stats ? String(stats.reports) : "—"}
          to="/reports"
        />
        <div className="surface-card p-5">
          <span className="inline-flex size-9 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <Stethoscope className="size-4.5" />
          </span>
          <p className="mt-3 text-xs text-muted-foreground">Latest symptom check</p>
          <span
            className={cn(
              "mt-1.5 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize",
              riskClass(stats?.lastRisk ?? null),
            )}
          >
            {stats?.lastRisk ? `${stats.lastRisk} risk` : "No checks yet"}
          </span>
        </div>
      </div>

      <section className="surface-card p-5">
        <h2 className="text-base font-semibold">Quick actions</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_ACTIONS.map(({ to, label, icon: Icon }) => (
            <Button key={to} asChild variant="outline" className="h-auto justify-start gap-3 py-3">
              <Link to={to}>
                <Icon className="size-4 text-primary" />
                <span className="text-sm">{label}</span>
              </Link>
            </Button>
          ))}
        </div>
      </section>

      <section className="surface-card gradient-primary flex flex-col gap-3 p-6 text-primary-foreground sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Feeling unwell right now?</h2>
          <p className="mt-1 text-sm opacity-90">
            Describe your symptoms and get guidance in under a minute.
          </p>
        </div>
        <Button asChild variant="secondary">
          <Link to="/chat">
            Start a chat <ArrowRight className="size-4" />
          </Link>
        </Button>
      </section>

      <p className="text-xs text-muted-foreground">{MEDICAL_DISCLAIMER}</p>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  to,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  to: "/medicines" | "/health-tools" | "/reports";
}) {
  return (
    <Link to={to} className="surface-card block p-5 transition-shadow hover:shadow-lift">
      <span className="inline-flex size-9 items-center justify-center rounded-xl bg-primary-soft text-primary">
        <Icon className="size-4.5" />
      </span>
      <p className="mt-3 text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </Link>
  );
}

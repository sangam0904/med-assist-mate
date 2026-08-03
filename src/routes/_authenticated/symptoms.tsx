import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Stethoscope } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { analyzeSymptoms, type SymptomAnalysis } from "@/lib/ai.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { COMMON_SYMPTOMS, MEDICAL_DISCLAIMER } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/symptoms")({
  head: () => ({
    meta: [
      { title: "Symptom Checker — MedAssist AI" },
      {
        name: "description",
        content: "Select your symptoms and get a risk level, possible causes and self-care steps.",
      },
      { property: "og:title", content: "Symptom Checker — MedAssist AI" },
      {
        property: "og:description",
        content: "Select your symptoms and get a risk level, possible causes and self-care steps.",
      },
    ],
  }),
  component: SymptomsPage,
});

const riskStyles: Record<string, string> = {
  low: "bg-risk-low text-risk-low-foreground",
  medium: "bg-risk-medium text-risk-medium-foreground",
  high: "bg-risk-high text-risk-high-foreground",
};

function SymptomsPage() {
  const analyze = useServerFn(analyzeSymptoms);
  const [selected, setSelected] = useState<string[]>([]);
  const [custom, setCustom] = useState("");
  const [duration, setDuration] = useState("");
  const [severity, setSeverity] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SymptomAnalysis | null>(null);

  function toggle(symptom: string) {
    setSelected((prev) =>
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom],
    );
  }

  async function run() {
    const symptoms = [
      ...selected,
      ...custom
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    ];
    if (symptoms.length === 0) {
      toast.error("Select or type at least one symptom");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("age,gender,language")
        .maybeSingle();
      const analysis = await analyze({
        data: {
          symptoms,
          duration: duration || undefined,
          severity: severity || undefined,
          notes: notes || undefined,
          age: profile?.age ?? null,
          gender: profile?.gender ?? null,
          language: profile?.language ?? "en",
        },
      });
      setResult(analysis);
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        await supabase.from("symptom_checks").insert({
          user_id: userData.user.id,
          symptoms,
          notes: notes || null,
          risk_level: analysis.risk_level,
          summary: analysis.summary,
          possible_conditions: analysis.possible_conditions,
          self_care: analysis.self_care,
          red_flags: analysis.red_flags,
        });
      }
    } catch (error) {
      console.error(error);
      toast.error("Could not analyse your symptoms. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold sm:text-3xl">Symptom checker</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Pick what you are feeling. You will get a risk level, likely causes, home care tips and
          warning signs that need a doctor.
        </p>
      </header>

      <section className="surface-card space-y-5 p-5">
        <div>
          <Label>Common symptoms</Label>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {COMMON_SYMPTOMS.map((symptom) => (
              <button
                key={symptom}
                type="button"
                onClick={() => toggle(symptom)}
                className={cn(
                  "rounded-full border border-border px-3.5 py-1.5 text-sm transition-colors",
                  selected.includes(symptom)
                    ? "border-primary bg-primary-soft text-primary"
                    : "bg-card hover:bg-accent",
                )}
              >
                {symptom}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="custom">Other symptoms</Label>
            <Input
              id="custom"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="comma separated"
              maxLength={300}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="duration">Duration</Label>
            <Input
              id="duration"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="e.g. 3 days"
              maxLength={100}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="severity">Severity</Label>
            <Input
              id="severity"
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              placeholder="mild / moderate / severe"
              maxLength={60}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="notes">Anything else?</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={2000}
            placeholder="Existing conditions, medicines you take, recent travel..."
          />
        </div>

        <Button onClick={run} disabled={loading}>
          <Stethoscope className="size-4" /> Analyse symptoms
        </Button>
      </section>

      {loading && (
        <div className="surface-card p-6">
          <Shimmer>Reviewing your symptoms...</Shimmer>
        </div>
      )}

      {result && (
        <section className="surface-card space-y-5 p-5">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold capitalize",
                riskStyles[result.risk_level] ?? "bg-muted",
              )}
            >
              {result.risk_level} risk
            </span>
            <span className="text-xs text-muted-foreground">
              Suggested specialist: {result.suggested_specialist}
            </span>
          </div>
          <p className="text-sm leading-relaxed">{result.summary}</p>

          {result.possible_conditions.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold">Possible causes</h2>
              <ul className="mt-2 space-y-2">
                {result.possible_conditions.map((c) => (
                  <li key={c.name} className="rounded-xl bg-muted px-3.5 py-2.5 text-sm">
                    <span className="font-medium">{c.name}</span>{" "}
                    <span className="text-xs text-muted-foreground">({c.likelihood})</span>
                    {c.why && <p className="mt-1 text-xs text-muted-foreground">{c.why}</p>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.self_care.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold">Self-care you can try</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {result.self_care.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          )}

          {result.red_flags.length > 0 && (
            <div className="rounded-xl bg-risk-high p-4">
              <h2 className="text-sm font-semibold text-risk-high-foreground">
                See a doctor urgently if
              </h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-risk-high-foreground">
                {result.red_flags.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-xs text-muted-foreground">{MEDICAL_DISCLAIMER}</p>
        </section>
      )}
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertTriangle, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { EMERGENCY_NUMBERS, MEDICAL_DISCLAIMER } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/emergency")({
  head: () => ({
    meta: [
      { title: "Emergency Help — MedAssist AI" },
      {
        name: "description",
        content: "One-tap emergency numbers plus your blood group, allergies and emergency contact.",
      },
      { property: "og:title", content: "Emergency Help — MedAssist AI" },
      {
        property: "og:description",
        content: "One-tap emergency numbers plus your blood group, allergies and emergency contact.",
      },
    ],
  }),
  component: EmergencyPage,
});

type Vitals = {
  blood_group: string | null;
  allergies: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
};

function EmergencyPage() {
  const [vitals, setVitals] = useState<Vitals | null>(null);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("blood_group,allergies,emergency_contact_name,emergency_contact_phone")
      .maybeSingle()
      .then(({ data }) => setVitals(data ?? null));
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold sm:text-3xl">Emergency help</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          If someone is unresponsive, bleeding heavily, or has chest pain or stroke signs, call
          emergency services immediately.
        </p>
      </header>

      <div className="rounded-2xl bg-risk-high p-5 text-risk-high-foreground">
        <div className="flex items-center gap-2">
          <AlertTriangle className="size-4" />
          <h2 className="text-sm font-semibold">Call 112 for any life-threatening emergency</h2>
        </div>
        <a
          href="tel:112"
          className="mt-3 inline-flex items-center gap-2 rounded-xl bg-card px-4 py-2.5 text-sm font-semibold text-foreground"
        >
          <Phone className="size-4" /> Call 112 now
        </a>
      </div>

      <section className="grid gap-3 sm:grid-cols-2">
        {EMERGENCY_NUMBERS.map((item) => (
          <a
            key={item.number}
            href={`tel:${item.number.replace(/[^0-9]/g, "")}`}
            className="surface-card flex items-center justify-between gap-3 p-4 transition-shadow hover:shadow-lift"
          >
            <div>
              <p className="text-sm font-semibold">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.note}</p>
            </div>
            <span className="rounded-full bg-primary-soft px-3 py-1.5 text-sm font-semibold text-primary">
              {item.number}
            </span>
          </a>
        ))}
      </section>

      <section className="surface-card space-y-2 p-5">
        <h2 className="text-base font-semibold">Your emergency card</h2>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-muted-foreground">Blood group</dt>
            <dd>{vitals?.blood_group ?? "Not set"}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Allergies</dt>
            <dd>{vitals?.allergies ?? "None recorded"}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Emergency contact</dt>
            <dd>{vitals?.emergency_contact_name ?? "Not set"}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Contact number</dt>
            <dd>
              {vitals?.emergency_contact_phone ? (
                <a className="text-primary" href={`tel:${vitals.emergency_contact_phone}`}>
                  {vitals.emergency_contact_phone}
                </a>
              ) : (
                "Not set"
              )}
            </dd>
          </div>
        </dl>
      </section>

      <p className="text-xs text-muted-foreground">{MEDICAL_DISCLAIMER}</p>
    </div>
  );
}

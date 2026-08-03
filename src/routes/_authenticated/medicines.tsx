import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, Pill, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/medicines")({
  head: () => ({
    meta: [
      { title: "Medicine Reminders — MedAssist AI" },
      {
        name: "description",
        content: "Schedule your medicines, see today's doses and log what you have taken.",
      },
      { property: "og:title", content: "Medicine Reminders — MedAssist AI" },
      {
        property: "og:description",
        content: "Schedule your medicines, see today's doses and log what you have taken.",
      },
    ],
  }),
  component: MedicinesPage,
});

type Medicine = {
  id: string;
  name: string;
  dosage: string | null;
  frequency: string;
  times: string[];
  notes: string | null;
};

function MedicinesPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [takenKeys, setTakenKeys] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [times, setTimes] = useState("09:00, 21:00");
  const [saving, setSaving] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  async function load() {
    const [meds, logs] = await Promise.all([
      supabase
        .from("medicines")
        .select("id,name,dosage,frequency,times,notes")
        .eq("active", true)
        .order("created_at", { ascending: true }),
      supabase
        .from("medicine_logs")
        .select("medicine_id,scheduled_for,status")
        .gte("scheduled_for", `${today}T00:00:00`)
        .lte("scheduled_for", `${today}T23:59:59`),
    ]);
    setMedicines(meds.data ?? []);
    setTakenKeys(
      (logs.data ?? [])
        .filter((l) => l.status === "taken")
        .map((l) => `${l.medicine_id}-${new Date(l.scheduled_for).toISOString().slice(11, 16)}`),
    );
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addMedicine(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Enter the medicine name");
      return;
    }
    const parsedTimes = times
      .split(",")
      .map((t) => t.trim())
      .filter((t) => /^\d{2}:\d{2}$/.test(t));
    if (parsedTimes.length === 0) {
      toast.error("Add times as HH:MM, comma separated");
      return;
    }
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) {
      setSaving(false);
      return;
    }
    const { error } = await supabase.from("medicines").insert({
      user_id: uid,
      name: name.trim(),
      dosage: dosage.trim() || null,
      frequency: `${parsedTimes.length}x daily`,
      times: parsedTimes,
    });
    setSaving(false);
    if (error) {
      toast.error("Could not save this medicine");
      return;
    }
    setName("");
    setDosage("");
    toast.success("Medicine added");
    void load();
  }

  async function markTaken(medicineId: string, time: string) {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) return;
    const { error } = await supabase.from("medicine_logs").insert({
      user_id: uid,
      medicine_id: medicineId,
      scheduled_for: new Date(`${today}T${time}:00`).toISOString(),
      status: "taken",
    });
    if (error) {
      toast.error("Could not log this dose");
      return;
    }
    setTakenKeys((prev) => [...prev, `${medicineId}-${time}`]);
    toast.success("Dose logged");
  }

  async function remove(id: string) {
    const { error } = await supabase.from("medicines").update({ active: false }).eq("id", id);
    if (error) {
      toast.error("Could not remove this medicine");
      return;
    }
    setMedicines((prev) => prev.filter((m) => m.id !== id));
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold sm:text-3xl">Medicine reminders</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Track your prescriptions and tick off each dose as you take it.
        </p>
      </header>

      <form onSubmit={addMedicine} className="surface-card grid gap-4 p-5 sm:grid-cols-4">
        <div className="space-y-1.5 sm:col-span-1">
          <Label htmlFor="med-name">Medicine</Label>
          <Input
            id="med-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Paracetamol"
            maxLength={120}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="med-dose">Dosage</Label>
          <Input
            id="med-dose"
            value={dosage}
            onChange={(e) => setDosage(e.target.value)}
            placeholder="500 mg"
            maxLength={80}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="med-times">Times (HH:MM)</Label>
          <Input
            id="med-times"
            value={times}
            onChange={(e) => setTimes(e.target.value)}
            maxLength={120}
          />
        </div>
        <div className="flex items-end">
          <Button type="submit" className="w-full" disabled={saving}>
            <Pill className="size-4" /> Add
          </Button>
        </div>
      </form>

      <section className="space-y-3">
        {medicines.length === 0 && (
          <p className="surface-card p-6 text-center text-sm text-muted-foreground">
            No medicines yet. Add your first one above.
          </p>
        )}
        {medicines.map((med) => (
          <article key={med.id} className="surface-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">{med.name}</h2>
                <p className="text-xs text-muted-foreground">
                  {[med.dosage, med.frequency].filter(Boolean).join(" · ")}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Remove ${med.name}`}
                onClick={() => remove(med.id)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {med.times.map((time) => {
                const done = takenKeys.includes(`${med.id}-${time}`);
                return (
                  <Button
                    key={time}
                    size="sm"
                    variant={done ? "secondary" : "outline"}
                    disabled={done}
                    onClick={() => markTaken(med.id, time)}
                  >
                    {done && <Check className="size-3.5" />} {time}
                    {done ? " taken" : ""}
                  </Button>
                );
              })}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

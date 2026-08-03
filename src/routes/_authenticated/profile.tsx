import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Your Profile — MedAssist AI" },
      {
        name: "description",
        content: "Keep your health profile, allergies and emergency contact up to date.",
      },
      { property: "og:title", content: "Your Profile — MedAssist AI" },
      {
        property: "og:description",
        content: "Keep your health profile, allergies and emergency contact up to date.",
      },
    ],
  }),
  component: ProfilePage;
});

type Form = {
  full_name: string;
  age: string;
  gender: string;
  blood_group: string;
  height_cm: string;
  weight_kg: string;
  allergies: string;
  medical_history: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  language: string;
};

const EMPTY: Form = {
  full_name: "",
  age: "",
  gender: "",
  blood_group: "",
  height_cm: "",
  weight_kg: "",
  allergies: "",
  medical_history: "",
  emergency_contact_name: "",
  emergency_contact_phone: "",
  language: "en",
};

function ProfilePage() {
  const [form, setForm] = useState<Form>(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("*")
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setForm({
          full_name: data.full_name ?? "",
          age: data.age ? String(data.age) : "",
          gender: data.gender ?? "",
          blood_group: data.blood_group ?? "",
          height_cm: data.height_cm ? String(data.height_cm) : "",
          weight_kg: data.weight_kg ? String(data.weight_kg) : "",
          allergies: data.allergies ?? "",
          medical_history: data.medical_history ?? "",
          emergency_contact_name: data.emergency_contact_name ?? "",
          emergency_contact_phone: data.emergency_contact_phone ?? "",
          language: data.language ?? "en",
        });
      });
  }, []);

  function set(key: keyof Form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) {
      setSaving(false);
      return;
    }
    const { error } = await supabase.from("profiles").upsert({
      id: uid,
      full_name: form.full_name.trim() || null,
      age: form.age ? Number(form.age) : null,
      gender: form.gender.trim() || null,
      blood_group: form.blood_group.trim() || null,
      height_cm: form.height_cm ? Number(form.height_cm) : null,
      weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
      allergies: form.allergies.trim() || null,
      medical_history: form.medical_history.trim() || null,
      emergency_contact_name: form.emergency_contact_name.trim() || null,
      emergency_contact_phone: form.emergency_contact_phone.trim() || null,
      language: form.language || "en",
    });
    setSaving(false);
    if (error) {
      toast.error("Could not save your profile");
      return;
    }
    toast.success("Profile saved");
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold sm:text-3xl">Your profile</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          These details help MedAssist AI give safer, more personal guidance.
        </p>
      </header>

      <section className="surface-card grid gap-4 p-5 sm:grid-cols-2">
        <Field id="full_name" label="Full name" value={form.full_name} onChange={set} />
        <Field id="age" label="Age" value={form.age} onChange={set} inputMode="numeric" />
        <Field id="gender" label="Gender" value={form.gender} onChange={set} />
        <Field id="blood_group" label="Blood group" value={form.blood_group} onChange={set} />
        <Field id="height_cm" label="Height (cm)" value={form.height_cm} onChange={set} inputMode="numeric" />
        <Field id="weight_kg" label="Weight (kg)" value={form.weight_kg} onChange={set} inputMode="numeric" />
        <Field
          id="emergency_contact_name"
          label="Emergency contact name"
          value={form.emergency_contact_name}
          onChange={set}
        />
        <Field
          id="emergency_contact_phone"
          label="Emergency contact phone"
          value={form.emergency_contact_phone}
          onChange={set}
        />
      </section>

      <section className="surface-card grid gap-4 p-5">
        <div className="space-y-1.5">
          <Label htmlFor="allergies">Allergies</Label>
          <Textarea
            id="allergies"
            value={form.allergies}
            maxLength={1000}
            onChange={(e) => set("allergies", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="medical_history">Medical history</Label>
          <Textarea
            id="medical_history"
            value={form.medical_history}
            maxLength={2000}
            onChange={(e) => set("medical_history", e.target.value)}
          />
        </div>
      </section>

      <Button type="submit" disabled={saving}>
        Save profile
      </Button>
    </form>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  inputMode,
}: {
  id: keyof Form;
  label: string;
  value: string;
  onChange: (key: keyof Form, value: string) => void;
  inputMode?: "numeric";
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        maxLength={120}
        inputMode={inputMode}
        onChange={(e) => onChange(id, e.target.value)}
      />
    </div>
  );
}

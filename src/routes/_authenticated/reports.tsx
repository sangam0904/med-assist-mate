import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { FileText, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { analyzeReport, type ReportAnalysis } from "@/lib/ai.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { MEDICAL_DISCLAIMER } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "Lab Report Analysis — MedAssist AI" },
      {
        name: "description",
        content: "Upload a lab report and get each parameter explained in plain language.",
      },
      { property: "og:title", content: "Lab Report Analysis — MedAssist AI" },
      {
        property: "og:description",
        content: "Upload a lab report and get each parameter explained in plain language.",
      },
    ],
  }),
  component: ReportsPage,
});

type SavedReport = {
  id: string;
  file_name: string;
  ai_summary: string | null;
  created_at: string;
};

function ReportsPage() {
  const analyze = useServerFn(analyzeReport);
  const [file, setFile] = useState<File | null>(null);
  const [reportText, setReportText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReportAnalysis | null>(null);
  const [saved, setSaved] = useState<SavedReport[]>([]);

  async function load() {
    const { data } = await supabase
      .from("lab_reports")
      .select("id,file_name,ai_summary,created_at")
      .order("created_at", { ascending: false });
    setSaved(data ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function run() {
    if (reportText.trim().length < 10) {
      toast.error("Paste the report values or key text (at least a few lines)");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) return;

      let filePath = `${uid}/manual-${Date.now()}.txt`;
      if (file) {
        const path = `${uid}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage.from("reports").upload(path, file);
        if (uploadError) toast.error("File upload failed, analysing the pasted text only");
        else filePath = path;
      }

      const { data: profile } = await supabase.from("profiles").select("language").maybeSingle();
      const analysis = await analyze({
        data: {
          fileName: file?.name ?? "Pasted report",
          reportText: reportText.trim().slice(0, 20000),
          language: profile?.language ?? "en",
        },
      });
      setResult(analysis);

      await supabase.from("lab_reports").insert({
        user_id: uid,
        file_name: file?.name ?? "Pasted report",
        file_path: filePath,
        file_type: file?.type ?? "text/plain",
        extracted_text: reportText.trim().slice(0, 20000),
        ai_summary: analysis.summary,
        findings: analysis.findings,
        status: "analysed",
      });
      void load();
    } catch (error) {
      console.error(error);
      toast.error("Could not analyse this report. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold sm:text-3xl">Lab report analysis</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Upload your report for safe storage and paste its values below to get a plain-language
          explanation of every parameter.
        </p>
      </header>

      <section className="surface-card space-y-4 p-5">
        <div className="space-y-1.5">
          <Label htmlFor="report-file">Report file (optional)</Label>
          <Input
            id="report-file"
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.txt"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="report-text">Report values</Label>
          <Textarea
            id="report-text"
            rows={8}
            maxLength={20000}
            value={reportText}
            onChange={(e) => setReportText(e.target.value)}
            placeholder={"Haemoglobin 11.2 g/dL (13-17)\nFasting glucose 118 mg/dL (70-100)"}
          />
        </div>
        <Button onClick={run} disabled={loading}>
          <Upload className="size-4" /> Analyse report
        </Button>
      </section>

      {loading && (
        <div className="surface-card p-6">
          <Shimmer>Reading your report...</Shimmer>
        </div>
      )}

      {result && (
        <section className="surface-card space-y-5 p-5">
          <p className="text-sm leading-relaxed">{result.summary}</p>
          {result.findings.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase text-muted-foreground">
                    <th className="py-2 pr-4">Parameter</th>
                    <th className="py-2 pr-4">Value</th>
                    <th className="py-2 pr-4">Reference</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {result.findings.map((f) => (
                    <tr key={f.parameter} className="border-t border-border align-top">
                      <td className="py-2.5 pr-4 font-medium">
                        {f.parameter}
                        {f.meaning && (
                          <p className="mt-1 text-xs font-normal text-muted-foreground">
                            {f.meaning}
                          </p>
                        )}
                      </td>
                      <td className="py-2.5 pr-4">{f.value}</td>
                      <td className="py-2.5 pr-4 text-muted-foreground">{f.reference}</td>
                      <td className="py-2.5 capitalize">{f.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {result.advice.length > 0 && (
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {result.advice.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          )}
          {result.follow_up && <p className="text-sm">{result.follow_up}</p>}
          <p className="text-xs text-muted-foreground">{MEDICAL_DISCLAIMER}</p>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Saved reports</h2>
        {saved.length === 0 && (
          <p className="surface-card p-5 text-sm text-muted-foreground">No reports yet.</p>
        )}
        {saved.map((report) => (
          <article key={report.id} className="surface-card flex gap-3 p-4">
            <FileText className="mt-0.5 size-4 shrink-0 text-primary" />
            <div>
              <h3 className="text-sm font-medium">{report.file_name}</h3>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                {report.ai_summary ?? "Awaiting analysis"}
              </p>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

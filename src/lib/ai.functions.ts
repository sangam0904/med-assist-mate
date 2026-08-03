import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { CHAT_MODEL, createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

function parseJsonBlock(raw: string): unknown {
  const cleaned = raw
    .replace(/^\s*```(?:json)?/i, "")
    .replace(/```\s*$/, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("AI returned an unreadable response.");
  return JSON.parse(cleaned.slice(start, end + 1));
}

async function runJsonPrompt(system: string, prompt: string) {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI is not configured.");
  const gateway = createLovableAiGatewayProvider(key);
  const { text } = await generateText({
    model: gateway(CHAT_MODEL),
    system,
    prompt,
  });
  return parseJsonBlock(text);
}

/* ------------------------------- symptoms ------------------------------- */

const SymptomInput = z.object({
  symptoms: z.array(z.string().min(1)).min(1).max(20),
  duration: z.string().max(120).optional(),
  severity: z.string().max(60).optional(),
  notes: z.string().max(2000).optional(),
  age: z.number().int().min(0).max(120).nullable().optional(),
  gender: z.string().max(40).nullable().optional(),
  language: z.string().max(20).optional(),
});

const SymptomResult = z.object({
  risk_level: z.enum(["low", "medium", "high"]).catch("medium"),
  summary: z.string(),
  possible_conditions: z
    .array(
      z.object({
        name: z.string(),
        likelihood: z.string().default("possible"),
        why: z.string().default(""),
      }),
    )
    .default([]),
  self_care: z.array(z.string()).default([]),
  red_flags: z.array(z.string()).default([]),
  suggested_specialist: z.string().default("General physician"),
});

export type SymptomAnalysis = z.infer<typeof SymptomResult>;

export const analyzeSymptoms = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => SymptomInput.parse(input))
  .handler(async ({ data }) => {
    const system = `You are a cautious medical triage assistant. You never diagnose definitively and never prescribe prescription medication.
Reply with STRICT JSON only, no markdown fences, matching exactly:
{"risk_level":"low|medium|high","summary":"2-3 sentence plain-language summary","possible_conditions":[{"name":"","likelihood":"likely|possible|less likely","why":""}],"self_care":["..."],"red_flags":["..."],"suggested_specialist":""}
Write the text values in the user's language.`;

    const prompt = [
      `Language: ${data.language ?? "English"}`,
      `Patient age: ${data.age ?? "unknown"}, gender: ${data.gender ?? "unknown"}`,
      `Symptoms: ${data.symptoms.join(", ")}`,
      `Duration: ${data.duration ?? "not specified"}`,
      `Severity: ${data.severity ?? "not specified"}`,
      `Extra notes: ${data.notes ?? "none"}`,
    ].join("\n");

    return SymptomResult.parse(await runJsonPrompt(system, prompt));
  });

/* ------------------------------- reports -------------------------------- */

const ReportInput = z.object({
  fileName: z.string().max(300),
  reportText: z.string().min(10).max(20000),
  language: z.string().max(20).optional(),
});

const ReportResult = z.object({
  summary: z.string(),
  findings: z
    .array(
      z.object({
        parameter: z.string(),
        value: z.string().default(""),
        reference: z.string().default(""),
        status: z.enum(["normal", "low", "high", "unclear"]).catch("unclear"),
        meaning: z.string().default(""),
      }),
    )
    .default([]),
  advice: z.array(z.string()).default([]),
  follow_up: z.string().default(""),
});

export type ReportAnalysis = z.infer<typeof ReportResult>;

export const analyzeReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ReportInput.parse(input))
  .handler(async ({ data }) => {
    const system = `You explain medical lab reports to patients in simple language. You never diagnose or prescribe.
Reply with STRICT JSON only, no markdown fences, matching exactly:
{"summary":"plain-language overview","findings":[{"parameter":"","value":"","reference":"","status":"normal|low|high|unclear","meaning":""}],"advice":["..."],"follow_up":"what to discuss with a doctor"}
Write the text values in the user's language.`;

    const prompt = `Language: ${data.language ?? "English"}\nReport file: ${data.fileName}\n\nReport content:\n${data.reportText}`;

    return ReportResult.parse(await runJsonPrompt(system, prompt));
  });

/* -------------------------------- title --------------------------------- */

export const generateThreadTitle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ message: z.string().min(1).max(2000) }).parse(input))
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return { title: data.message.slice(0, 48) };
    try {
      const gateway = createLovableAiGatewayProvider(key);
      const { text } = await generateText({
        model: gateway(CHAT_MODEL),
        system:
          "Write a 3-5 word title for this health conversation. Reply with the title only, no quotes.",
        prompt: data.message,
      });
      return { title: text.trim().replace(/^["']|["']$/g, "").slice(0, 60) || "New chat" };
    } catch {
      return { title: data.message.slice(0, 48) };
    }
  });

import { Link, createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  FileText,
  MessageSquareHeart,
  Phone,
  Pill,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { APP_NAME, MEDICAL_DISCLAIMER } from "@/lib/constants";
import heroImage from "@/assets/hero-medassist.jpg";
import logo from "@/assets/medassist-logo.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MedAssist AI — AI Health Companion, Symptom Checker & Reports" },
      {
        name: "description",
        content:
          "Chat with an AI health assistant, check symptoms, decode lab reports, track medicines and monitor daily health — all in one secure app.",
      },
      { property: "og:title", content: "MedAssist AI — AI Health Companion" },
      {
        property: "og:description",
        content:
          "AI medical chat, symptom checker, lab report analysis and medicine reminders in one secure app.",
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: MessageSquareHeart,
    title: "AI Doctor Chat",
    body: "Ask health questions in English or Hindi and get calm, structured guidance with follow-up questions.",
  },
  {
    icon: Stethoscope,
    title: "Symptom Checker",
    body: "Select symptoms and get a risk level, possible causes, self-care steps and red flags to watch.",
  },
  {
    icon: FileText,
    title: "Lab Report Analysis",
    body: "Upload a report and see each parameter explained in plain language with next steps.",
  },
  {
    icon: Pill,
    title: "Medicine Reminders",
    body: "Schedule doses, log what you have taken and keep an adherence history.",
  },
  {
    icon: Activity,
    title: "Health Tools",
    body: "BMI, water intake, calories and sleep tracking with a weekly view of your trends.",
  },
  {
    icon: Phone,
    title: "Emergency Help",
    body: "One-tap emergency numbers, your blood group, allergies and emergency contact in one place.",
  },
];

function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* ambient glass orbs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 gradient-hero">
        <div className="glass-orb floaty absolute -left-24 top-10 size-80 bg-primary" />
        <div
          className="glass-orb floaty absolute -right-16 top-40 size-96 bg-accent"
          style={{ animationDelay: "1.5s" }}
        />
        <div
          className="glass-orb floaty absolute bottom-10 left-1/3 size-72 bg-chart-2"
          style={{ animationDelay: "3s" }}
        />
      </div>

      <header className="sticky top-0 z-30 px-4 pt-4 sm:px-6">
        <div className="glass-panel float-in mx-auto flex w-full max-w-6xl items-center justify-between rounded-2xl px-4 py-3">
          <div className="flex items-center gap-2.5">
            <img src={logo} alt="" width={36} height={36} className="size-9" />
            <span className="font-display text-lg font-semibold tracking-tight">{APP_NAME}</span>
          </div>
          <Button asChild size="sm">
            <Link to="/auth">Sign in</Link>
          </Button>
        </div>
      </header>

      <section>
        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:py-20">
          <div>
            <span
              className="glass-card float-in inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium text-muted-foreground"
              style={{ animationDelay: "0.05s" }}
            >
              <ShieldCheck className="size-3.5 text-primary" />
              Private, encrypted health records
            </span>
            <h1
              className="float-in mt-5 text-4xl font-bold leading-[1.1] sm:text-5xl lg:text-6xl"
              style={{ animationDelay: "0.12s" }}
            >
              Your calm, always-on AI health companion
            </h1>
            <p
              className="float-in mt-5 max-w-lg text-base text-muted-foreground sm:text-lg"
              style={{ animationDelay: "0.2s" }}
            >
              MedAssist AI helps you understand symptoms, decode lab reports, remember your
              medicines and track daily health — with clear guidance on when to see a doctor.
            </p>
            <div
              className="float-in mt-8 flex flex-wrap gap-3"
              style={{ animationDelay: "0.28s" }}
            >
              <Button asChild size="lg">
                <Link to="/auth">
                  Get started free <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="glass-panel">
                <Link to="/auth">I already have an account</Link>
              </Button>
            </div>
            <p
              className="float-in mt-6 max-w-md text-xs text-muted-foreground"
              style={{ animationDelay: "0.36s" }}
            >
              {MEDICAL_DISCLAIMER}
            </p>
          </div>
          <div className="relative">
            <div
              className="glass-card float-in floaty overflow-hidden p-3"
              style={{ animationDelay: "0.3s" }}
            >
              <img
                src={heroImage}
                alt="Doctor reviewing a patient's health dashboard on a tablet"
                width={1280}
                height={1024}
                className="w-full rounded-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="float-in text-2xl font-semibold sm:text-3xl">
          Everything your health needs, together
        </h2>
        <p
          className="float-in mt-2 max-w-xl text-muted-foreground"
          style={{ animationDelay: "0.08s" }}
        >
          Six connected tools that turn scattered health worries into clear, tracked next steps.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }, i) => (
            <article
              key={title}
              className="glass-card float-in p-5 transition-transform duration-300 hover:-translate-y-1.5 hover:shadow-lift"
              style={{ animationDelay: `${0.1 + i * 0.08}s` }}
            >
              <span className="inline-flex size-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <Icon className="size-5" />
              </span>
              <h3 className="mt-4 text-base font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6">
        <div className="glass-card gradient-primary float-in flex flex-col items-start gap-4 p-8 text-primary-foreground sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Start your health file today</h2>
            <p className="mt-1 text-sm opacity-90">
              Free to use. Your records stay private to your account.
            </p>
          </div>
          <Button asChild size="lg" variant="secondary">
            <Link to="/auth">Create account</Link>
          </Button>
        </div>
      </section>

      <footer className="glass-panel">
        <div className="mx-auto w-full max-w-6xl px-4 py-8 text-xs text-muted-foreground sm:px-6">
          © {new Date().getFullYear()} {APP_NAME}. {MEDICAL_DISCLAIMER}
        </div>
      </footer>
    </div>
  );
}


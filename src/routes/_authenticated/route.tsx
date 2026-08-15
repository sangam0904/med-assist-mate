import { Link, Outlet, createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Activity,
  FileText,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  MessageSquareHeart,
  Moon,
  Phone,
  Pill,
  Stethoscope,
  Sun,
  UserRound,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";
import logo from "@/assets/medassist-logo.png";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthenticatedLayout,
});

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/chat", label: "AI Doctor Chat", icon: MessageSquareHeart },
  { to: "/symptoms", label: "Symptom Checker", icon: Stethoscope },
  { to: "/reports", label: "Lab Reports", icon: FileText },
  { to: "/medicines", label: "Medicines", icon: Pill },
  { to: "/health-tools", label: "Health Tools", icon: Activity },
  { to: "/nearby", label: "Find Care", icon: MapPin },
  { to: "/emergency", label: "Emergency", icon: Phone },
  { to: "/profile", label: "Profile", icon: UserRound },
] as const;

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          onClick={onNavigate}
          className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          activeProps={{
            className: "bg-sidebar-accent text-sidebar-accent-foreground shadow-soft",
          }}
        >
          <Icon className="size-[18px] shrink-0" />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}

function Brand() {
  return (
    <Link to="/dashboard" className="flex items-center gap-2.5 px-2 py-1">
      <img src={logo} alt="" width={32} height={32} className="size-8" />
      <span className="font-display text-base font-semibold tracking-tight">{APP_NAME}</span>
    </Link>
  );
}

function AuthenticatedLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar p-4 lg:flex">
        <Brand />
        <div className="mt-6 flex-1 overflow-y-auto">
          <NavLinks />
        </div>
        <div className="mt-4 border-t border-sidebar-border pt-3">
          <p className="truncate px-3 text-xs text-muted-foreground">{email}</p>
          <div className="mt-2 flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 justify-start"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
              {theme === "dark" ? "Light" : "Dark"}
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut} aria-label="Sign out">
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border bg-background/85 px-4 py-3 backdrop-blur lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Open menu">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 bg-sidebar p-4">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <Brand />
            <div className="mt-6">
              <NavLinks onNavigate={() => setOpen(false)} />
            </div>
            <Button variant="ghost" className="mt-6 w-full justify-start" onClick={signOut}>
              <LogOut className="size-4" /> Sign out
            </Button>
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2">
          <img src={logo} alt="" width={28} height={28} className="size-7" />
          <span className="font-display text-sm font-semibold">{APP_NAME}</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Toggle theme"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </Button>
      </header>

      <main className={cn("lg:pl-64")}>
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
          <Outlet />
        </div>
      </main>

      <nav className="sticky bottom-0 z-20 flex items-center justify-around border-t border-border bg-background/95 py-1.5 backdrop-blur sm:hidden">
        {NAV.slice(0, 5).map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            aria-label={label}
            className="flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-[10px] font-medium text-muted-foreground"
            activeProps={{ className: "text-primary" }}
          >
            <Icon className="size-5" />
            {label.split(" ")[0]}
          </Link>
        ))}
      </nav>

      <div className="hidden sm:block lg:hidden">
        <div className="fixed bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-full border border-border bg-card px-2 py-1.5 shadow-lift">
          <div className="flex items-center gap-1">
            {NAV.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                aria-label={label}
                className="rounded-full p-2.5 text-muted-foreground transition-colors hover:bg-accent"
                activeProps={{ className: "bg-primary-soft text-primary" }}
              >
                <Icon className="size-[18px]" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="hidden lg:block">
        <p className="sr-only">
          <HeartPulse className="size-3" />
        </p>
      </div>
    </div>
  );
}

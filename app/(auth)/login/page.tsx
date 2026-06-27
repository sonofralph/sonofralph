"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ChefHat, Loader2, BarChart3, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { cn } from "@/lib/utils";

const features = [
  { icon: BarChart3, title: "Real-time Analytics", desc: "Live inventory insights across all locations" },
  { icon: Shield, title: "Role-based Access", desc: "Granular permissions for every team member" },
  { icon: Zap, title: "Instant Alerts", desc: "Never run out of critical stock again" },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const result = await signIn("credentials", { email, password, redirect: false });

    if (result?.error) {
      setError("Invalid email or password");
      setIsLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="flex min-h-full bg-white">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-900 p-12 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2" />
        </div>

        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
              <ChefHat className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Mise</span>
          </div>
        </div>

        <div className="relative space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-white leading-tight">
              The operating system for hospitality inventory
            </h1>
            <p className="mt-4 text-lg text-indigo-200">
              Trusted by hotels, restaurants, and catering operations worldwide to eliminate waste and reduce costs.
            </p>
          </div>

          <div className="space-y-4">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="flex items-start gap-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
                    <Icon className="h-4 w-4 text-indigo-200" />
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">{f.title}</p>
                    <p className="text-sm text-indigo-300">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative">
          <div className="flex items-center gap-4">
            <div className="flex -space-x-2">
              {["A", "M", "S"].map((initial, i) => (
                <div key={i} className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-indigo-900 bg-indigo-400 text-xs font-bold text-white">
                  {initial}
                </div>
              ))}
            </div>
            <p className="text-sm text-indigo-200">
              Join <span className="font-semibold text-white">500+</span> hospitality teams managing smarter
            </p>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex w-full lg:w-1/2 flex-col items-center justify-center px-8 py-12">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile logo */}
          <div className="flex flex-col items-center gap-2 lg:hidden">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 shadow-lg">
              <ChefHat className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Mise</h1>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
            <p className="mt-1 text-sm text-slate-500">Sign in to your organization account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email address</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="h-11"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-slate-700">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm"
              disabled={isLoading}
            >
              {isLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in...</>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          {/* Demo credentials */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Demo accounts</p>
            {[
              { label: "Owner", email: "owner@grandhotel.com" },
              { label: "Manager", email: "manager@grandhotel.com" },
              { label: "Staff", email: "staff@grandhotel.com" },
            ].map((demo) => (
              <button
                key={demo.email}
                type="button"
                onClick={() => { setEmail(demo.email); setPassword("password123"); }}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
                  "hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200"
                )}
              >
                <span className="font-medium text-slate-700">{demo.label}</span>
                <span className="text-slate-400 text-xs">{demo.email}</span>
              </button>
            ))}
          </div>

          <p className="text-center text-xs text-slate-400">
            Need an account?{" "}
            <Link href="/register" className="font-medium text-indigo-600 hover:underline">
              Create organization
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

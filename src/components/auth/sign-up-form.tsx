"use client";

import {
  IconAlertTriangle,
  IconArrowRight,
  IconLoader,
} from "@tabler/icons-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signUp } from "@/lib/auth-client";

export function SignUpForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await signUp.email({
        name,
        email,
        password,
      });

      if (res.error) {
        setError(res.error.message || "Failed to create account.");
      } else {
        router.push("/today");
        router.refresh();
      }
    } catch (err) {
      setError((err as Error).message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 p-3 text-xs rounded-xl bg-destructive-soft text-destructive-soft-foreground border border-destructive/20">
          <IconAlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <label
          className="block text-xs font-semibold text-foreground/80 mb-1.5"
          htmlFor="name"
        >
          Your Name
        </label>
        <input
          id="name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ismail Josim"
          className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
        />
      </div>

      <div>
        <label
          className="block text-xs font-semibold text-foreground/80 mb-1.5"
          htmlFor="email"
        >
          Email Address
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="developer@example.com"
          className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
        />
      </div>

      <div>
        <label
          className="block text-xs font-semibold text-foreground/80 mb-1.5"
          htmlFor="password"
        >
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 6 characters"
          className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium text-sm text-primary-foreground bg-primary hover:bg-primary/90 disabled:opacity-50 transition-all shadow-sm"
      >
        {loading ? (
          <>
            <IconLoader className="h-4 w-4 animate-spin" />
            <span>Creating account...</span>
          </>
        ) : (
          <>
            <span>Get Started</span>
            <IconArrowRight className="h-4 w-4" />
          </>
        )}
      </button>

      <div className="text-center pt-2">
        <p className="text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-link hover:underline"
          >
            Sign In
          </Link>
        </p>
      </div>
    </form>
  );
}

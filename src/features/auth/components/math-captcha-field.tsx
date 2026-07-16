"use client";

import { Input } from "@/components/ui";
import { cn } from "@/lib/utils";

type MathCaptchaFieldProps = {
  a: number;
  b: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  status?: "idle" | "correct" | "incorrect";
  statusMessage?: string | null;
};

const digitClass = "text-sm font-medium tabular-nums text-foreground";
const operatorClass = "text-sm font-medium text-muted-foreground";
const answerInputClass =
  "h-9 w-14 border-input bg-background px-2 text-center text-sm font-medium tabular-nums text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:border-primary/40 focus-visible:ring-primary/20";

export function randomMathDigit(): number {
  return Math.floor(Math.random() * 9) + 1;
}

export function isMathCaptchaCorrect(a: number, b: number, answer: string | number): boolean {
  const trimmed = typeof answer === "string" ? answer.trim() : String(answer);
  if (!trimmed) return false;
  const n = Number.parseInt(trimmed, 10);
  return (
    Number.isInteger(a) &&
    Number.isInteger(b) &&
    a >= 1 &&
    a <= 9 &&
    b >= 1 &&
    b <= 9 &&
    Number.isInteger(n) &&
    !Number.isNaN(n) &&
    n === a + b
  );
}

/** Equation + answer only — no headings, helper copy, or “Security check” chrome. */
export function MathCaptchaField({
  a,
  b,
  value,
  onChange,
  disabled,
  className,
  status = "idle",
  statusMessage,
}: MathCaptchaFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label={`${a} plus ${b}`}>
        <span className={digitClass}>{a}</span>
        <span className={operatorClass}>+</span>
        <span className={digitClass}>{b}</span>
        <span className={operatorClass}>=</span>
        <Input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={value}
          onChange={(event) => onChange(event.target.value.replace(/[^\d]/g, ""))}
          disabled={disabled}
          className={cn(
            answerInputClass,
            status === "correct" &&
              "border-emerald-500 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20",
            status === "incorrect" &&
              "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20",
          )}
          autoComplete="off"
          aria-invalid={status === "incorrect"}
          aria-describedby={statusMessage ? "math-captcha-status" : undefined}
          aria-label="Answer"
        />
      </div>
      {statusMessage ? (
        <p
          id="math-captcha-status"
          className={cn(
            "text-xs",
            status === "correct" && "text-emerald-600",
            status === "incorrect" && "text-destructive",
            status === "idle" && "text-muted-foreground",
          )}
        >
          {statusMessage}
        </p>
      ) : null}
    </div>
  );
}

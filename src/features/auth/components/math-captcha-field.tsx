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
  label?: string;
};

const digitClass = "text-sm font-medium tabular-nums text-foreground";
const operatorClass = "text-sm font-medium text-muted-foreground";
const answerInputClass =
  "h-9 w-14 border-input bg-background px-2 text-center text-sm font-medium tabular-nums text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:border-primary/40 focus-visible:ring-primary/20";

export function randomMathDigit(): number {
  return Math.floor(Math.random() * 9) + 1;
}

export function isMathCaptchaCorrect(a: number, b: number, answer: string | number): boolean {
  const n = typeof answer === "string" ? Number.parseInt(answer, 10) : answer;
  return (
    Number.isInteger(a) &&
    Number.isInteger(b) &&
    a >= 1 &&
    a <= 9 &&
    b >= 1 &&
    b <= 9 &&
    !Number.isNaN(n) &&
    n === a + b
  );
}

export function MathCaptchaField({
  a,
  b,
  value,
  onChange,
  disabled,
  className,
  label = "Security check",
}: MathCaptchaFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-sm font-medium text-foreground">{label}</p>
      <div
        className="flex flex-wrap items-center gap-2"
        role="group"
        aria-label={`${label}: ${a} plus ${b}`}
      >
        <span className={digitClass}>{a}</span>
        <span className={operatorClass}>+</span>
        <span className={digitClass}>{b}</span>
        <span className={operatorClass}>=</span>
        <Input
          type="number"
          inputMode="numeric"
          min={2}
          max={18}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          className={answerInputClass}
          autoComplete="off"
          required
          aria-label="Your answer"
        />
      </div>
      <p className="text-xs text-muted-foreground">Enter the sum to confirm you are not a bot.</p>
    </div>
  );
}

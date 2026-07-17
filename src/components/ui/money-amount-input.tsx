"use client";

import { useRef, type ChangeEvent, type ComponentProps } from "react";

import { Input } from "@/components/ui/input";
import {
  caretIndexAfterDigits,
  countDigitsBefore,
  formatMoneyInputDisplay,
} from "@/lib/money-format";
import { cn } from "@/lib/utils";

type InputProps = ComponentProps<typeof Input>;

export type MoneyAmountInputProps = Omit<
  InputProps,
  "type" | "inputMode" | "onChange" | "value"
> & {
  value: string;
  onValueChange: (formatted: string) => void;
};

/**
 * Amount input that shows thousand separators while typing.
 * Stores the formatted display string; parse with parseMoneyInputToMinor / parsePositiveMoneyInputToMinor.
 */
export function MoneyAmountInput({
  value,
  onValueChange,
  className,
  onBlur,
  ...props
}: MoneyAmountInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const nextRaw = event.target.value;
    const caret = event.target.selectionStart ?? nextRaw.length;
    const digitsBefore = countDigitsBefore(nextRaw, caret);
    const formatted = formatMoneyInputDisplay(nextRaw);
    onValueChange(formatted);
    requestAnimationFrame(() => {
      const node = inputRef.current;
      if (!node) return;
      const nextCaret = caretIndexAfterDigits(formatted, digitsBefore);
      node.setSelectionRange(nextCaret, nextCaret);
    });
  }

  return (
    <Input
      {...props}
      ref={inputRef}
      inputMode="decimal"
      autoComplete="off"
      className={cn("tabular-nums", className)}
      value={value}
      onChange={handleChange}
      onBlur={onBlur}
    />
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Alert, AlertDescription, Button, Skeleton } from "@/components/ui";
import { CurrencyDisplay } from "@/components/ui/display";
import { MoneyAmountInput } from "@/components/ui/money-amount-input";
import { getCustomerJson, postCustomerJson } from "@/features/customer/api-client";
import { appPath } from "@/lib/app-path";
import { parsePositiveMoneyInputToMinorBigInt } from "@/lib/money-format";

type PublishedPlan = {
  planId: string;
  planVersionId: string;
  slug: string;
  name: string;
  description: string | null;
  currency: string;
  minPrincipalMinor: string;
  maxPrincipalMinor: string;
  termDays: number;
  dailyRoiBps: number;
  totalRoiBps: number | null;
};

type WalletBalances = {
  availableBalanceMinor: string;
  currency: string;
};

/** Activate an investment from available wallet balance using certified plan versions. */
export function ActivateInvestmentSurface() {
  const router = useRouter();
  const [plans, setPlans] = useState<PublishedPlan[]>([]);
  const [availableMinor, setAvailableMinor] = useState<bigint>(0n);
  const [currency, setCurrency] = useState("USD");
  const [planVersionId, setPlanVersionId] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void Promise.all([
      getCustomerJson<{ plans: PublishedPlan[] }>("/api/customer/investments?catalog=plans"),
      getCustomerJson<{ balances: WalletBalances }>("/api/customer/wallet"),
    ]).then(([plansResult, walletResult]) => {
      if (!active) return;
      if (plansResult.error || walletResult.error) {
        setError(plansResult.error ?? walletResult.error ?? "Unable to load activation data.");
        setLoading(false);
        return;
      }
      const nextPlans = plansResult.data?.plans ?? [];
      setPlans(nextPlans);
      if (nextPlans[0]) setPlanVersionId(nextPlans[0].planVersionId);
      const balances = walletResult.data?.balances;
      setAvailableMinor(BigInt(balances?.availableBalanceMinor ?? "0"));
      setCurrency(balances?.currency ?? "USD");
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const selected = useMemo(
    () => plans.find((plan) => plan.planVersionId === planVersionId) ?? null,
    [plans, planVersionId],
  );

  async function submit() {
    if (!selected) return;
    const principalMinor = parsePositiveMoneyInputToMinorBigInt(amount);
    if (principalMinor === null) {
      setError("Enter a valid USD amount.");
      return;
    }

    setPending(true);
    setError(null);
    const result = await postCustomerJson<{ investment: { id: string } }>(
      "/api/customer/investments",
      {
        planVersionId: selected.planVersionId,
        principalMinor: principalMinor.toString(),
        idempotencyKey: `activate:${selected.planVersionId}:${principalMinor}:${Date.now()}`,
      },
    );

    if (result.error) {
      setError(result.error);
      setPending(false);
      return;
    }

    const investmentId = result.data?.investment.id;
    if (investmentId) {
      router.replace(appPath(`/portfolio/${investmentId}`));
      router.refresh();
      return;
    }

    router.replace(appPath("/portfolio"));
    router.refresh();
  }

  if (loading) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading activation">
        <Skeleton className="h-8 w-64 rounded-md" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Activate investment</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Move available wallet funds into a certified plan. Accrued ROI is not withdrawable until
          settlement posts.
        </p>
      </div>

      <p className="text-sm text-muted-foreground">
        Available balance:{" "}
        <span className="font-medium text-foreground">
          <CurrencyDisplay amountMinor={Number(availableMinor)} currency={currency} />
        </span>
      </p>

      {plans.length === 0 ? (
        <Alert>
          <AlertDescription>
            No published investment plans are available yet. Deposit funds and check back after
            plans are published.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-4 rounded-xl border border-border p-4">
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">Plan</span>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={planVersionId}
              onChange={(event) => setPlanVersionId(event.target.value)}
              disabled={pending}
            >
              {plans.map((plan) => (
                <option key={plan.planVersionId} value={plan.planVersionId}>
                  {plan.name} — {(plan.dailyRoiBps / 100).toFixed(2)}%/day · {plan.termDays} days
                </option>
              ))}
            </select>
          </label>

          {selected ? (
            <p className="text-xs text-muted-foreground">
              Limits: <CurrencyDisplay amountMinor={Number(selected.minPrincipalMinor)} /> –{" "}
              <CurrencyDisplay amountMinor={Number(selected.maxPrincipalMinor)} />
              {selected.description ? ` · ${selected.description}` : null}
            </p>
          ) : null}

          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">Principal (USD)</span>
            <MoneyAmountInput
              placeholder="50.00"
              value={amount}
              disabled={pending}
              onValueChange={setAmount}
            />
          </label>

          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button type="button" disabled={pending || !selected} onClick={() => void submit()}>
              {pending ? "Activating…" : "Activate investment"}
            </Button>
            <Button asChild type="button" variant="outline">
              <Link href="/portfolio">Cancel</Link>
            </Button>
            <Button asChild type="button" variant="ghost">
              <Link href="/wallet/deposits/new">Add funds</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

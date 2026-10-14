"use client";

import type { ReactNode, Ref } from "react";
import { ArrowRight, Banknote, Check } from "lucide-react";
import { formatMoney } from "./formatters";
import type { Step } from "./types";

export function Field({
  id,
  label,
  inputRef,
  value,
  onChange,
  placeholder,
  error,
  hint,
  optional = false,
  type = "text",
  inputMode,
  autoComplete,
}: {
  id?: string;
  label: string;
  inputRef?: Ref<HTMLInputElement>;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  type?: "text" | "email" | "tel";
  inputMode?: "text" | "email" | "tel" | "numeric";
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-wide text-secondary">
        {label}
        {optional && (
          <span className="font-semibold normal-case text-primary/45">
            Optionnel
          </span>
        )}
      </span>
      <input
        id={id}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        ref={inputRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        className={`h-12 w-full rounded-md border bg-[#fdfbf6] px-4 text-sm font-semibold text-black outline-none transition placeholder:text-primary/35 focus:bg-white ${
          error
            ? "border-red-400 focus:border-red-500"
            : "border-[#eadcc7] focus:border-primary"
        }`}
      />
      {hint && !error && (
        <span className="mt-2 block text-xs font-medium text-primary/55">
          {hint}
        </span>
      )}
      {error && (
        <span className="mt-2 block text-xs font-semibold text-red-700">
          {error}
        </span>
      )}
    </label>
  );
}

export function PrimaryButton({
  children,
  onClick,
  disabled = false,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-primary/90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  onClick,
  disabled = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex flex-1 items-center justify-center gap-2 rounded-md border border-secondary/35 bg-white px-5 py-3 text-xs font-bold uppercase tracking-wide text-primary transition hover:bg-[#f8f1e7] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {children}
    </button>
  );
}

export function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white/8 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-white/58">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

export function ReceiptLine({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#eadcc7]/70 py-2.5 text-sm last:border-b-0">
      <span className="font-semibold text-secondary">{label}</span>
      <span
        className={`text-right font-bold text-primary ${
          strong ? "text-base" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export function SummaryBar({
  label,
  amount,
  currency,
  actionLabel,
  disabled = false,
  onAction,
}: {
  label: string;
  amount: number;
  currency: string;
  actionLabel: string;
  disabled?: boolean;
  onAction: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-md bg-primary p-4 text-white sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <Banknote className="h-5 w-5 text-[#ffcc02]" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-white/58">
            {label}
          </p>
          <p className="text-xl font-bold">
            {formatMoney(amount || 0, currency)}
          </p>
        </div>
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={onAction}
        className="inline-flex items-center justify-center gap-2 rounded-md bg-[#ffcc02] px-5 py-3 text-xs font-bold uppercase tracking-wide text-[#3a2014] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {actionLabel}
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

export function Stepper({ step }: { step: Step }) {
  const steps: Array<[string, string]> = [
    ["identity", "Profil"],
    ["amount", "Montant"],
    ["payment", "Paiement"],
  ];
  // Le choix « pour qui » (profile) fait partie de l'étape Profil.
  const currentIndex = step === "amount" ? 1 : step === "payment" ? 2 : 0;

  return (
    <ol className="flex w-full items-start">
      {steps.map(([id, label], index) => {
        const done = index < currentIndex;
        const active = index === currentIndex;
        const isLast = index === steps.length - 1;

        return (
          <li
            key={id}
            className={`flex items-start ${isLast ? "" : "flex-1"}`}
          >
            <div className="flex flex-col items-center gap-2">
              <span
                className={`grid h-8 w-8 flex-none place-items-center rounded-full text-xs font-bold transition ${
                  done
                    ? "bg-primary text-white"
                    : active
                    ? "bg-primary text-white ring-4 ring-primary/15"
                    : "border border-secondary/25 bg-secondary/5 text-secondary/45"
                }`}
              >
                {done ? <Check className="h-4 w-4" /> : index + 1}
              </span>
              <span
                className={`text-[10px] font-bold uppercase tracking-wide ${
                  active
                    ? "text-primary"
                    : done
                    ? "text-primary/70"
                    : "text-secondary/40"
                }`}
              >
                {label}
              </span>
            </div>
            {!isLast && (
              <span
                className={`mx-2 mt-4 h-0.5 flex-1 rounded-full transition ${
                  index < currentIndex ? "bg-primary" : "bg-secondary/15"
                }`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

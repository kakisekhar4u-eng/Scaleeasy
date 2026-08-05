"use client";

import { useState } from "react";

export type LeadFormValues = {
  name: string;
  phone: string;
  email: string;
  preferredContactChannel: "phone" | "email" | "whatsapp";
  preferredContactTime?: string;
  additionalNotes?: string;
  consent: boolean;
};

export function LeadForm({
  destinationName,
  busy,
  onBack,
  onSubmit,
}: {
  destinationName: string;
  busy: boolean;
  onBack: () => void;
  onSubmit: (values: LeadFormValues) => void;
}) {
  const [values, setValues] = useState<LeadFormValues>({
    name: "",
    phone: "",
    email: "",
    preferredContactChannel: "whatsapp",
    preferredContactTime: "",
    additionalNotes: "",
    consent: false,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof LeadFormValues, string>>>({});

  function validate(): boolean {
    const next: typeof errors = {};
    if (values.name.trim().length < 2) next.name = "Please tell us your name.";
    if (!/^[+\d][\d\s-]{7,15}$/.test(values.phone.trim()))
      next.phone = "Please enter a valid mobile number.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()))
      next.email = "Please enter a valid email address.";
    if (!values.consent) next.consent = "Consent is required so a Klar expert can contact you.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  return (
    <section aria-labelledby="lead-heading">
      <h1 id="lead-heading" className="text-2xl font-bold text-brand sm:text-3xl">
        Nearly there — let Klar take it from here
      </h1>
      <p className="mt-2 text-sm text-foreground/60">
        A Klar travel expert will review your {destinationName} plan and contact you to finalise
        the holiday and quotation.
      </p>

      <form
        className="mt-6 space-y-4"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (validate()) onSubmit(values);
        }}
      >
        <div>
          <label className="field-label" htmlFor="lead-name">Name</label>
          <input
            id="lead-name"
            className="field-input"
            autoComplete="name"
            value={values.name}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "lead-name-error" : undefined}
            onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
          />
          {errors.name ? (
            <p id="lead-name-error" className="mt-1 text-xs text-danger">{errors.name}</p>
          ) : null}
        </div>
        <div>
          <label className="field-label" htmlFor="lead-phone">Mobile number</label>
          <input
            id="lead-phone"
            className="field-input"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            placeholder="+91…"
            value={values.phone}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? "lead-phone-error" : undefined}
            onChange={(e) => setValues((v) => ({ ...v, phone: e.target.value }))}
          />
          {errors.phone ? (
            <p id="lead-phone-error" className="mt-1 text-xs text-danger">{errors.phone}</p>
          ) : null}
        </div>
        <div>
          <label className="field-label" htmlFor="lead-email">Email</label>
          <input
            id="lead-email"
            className="field-input"
            type="email"
            autoComplete="email"
            inputMode="email"
            value={values.email}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "lead-email-error" : undefined}
            onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
          />
          {errors.email ? (
            <p id="lead-email-error" className="mt-1 text-xs text-danger">{errors.email}</p>
          ) : null}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="lead-channel">How should we contact you?</label>
            <select
              id="lead-channel"
              className="field-input"
              value={values.preferredContactChannel}
              onChange={(e) =>
                setValues((v) => ({
                  ...v,
                  preferredContactChannel: e.target.value as LeadFormValues["preferredContactChannel"],
                }))
              }
            >
              <option value="whatsapp">WhatsApp</option>
              <option value="phone">Phone call</option>
              <option value="email">Email</option>
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="lead-time">Best time to reach you</label>
            <input
              id="lead-time"
              className="field-input"
              placeholder="e.g. weekday evenings"
              value={values.preferredContactTime}
              onChange={(e) => setValues((v) => ({ ...v, preferredContactTime: e.target.value }))}
            />
          </div>
        </div>
        <div>
          <label className="field-label" htmlFor="lead-notes">Anything else we should know?</label>
          <textarea
            id="lead-notes"
            className="field-input"
            rows={3}
            value={values.additionalNotes}
            onChange={(e) => setValues((v) => ({ ...v, additionalNotes: e.target.value }))}
          />
        </div>

        <div className="rounded-lg bg-surface-muted p-4">
          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              className="mt-0.5 h-5 w-5 rounded border-line"
              checked={values.consent}
              aria-invalid={Boolean(errors.consent)}
              aria-describedby={errors.consent ? "lead-consent-error" : undefined}
              onChange={(e) => setValues((v) => ({ ...v, consent: e.target.checked }))}
            />
            <span>
              I agree that Klar Travels may store my holiday plan and contact me about this
              enquiry. See our{" "}
              <a href="/privacy" className="text-brand underline" target="_blank">privacy note</a>.
            </span>
          </label>
          {errors.consent ? (
            <p id="lead-consent-error" className="mt-2 text-xs text-danger">{errors.consent}</p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-3">
          <button type="button" className="btn-secondary" onClick={onBack} disabled={busy}>
            ← Back to itinerary
          </button>
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? "Sending to Klar…" : "Let Klar Finalise My Holiday"}
          </button>
        </div>
      </form>
    </section>
  );
}

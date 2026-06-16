"use client";

import React, { useId } from "react";

type FormFieldProps = {
  /** Optional label text rendered above the control. */
  label?: React.ReactNode;
  /** Associates the label with the control via htmlFor. */
  htmlFor?: string;
  /**
   * Error message. When present:
   *   - rendered in --color-imp with role="alert"
   *   - the field wrapper plays the shake animation once
   *   - the child element receives aria-describedby pointing to the error node
   */
  error?: string;
  /**
   * Muted help text rendered below the control when there is no error.
   * The child element receives aria-describedby pointing to the help node.
   */
  help?: string;
  /** The input / control element(s). */
  children: React.ReactNode;
  className?: string;
};

/**
 * FormField — lightweight a11y wrapper for a label + control + error/help message.
 *
 * aria-describedby wiring: when the child is a single React element, FormField
 * clones it and injects `aria-describedby` pointing to the active message node
 * (error takes priority over help). If the child is not a single element (e.g.
 * a fragment or plain text), the ids are still rendered on the message nodes so
 * consumers can wire them manually.
 */
export default function FormField({
  label,
  htmlFor,
  error,
  help,
  children,
  className,
}: FormFieldProps) {
  const uid = useId();
  const errorId = `${uid}-error`;
  const helpId = `${uid}-help`;

  // Determine which message is active and its id for aria-describedby.
  const activeDescribedBy = error ? errorId : help ? helpId : undefined;

  // Inject aria-describedby into the child element when possible.
  let controlNode = children;
  if (
    activeDescribedBy &&
    React.isValidElement(children) &&
    // Avoid cloning if the child already has aria-describedby set.
    !(children.props as Record<string, unknown>)["aria-describedby"]
  ) {
    controlNode = React.cloneElement(
      children as React.ReactElement<Record<string, unknown>>,
      { "aria-describedby": activeDescribedBy },
    );
  }

  return (
    <div className={`flex w-full flex-col gap-1.5 ${className ?? ""}`}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="font-condensed text-xs uppercase tracking-widest text-[var(--color-text)]"
        >
          {label}
        </label>
      )}

      {/* Shake the field wrapper each time an error is present. The key forces
          React to remount the div (and restart the animation) whenever the
          error message changes. */}
      <div
        key={error ?? "no-error"}
        className={error ? "animate-shake" : undefined}
      >
        {controlNode}
      </div>

      {error ? (
        <p
          id={errorId}
          role="alert"
          className="text-xs text-[var(--color-imp)]"
        >
          {error}
        </p>
      ) : help ? (
        <p
          id={helpId}
          className="text-xs text-[var(--text-dim)]"
        >
          {help}
        </p>
      ) : null}
    </div>
  );
}

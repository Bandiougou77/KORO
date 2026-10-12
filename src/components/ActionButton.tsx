"use client";

import { useActionState } from "react";
import { initialActionState, type ActionState } from "@/actions/types";

export function ActionButton({
  action,
  label,
  pendingLabel,
  className = "btn btn-ghost",
  confirmMessage,
}: {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  label: string;
  pendingLabel?: string;
  className?: string;
  confirmMessage?: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialActionState);

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (confirmMessage && !window.confirm(confirmMessage)) e.preventDefault();
      }}
    >
      <button type="submit" className={className} disabled={pending}>
        {pending ? (pendingLabel ?? "…") : label}
      </button>
      {state.error && (
        <p className="form-error" style={{ marginTop: 6 }}>
          {state.error}
        </p>
      )}
    </form>
  );
}

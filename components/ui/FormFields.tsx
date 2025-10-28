import * as React from "react";

type BaseProps = {
  label: string;
  id?: string;
  icon?: React.ComponentType<{ className?: string }>;
  hint?: string;
  error?: string;
  className?: string;
};

export function InputField({
  label,
  id,
  icon: Icon,
  hint,
  error,
  className,
  ...inputProps
}: BaseProps & React.InputHTMLAttributes<HTMLInputElement>) {
  const fieldId = id || `input-${label.toLowerCase().replace(/\s+/g, '-')}`;
  
  return (
    <div className="grid gap-1">
      <label htmlFor={fieldId} className="text-sm font-medium text-foreground dark:text-white">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-foreground/50">
            <Icon className="h-4 w-4" />
          </span>
        )}
        <input
          id={fieldId}
          {...inputProps}
          className={[
            "w-full rounded-lg border border-border bg-background/80",
            Icon ? "pl-9 pr-3" : "px-3",
            "py-2.5 text-sm text-foreground placeholder:text-foreground/40",
            "focus:outline-none focus:ring-2 focus:ring-indigo-500",
            "focus:ring-offset-2 dark:focus:ring-offset-black",
            className || "",
          ].join(" ")}
        />
      </div>
      {hint && <p className="text-xs text-foreground/60">{hint}</p>}
      {error && <p className="text-xs text-rose-400">{error}</p>}
    </div>
  );
}

export function TextareaField({
  label,
  id,
  icon: Icon,
  hint,
  error,
  className,
  ...textareaProps
}: BaseProps & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const fieldId = id || `textarea-${label.toLowerCase().replace(/\s+/g, '-')}`;
  
  return (
    <div className="grid gap-1">
      <label htmlFor={fieldId} className="text-sm font-medium text-foreground dark:text-white">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <span className="pointer-events-none absolute left-3 top-3 text-foreground/50">
            <Icon className="h-4 w-4" />
          </span>
        )}
        <textarea
          id={fieldId}
          {...textareaProps}
          className={[
            "min-h-[140px] w-full rounded-lg border border-border bg-background/80",
            Icon ? "pl-9 pr-3" : "px-3",
            "py-2.5 text-sm text-foreground placeholder:text-foreground/40",
            "focus:outline-none focus:ring-2 focus:ring-indigo-500",
            "focus:ring-offset-2 dark:focus:ring-offset-black",
            className || "",
          ].join(" ")}
        />
      </div>
      {hint && <p className="text-xs text-foreground/60">{hint}</p>}
      {error && <p className="text-xs text-rose-400">{error}</p>}
    </div>
  );
}
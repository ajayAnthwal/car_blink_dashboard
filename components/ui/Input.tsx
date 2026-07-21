import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", label, error, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-neutral-dark mb-1.5">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={`
            flex h-11 w-full rounded-lg border bg-neutral-white px-3 py-2 text-sm 
            transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium 
            placeholder:text-neutral-muted focus:outline-none focus:ring-2 
            disabled:cursor-not-allowed disabled:opacity-50
            ${error ? "border-danger focus:ring-danger" : "border-neutral-muted/40 focus:border-primary-orange focus:ring-primary-orange/20"}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-sm text-danger font-medium">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

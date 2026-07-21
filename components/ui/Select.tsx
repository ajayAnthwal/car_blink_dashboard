import React from "react";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = "", label, error, options, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col space-y-1.5">
        {label && (
          <label className="text-sm font-medium text-primary-navy">
            {label}
            {props.required && <span className="text-danger ml-1">*</span>}
          </label>
        )}
        <select
          ref={ref}
          className={`
            w-full px-4 py-2.5 rounded-xl border text-sm transition-all outline-none
            ${error 
              ? "border-danger focus:ring-2 focus:ring-danger/20" 
              : "border-neutral-muted/30 focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/20"
            }
            bg-white text-neutral-dark
            ${className}
          `}
          {...props}
        >
          <option value="" disabled>Select {label}</option>
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {error && <span className="text-xs text-danger">{error}</span>}
      </div>
    );
  }
);

Select.displayName = "Select";

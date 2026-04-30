"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

type NativeSelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  wrapperClassName?: string;
};

type SelectOption = {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
};

function getOptions(children: React.ReactNode): SelectOption[] {
  return React.Children.toArray(children)
    .filter(React.isValidElement)
    .map((child) => {
      const option = child as React.ReactElement<
        React.OptionHTMLAttributes<HTMLOptionElement>
      >;
      const value = String(option.props.value ?? option.props.children ?? "");

      return {
        value,
        label: option.props.children,
        disabled: option.props.disabled,
      };
    });
}

export const NativeSelect = React.forwardRef<
  HTMLSelectElement,
  NativeSelectProps
>(
  (
    {
      className,
      wrapperClassName,
      children,
      disabled,
      name,
      value,
      defaultValue,
      onChange,
      ...props
    },
    ref,
  ) => {
    const options = getOptions(children);
    const selectId = React.useId();
    const [isOpen, setIsOpen] = React.useState(false);
    const rootRef = React.useRef<HTMLDivElement>(null);
    const selectedValue = String(value ?? defaultValue ?? "");
    const selectedOption = options.find(
      (option) => option.value === selectedValue,
    );

    React.useEffect(() => {
      function handlePointerDown(event: PointerEvent) {
        if (!rootRef.current?.contains(event.target as Node)) {
          setIsOpen(false);
        }
      }

      document.addEventListener("pointerdown", handlePointerDown);
      return () => document.removeEventListener("pointerdown", handlePointerDown);
    }, []);

    function selectOption(option: SelectOption) {
      if (option.disabled) {
        return;
      }

      onChange?.({
        target: { value: option.value },
        currentTarget: { value: option.value },
      } as React.ChangeEvent<HTMLSelectElement>);
      setIsOpen(false);
    }

    return (
      <div ref={rootRef} className={cn("relative", wrapperClassName)}>
        {name ? <input type="hidden" name={name} value={selectedValue} /> : null}
        <select
          ref={ref}
          aria-hidden="true"
          tabIndex={-1}
          className="sr-only"
          disabled={disabled}
          value={selectedValue}
          onChange={onChange}
          {...props}
        >
          {children}
        </select>
        <button
          type="button"
          disabled={disabled}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls={`${selectId}-listbox`}
          onClick={() => setIsOpen((current) => !current)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setIsOpen(false);
            }
          }}
          className={cn(
            "flex h-11 w-full items-center justify-between gap-3 rounded-xl border border-border bg-background px-4 py-3 text-left text-sm font-bold text-foreground shadow-sm outline-none transition-colors hover:border-foreground/30 focus:border-foreground/40 focus:ring-2 focus:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-60",
            className,
          )}
        >
          <span
            className={cn(
              "min-w-0 flex-1 truncate",
              !selectedOption && "text-muted-foreground",
            )}
          >
            {selectedOption?.label ?? "Select option"}
          </span>
          <ChevronDown
            aria-hidden="true"
            size={16}
            className={cn(
              "shrink-0 text-muted-foreground transition-transform",
              isOpen && "rotate-180",
            )}
          />
        </button>

        {isOpen ? (
          <div
            id={`${selectId}-listbox`}
            role="listbox"
            className="absolute left-0 right-0 top-full z-50 mt-2 max-h-72 overflow-y-auto rounded-xl border border-border bg-card p-2 shadow-2xl shadow-black/20"
          >
            {options.map((option) => {
              const isSelected = option.value === selectedValue;

              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  disabled={option.disabled}
                  onClick={() => selectOption(option)}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm font-bold text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40",
                    isSelected && "bg-muted",
                  )}
                >
                  <span className="min-w-0 truncate">{option.label}</span>
                  {isSelected ? (
                    <Check size={14} className="shrink-0 text-primary" />
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    );
  },
);

NativeSelect.displayName = "NativeSelect";

import { cn } from "@/lib/utils";

/** Horizontally scrollable table so wide data never breaks the page on mobile. */
export function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div className="-mx-5 overflow-x-auto px-5">
      <table className={cn("w-full min-w-[32rem] text-sm", className)} {...props} />
    </div>
  );
}

export function Th({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      className={cn(
        "border-b border-border py-2 text-left text-xs font-medium tracking-wide text-subtle uppercase first:pl-0 last:pr-0",
        className,
      )}
      {...props}
    />
  );
}

export function Td({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      className={cn("border-b border-border py-3 align-middle first:pl-0 last:pr-0 [tr:last-child_&]:border-0", className)}
      {...props}
    />
  );
}

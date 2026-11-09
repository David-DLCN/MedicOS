import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

const sizes = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
};

export function Avatar({
  name,
  size = "sm",
  className,
}: {
  name: string;
  size?: keyof typeof sizes;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-primary-soft font-semibold text-primary",
        sizes[size],
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}

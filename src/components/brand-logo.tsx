import Image from "next/image";
import { cn } from "@/lib/utils";

export function BrandLogo({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: { className: "h-8 w-auto", width: 116, height: 40 },
    md: { className: "h-10 w-auto", width: 145, height: 50 },
    lg: { className: "h-14 w-auto", width: 203, height: 70 },
  }[size];

  return (
    <Image
      src="/barly-logo.png"
      alt="Barly"
      width={sizes.width}
      height={sizes.height}
      className={cn(sizes.className, className)}
      priority
    />
  );
}

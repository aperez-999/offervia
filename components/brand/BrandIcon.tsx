import Image from "next/image";

export default function BrandIcon({
  size = 32,
  priority = false,
  className,
}: {
  size?: number;
  priority?: boolean;
  className?: string;
}) {
  return (
    <Image
      src="/offervia-icon-square.png"
      alt="Offervia icon"
      width={size}
      height={size}
      priority={priority}
      className={className}
    />
  );
}

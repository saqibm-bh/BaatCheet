import React, { useEffect, useState } from "react";
import { BsPersonFill } from "react-icons/bs";

export default function UserAvatar({
  src,
  alt = "User avatar",
  sizeClass = "w-10 h-10",
  className = "",
  fallbackClassName = "",
  iconClassName = "",
  ...rest
}) {
  const [hasError, setHasError] = useState(false);

  const shouldSkipLegacyUrl =
    typeof src === "string" && src.includes("s3bucket.bytenode.xyz");

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (src && !hasError && !shouldSkipLegacyUrl) {
    return (
      <img
        src={src}
        alt={alt}
        className={`${sizeClass} rounded-full object-cover ${className}`}
        onError={() => setHasError(true)}
        {...rest}
      />
    );
  }

  return (
    <div
      aria-label={alt}
      className={`${sizeClass} rounded-full bg-muted border border-border/60 text-muted-foreground flex items-center justify-center ${fallbackClassName}`}
    >
      <BsPersonFill className={iconClassName || "text-[55%]"} />
    </div>
  );
}

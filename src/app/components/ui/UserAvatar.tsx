"use client";

import Image from "next/image";
type UserAvatarProps = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  size?: number;
  className?: string;
};

function normalizeLabel(value: string | null | undefined) {
  if (!value) return "U";
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : "U";
}

function initials(label: string) {
  const parts = label.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function stringHue(input: string) {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) % 360;
  }
  return h;
}

export default function UserAvatar({
  name,
  email,
  image,
  size = 40,
  className = "",
}: UserAvatarProps) {
  const labelSource = name || email || "U";
  const normalizedLabel = normalizeLabel(labelSource);
  const hue = stringHue(normalizedLabel);
  const initialsText = initials(normalizedLabel);
  const dimension = `${size}px`;
  const fontSize = `${Math.max(12, Math.round(size * 0.35))}px`;
  const backgroundColor = `hsl(${hue} 65% 92%)`;
  const color = `hsl(${hue} 40% 20%)`;

  const style = {
    width: dimension,
    height: dimension,
    fontSize,
  } as const;

  if (image) {
    return (
      <Image
        src={image}
        alt={normalizedLabel}
        width={size}
        height={size}
        className={`inline-flex items-center justify-center rounded-full object-cover shadow-soft ${className}`}
        style={{ ...style }}
        loading="lazy"
        unoptimized
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-semibold uppercase ${className}`}
      title={normalizedLabel}
      style={{
        ...style,
        backgroundColor,
        color,
      }}
      aria-hidden="true"
    >
      {initialsText}
    </span>
  );
}

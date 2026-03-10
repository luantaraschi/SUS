"use client";

interface BotIconProps {
  className?: string;
}

export default function BotIcon({ className = "" }: BotIconProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M16 6V10" />
      <circle cx="16" cy="4" r="1.75" fill="currentColor" stroke="none" />
      <path d="M6 16H4" />
      <path d="M28 16H26" />
      <rect x="6" y="10" width="20" height="16" rx="8" />
      <circle cx="12" cy="17" r="1.75" fill="currentColor" stroke="none" />
      <circle cx="20" cy="17" r="1.75" fill="currentColor" stroke="none" />
      <path d="M11.5 21.5C12.9 22.7 14.2 23.25 16 23.25C17.8 23.25 19.1 22.7 20.5 21.5" />
    </svg>
  );
}

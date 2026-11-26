"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";

interface PointerFillLinkProps {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
}

export function PointerFillLink({
  href,
  children,
  variant = "primary",
  className = "",
}: PointerFillLinkProps) {
  const btnRef = useRef<HTMLAnchorElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);
  const [isFilled, setIsFilled] = useState(false);

  const getCoords = (e: React.PointerEvent<HTMLAnchorElement>) => {
    const rect = btnRef.current?.getBoundingClientRect();
    if (!rect) return "50% 50%";
    return `${Math.round(e.clientX - rect.left)}px ${Math.round(e.clientY - rect.top)}px`;
  };

  const handleEnter = (e: React.PointerEvent<HTMLAnchorElement>) => {
    if (
      typeof window === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      window.matchMedia("(hover: none)").matches
    ) {
      return;
    }
    const at = getCoords(e);
    setIsFilled(true);
    if (fillRef.current) {
      gsap.set(fillRef.current, { clipPath: `circle(0% at ${at})` });
      gsap.to(fillRef.current, {
        clipPath: `circle(155% at ${at})`,
        duration: 0.5,
        ease: "power3.out",
        overwrite: true,
      });
    }
  };

  const handleLeave = (e: React.PointerEvent<HTMLAnchorElement>) => {
    if (
      typeof window === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      window.matchMedia("(hover: none)").matches
    ) {
      return;
    }
    const at = getCoords(e);
    setIsFilled(false);
    if (fillRef.current) {
      gsap.to(fillRef.current, {
        clipPath: `circle(0% at ${at})`,
        duration: 0.42,
        ease: "power3.out",
        overwrite: true,
      });
    }
  };

  const baseStyles =
    variant === "primary"
      ? "bg-[#18181B] dark:bg-[#EDEDED] text-[#FBFBF9] dark:text-[#121212]"
      : `bg-[#F4F4F0] dark:bg-[#1C1C1C] border border-black/[0.14] dark:border-white/[0.16] ${
          isFilled
            ? "text-[#FBFBF9] dark:text-[#121212]"
            : "text-[#18181B] dark:text-[#EDEDED]"
        }`;

  const inkStyles =
    variant === "primary"
      ? "bg-[#3A3A40] dark:bg-[#D4D4D8]"
      : "bg-[#18181B] dark:bg-[#EDEDED]";

  return (
    <Link
      ref={btnRef}
      href={href}
      onPointerEnter={handleEnter}
      onPointerLeave={handleLeave}
      className={`btn-fill h-12 px-7 rounded-xl text-sm font-semibold inline-flex items-center justify-center transition-colors duration-200 cursor-pointer select-none ${baseStyles} ${className}`}
    >
      <span ref={fillRef} className={`btn-fill__ink ${inkStyles}`} aria-hidden="true" />
      <span className="relative z-10">{children}</span>
    </Link>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PointerFillLink } from "./pointer-fill-link";
import { KineticTallyField } from "./kinetic-tally-field";

const EDITORIAL_PILLARS = [
  {
    title: "Daily attendance",
    copy: "Everyone starts marked present. Just tap the students who are absent or late, add a quick note if needed, and save.",
  },
  {
    title: "Monthly fee ledger",
    copy: "Monthly dues are calculated automatically from each student's batch fees and custom sibling discounts—no manual totaling.",
  },
  {
    title: "WhatsApp reminders",
    copy: "Send pre-filled fee reminders or absence updates directly on WhatsApp with the student's name, month, and exact balance.",
  },
];

const MANIFESTO_TEXT =
  "Teaching takes enough energy without spending your evenings flipping through paper registers, totaling half-paid fees by hand, or writing out reminder messages one parent at a time.";

const MANIFESTO_WORDS = MANIFESTO_TEXT.split(" ");

const TEACHING_BEATS = [
  {
    numeral: "6:59",
    unit: "pm",
    label: "Start of class",
    title: "Take attendance before picking up the marker.",
    body: "Every student in the batch starts marked present. Tap only the absentees, save the roll call, and optionally notify absent students' parents on WhatsApp.",
  },
  {
    numeral: "01",
    unit: "st",
    label: "Start of the month",
    title: "Monthly fee bills are ready automatically.",
    body: "Scribadoo calculates each student's monthly fee across their enrolled batches, applies any custom sibling or scholarship fee, and separates paid from pending dues.",
  },
  {
    numeral: "8:45",
    unit: "pm",
    label: "After the last batch",
    title: "Follow up on pending fees without phone calls.",
    body: "Open your pending dues list and tap Remind. WhatsApp opens with a polite, pre-written message containing the student's name, billing month, and exact balance due.",
  },
];

const INDEX_ROWS = [
  {
    task: "Daily attendance",
    paper: "Calling out every name from a notebook",
    scribadoo: "Tap only absent or late students and save",
  },
  {
    task: "Monthly fee totals",
    paper: "Calculating batch fees and sibling discounts by hand",
    scribadoo: "Auto-calculated on the 1st for active students",
  },
  {
    task: "Partial & pending dues",
    paper: "Flipping back through pages to check who paid half",
    scribadoo: "Instant ledger showing paid, partial, and overdue",
  },
  {
    task: "Parent follow-ups",
    paper: "Awkward phone calls or typing texts manually",
    scribadoo: "One-tap WhatsApp draft with exact balance",
  },
  {
    task: "Payment receipts",
    paper: "Handwritten slips that easily get lost",
    scribadoo: "Numbered digital receipt ready to share anytime",
  },
];

export function LandingMotionSections({
  isAuthenticated = false,
}: {
  isAuthenticated?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pinnedStageRef = useRef<HTMLDivElement>(null);
  const pinnedProgressRef = useRef<HTMLDivElement>(null);
  const beatContentRef = useRef<HTMLDivElement>(null);
  const [activeBeat, setActiveBeat] = useState(0);
  const [activeIndexRow, setActiveIndexRow] = useState<number | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      gsap.from(".hero-mask-line", {
        yPercent: 110,
        duration: 0.9,
        stagger: 0.08,
        ease: "power4.out",
      });

      gsap.from(".hero-fade-in", {
        y: 14,
        opacity: 0,
        duration: 0.75,
        delay: 0.2,
        stagger: 0.07,
        ease: "power3.out",
      });

      const wordEls = gsap.utils.toArray<HTMLElement>(".manifesto-word");
      if (wordEls.length > 0) {
        gsap.fromTo(
          wordEls,
          { opacity: 0.2 },
          {
            opacity: 1,
            stagger: 0.04,
            ease: "none",
            scrollTrigger: {
              trigger: ".manifesto-section",
              start: "top 80%",
              end: "bottom 55%",
              scrub: 0.4,
            },
          }
        );
      }

      const mm = gsap.matchMedia();
      mm.add("(min-width: 1024px)", () => {
        if (!pinnedStageRef.current) return;

        ScrollTrigger.create({
          trigger: pinnedStageRef.current,
          start: "top 14%",
          end: "+=140%",
          pin: true,
          scrub: 0.4,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (pinnedProgressRef.current) {
              gsap.set(pinnedProgressRef.current, { scaleX: self.progress });
            }
            const idx = Math.min(
              TEACHING_BEATS.length - 1,
              Math.floor(self.progress * TEACHING_BEATS.length)
            );
            setActiveBeat((prev) => (prev !== idx ? idx : prev));
          },
        });
      });

      gsap.utils.toArray<HTMLElement>(".index-rule").forEach((rule) => {
        gsap.fromTo(
          rule,
          { scaleX: 0 },
          {
            scaleX: 1,
            ease: "none",
            scrollTrigger: {
              trigger: rule,
              start: "top 92%",
              end: "top 70%",
              scrub: 0.35,
            },
          }
        );
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !beatContentRef.current
    ) {
      return;
    }
    gsap.fromTo(
      beatContentRef.current,
      { y: 10, opacity: 0.4 },
      { y: 0, opacity: 1, duration: 0.28, ease: "power3.out" }
    );
  }, [activeBeat]);

  const currentBeat = TEACHING_BEATS[activeBeat];

  return (
    <div ref={containerRef} className="w-full flex flex-col">
      <section className="flex flex-col gap-10 sm:gap-12 pt-4 sm:pt-8 pb-10 sm:pb-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
          <div className="lg:col-span-7 flex flex-col justify-between gap-8">
            <h1
              className="font-heading font-extrabold text-[#18181B] dark:text-[#EDEDED] tracking-[-0.038em] leading-[0.95]"
              style={{ fontSize: "clamp(2.85rem, 6.8vw, 6.25rem)" }}
            >
              <span className="block overflow-hidden pb-1.5">
                <span className="block hero-mask-line">Manage batches,</span>
              </span>
              <span className="block overflow-hidden pb-1.5">
                <span className="block hero-mask-line">attendance, and</span>
              </span>
              <span className="block overflow-hidden pb-1.5 text-[#52525B] dark:text-[#A3A3A3]">
                <span className="block hero-mask-line">monthly fees.</span>
              </span>
            </h1>

            <div className="hero-fade-in flex flex-col gap-6 pt-2">
              <p className="text-[#52525B] dark:text-[#A3A3A3] text-base sm:text-lg leading-relaxed max-w-2xl">
                A digital register built for tuition teachers and coaching classes. Mark daily roll call in a few taps, track monthly fee payments automatically, and send polite WhatsApp reminders to parents.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {isAuthenticated ? (
                  <>
                    <PointerFillLink href="/batches" variant="primary">
                      Open your batches
                    </PointerFillLink>
                    <PointerFillLink href="/students" variant="secondary">
                      View student roster
                    </PointerFillLink>
                  </>
                ) : (
                  <>
                    <PointerFillLink href="/login" variant="primary">
                      Get started free
                    </PointerFillLink>
                    <PointerFillLink href="/login" variant="secondary">
                      Sign in
                    </PointerFillLink>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="hidden lg:block lg:col-span-5 hero-fade-in">
            <KineticTallyField />
          </div>
        </div>

        <div className="rounded-3xl bg-[#F4F4F0] dark:bg-[#1C1C1C] p-6 sm:p-10 grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10">
          {EDITORIAL_PILLARS.map((pillar) => (
            <div key={pillar.title} className="flex flex-col gap-2.5">
              <h2 className="font-heading text-xl sm:text-2xl font-bold text-[#18181B] dark:text-[#EDEDED] tracking-tight">
                {pillar.title}
              </h2>
              <p className="text-base text-[#52525B] dark:text-[#A3A3A3] leading-relaxed">
                {pillar.copy}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="manifesto-section py-12 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12">
          <p
            className="lg:col-span-11 font-heading font-semibold text-[#18181B] dark:text-[#EDEDED] tracking-[-0.025em] leading-[1.22]"
            style={{ fontSize: "clamp(1.65rem, 3.6vw, 3.1rem)" }}
          >
            {MANIFESTO_WORDS.map((word, idx) => (
              <span key={idx} className="manifesto-word inline-block mr-[0.26em]">
                {word}
              </span>
            ))}
          </p>
        </div>
      </section>

      <section className="py-10 sm:py-14">
        <div
          ref={pinnedStageRef}
          className="hidden lg:flex flex-col justify-between min-h-[78vh] rounded-3xl bg-[#F4F4F0] dark:bg-[#1C1C1C] p-10 xl:p-14"
        >
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between text-sm text-[#52525B] dark:text-[#A3A3A3]">
              <span>A normal teaching day with Scribadoo</span>
              <span className="font-mono font-medium text-[#18181B] dark:text-[#EDEDED]">
                Step {activeBeat + 1} of {TEACHING_BEATS.length}
              </span>
            </div>
            <div className="w-full h-px bg-black/[0.08] dark:bg-white/[0.1] relative overflow-hidden">
              <div
                ref={pinnedProgressRef}
                className="absolute inset-0 bg-[#18181B] dark:bg-[#EDEDED] origin-left scale-x-0"
              />
            </div>
          </div>

          <div
            ref={beatContentRef}
            className="grid grid-cols-12 gap-12 items-center py-6 my-auto"
          >
            <div className="col-span-5 flex items-baseline gap-2">
              <span
                className="font-heading font-extrabold text-[#18181B] dark:text-[#EDEDED] tracking-[-0.04em] leading-none font-mono"
                style={{ fontSize: "clamp(6rem, 12vw, 10.5rem)" }}
              >
                {currentBeat.numeral}
              </span>
              <span className="font-heading text-2xl font-bold text-[#52525B] dark:text-[#A3A3A3]">
                {currentBeat.unit}
              </span>
            </div>

            <div className="col-span-7 flex flex-col gap-5">
              <span className="text-sm font-medium text-[#52525B] dark:text-[#A3A3A3]">
                {currentBeat.label}
              </span>
              <h2 className="font-heading text-4xl xl:text-5xl font-bold text-[#18181B] dark:text-[#EDEDED] tracking-tight leading-[1.1]">
                {currentBeat.title}
              </h2>
              <p className="text-lg text-[#52525B] dark:text-[#A3A3A3] leading-relaxed max-w-2xl">
                {currentBeat.body}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6 pt-6 border-t border-black/[0.08] dark:border-white/[0.1]">
            {TEACHING_BEATS.map((beat, i) => {
              const isSelected = activeBeat === i;
              return (
                <button
                  key={beat.numeral}
                  type="button"
                  onClick={() => setActiveBeat(i)}
                  className={`text-left flex flex-col gap-1 py-2 transition-opacity cursor-pointer ${
                    isSelected ? "opacity-100" : "opacity-45 hover:opacity-80"
                  }`}
                >
                  <span className="font-mono text-sm font-semibold text-[#18181B] dark:text-[#EDEDED]">
                    {beat.numeral} {beat.unit}
                  </span>
                  <span className="text-sm text-[#52525B] dark:text-[#A3A3A3] truncate">
                    {beat.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:hidden flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#18181B] dark:text-[#EDEDED] tracking-tight">
              A normal teaching day with Scribadoo.
            </h2>
            <p className="text-base text-[#52525B] dark:text-[#A3A3A3]">
              Three daily tasks handled in one place.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {TEACHING_BEATS.map((beat) => (
              <article
                key={beat.numeral}
                className="p-6 rounded-2xl bg-[#F4F4F0] dark:bg-[#1C1C1C] flex flex-col gap-3"
              >
                <div className="flex items-baseline justify-between gap-4">
                  <span className="font-mono text-3xl font-extrabold text-[#18181B] dark:text-[#EDEDED]">
                    {beat.numeral} {beat.unit}
                  </span>
                  <span className="text-sm text-[#52525B] dark:text-[#A3A3A3]">
                    {beat.label}
                  </span>
                </div>
                <h3 className="font-heading text-xl font-bold text-[#18181B] dark:text-[#EDEDED]">
                  {beat.title}
                </h3>
                <p className="text-base text-[#52525B] dark:text-[#A3A3A3] leading-relaxed">
                  {beat.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 flex flex-col gap-8">
        <div className="flex flex-col gap-2 max-w-2xl">
          <h2 className="font-heading text-2xl sm:text-4xl text-[#18181B] dark:text-[#EDEDED] font-bold tracking-tight">
            Why teachers switch from paper registers.
          </h2>
          <p className="text-[#52525B] dark:text-[#A3A3A3] text-base leading-relaxed">
            Every feature replaces a slow, error-prone paper habit with a fast digital workflow.
          </p>
        </div>

        <div className="w-full">
          <div className="hidden md:grid md:grid-cols-12 gap-4 pb-3 text-sm font-semibold text-[#52525B] dark:text-[#A3A3A3]">
            <div className="md:col-span-3">Routine task</div>
            <div className="md:col-span-4">Paper notebook</div>
            <div className="md:col-span-5 text-[#18181B] dark:text-[#EDEDED]">With Scribadoo</div>
          </div>

          <div className="flex flex-col">
            {INDEX_ROWS.map((row, index) => {
              const isActive = activeIndexRow === index;
              return (
                <div
                  key={row.task}
                  onMouseEnter={() => setActiveIndexRow(index)}
                  onMouseLeave={() => setActiveIndexRow(null)}
                  onClick={() => setActiveIndexRow(isActive ? null : index)}
                  className={`relative py-5 sm:py-6 px-2 sm:px-3 -mx-2 sm:-mx-3 rounded-xl transition-colors duration-200 cursor-default ${
                    isActive ? "bg-[#F4F4F0] dark:bg-[#1C1C1C]" : ""
                  }`}
                >
                  <div
                    className="index-rule absolute top-0 inset-x-2 sm:inset-x-3 h-px bg-black/[0.08] dark:bg-white/[0.1] origin-left"
                    aria-hidden="true"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 items-baseline">
                    <div
                      className={`md:col-span-3 text-base font-semibold text-[#18181B] dark:text-[#EDEDED] transition-transform duration-200 ${
                        isActive ? "md:translate-x-2" : ""
                      }`}
                    >
                      {row.task}
                    </div>
                    <div className="md:col-span-4 text-sm sm:text-base text-[#52525B] dark:text-[#A3A3A3]">
                      <span className="md:hidden font-medium">Paper: </span>
                      {row.paper}
                    </div>
                    <div
                      className={`md:col-span-5 text-sm sm:text-base font-medium text-[#18181B] dark:text-[#EDEDED] transition-transform duration-200 ${
                        isActive ? "md:translate-x-1" : ""
                      }`}
                    >
                      <span className="md:hidden font-semibold">Scribadoo: </span>
                      {row.scribadoo}
                    </div>
                  </div>
                </div>
              );
            })}
            <div
              className="index-rule h-px w-full bg-black/[0.08] dark:bg-white/[0.1] origin-left"
              aria-hidden="true"
            />
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 flex flex-col lg:flex-row items-start lg:items-end justify-between gap-8">
        <div className="flex flex-col gap-3 max-w-2xl">
          <h2
            className="font-heading font-extrabold text-[#18181B] dark:text-[#EDEDED] tracking-[-0.03em] leading-[1.04]"
            style={{ fontSize: "clamp(2.25rem, 5vw, 4.5rem)" }}
          >
            Ready to organize your classes?
          </h2>
          <p className="text-[#52525B] dark:text-[#A3A3A3] text-base sm:text-lg leading-relaxed">
            Create your free teacher account, add your first batch, and manage attendance and fees in one place.
          </p>
        </div>

        <div className="shrink-0">
          {isAuthenticated ? (
            <PointerFillLink href="/batches" variant="primary">
              Open your batches
            </PointerFillLink>
          ) : (
            <PointerFillLink href="/login" variant="primary">
              Get started free
            </PointerFillLink>
          )}
        </div>
      </section>
    </div>
  );
}

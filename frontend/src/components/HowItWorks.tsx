type Step = {
  id: string;
  number: string;
  title: string;
  description: string;
  accent: string;
  chip: string;
  glow: string;
  align: "left" | "right";
};

const steps: Step[] = [
  {
    id: "step-1",
    number: "01",
    title: "Choose campaign",
    description:
      "Buy Modesh Credit from the prize campaign that matches your style.",
    accent: "from-[#2cc98d] to-[#14af7d]",
    chip: "bg-[#146c4d]",
    glow: "shadow-[0_18px_35px_rgba(20,175,125,0.2)]",
    align: "left",
  },
  {
    id: "step-2",
    number: "02",
    title: "Earn entries",
    description:
      "Every purchase unlocks entries for big-ticket prizes and daily wins.",
    accent: "from-[#ff5d7d] to-[#ef456d]",
    chip: "bg-[#8d1948]",
    glow: "shadow-[0_18px_35px_rgba(239,69,109,0.2)]",
    align: "right",
  },
  {
    id: "step-3",
    number: "03",
    title: "Follow the draw",
    description:
      "Track the live draw and keep an eye on your results in real time.",
    accent: "from-[#7567ef] to-[#5d4fe1]",
    chip: "bg-[#342a7a]",
    glow: "shadow-[0_18px_35px_rgba(93,79,225,0.2)]",
    align: "left",
  },
  {
    id: "step-4",
    number: "04",
    title: "Redeem rewards",
    description:
      "Cash out or shop on the Modesh store with your credited rewards.",
    accent: "from-[#ff82c1] to-[#f75ab0]",
    chip: "bg-[#8d2d68]",
    glow: "shadow-[0_18px_35px_rgba(247,90,176,0.2)]",
    align: "right",
  },
];

function HowItWorks() {
  return (
    <section
      id="how"
      className="relative overflow-hidden bg-[#f5efe9] py-12 sm:py-16 lg:py-20"
    >
      <style>{`
        .how-it-works-grid {
          position: relative;
        }

        .how-it-works-grid::before {
          content: "";
          position: absolute;
          left: 50%;
          top: 32px;
          bottom: 32px;
          width: 4px;
          transform: translateX(-50%);
          background: linear-gradient(180deg, rgba(23, 19, 16, 0.18), rgba(23, 19, 16, 0.58), rgba(23, 19, 16, 0.18));
          border-radius: 9999px;
          display: none;
        }

        @media (min-width: 1024px) {
          .how-it-works-grid::before {
            display: block;
          }
        }
      `}</style>

      <div className="mx-auto w-full max-w-245 px-4 sm:px-6 lg:px-0">
        <div className="mb-10 flex justify-center">
          <div className="rounded-full border-[3px] border-[#171310] bg-[#f4ce45] px-7 py-3 shadow-[5px_5px_0_#171310]">
            <h2 className="font-display text-[2rem] leading-none uppercase tracking-[0.04em] text-ink sm:text-[2.6rem]">
              How it works
            </h2>
          </div>
        </div>

        <div className="how-it-works-grid space-y-6 lg:space-y-7">
          {steps.map((step, index) => {
            const isRight = step.align === "right";
            const isLast = index === steps.length - 1;

            return (
              <div
                key={step.id}
                className="relative grid items-center gap-4 lg:grid-cols-[1fr_120px_1fr]"
              >
                {isRight ? <div className="hidden lg:block" /> : null}

                <div
                  className={`relative ${isRight ? "lg:col-start-3" : "lg:col-start-1"}`}
                >
                  <div
                    className={`relative overflow-hidden rounded-[24px] border-[3px] border-[#171310] bg-gradient-to-r ${step.accent} ${step.glow} shadow-[6px_6px_0_#171310]`}
                  >
                    <div className="flex min-h-[170px] flex-col justify-between gap-5 p-5 sm:p-6">
                      <div className="flex items-center justify-between gap-3">
                        <div
                          className={`inline-flex rounded-full border-[3px] border-[#171310] ${step.chip} px-3 py-1.5 text-[0.68rem] font-black uppercase tracking-[0.12em] text-white`}
                        >
                          {step.title}
                        </div>
                        <div className="flex h-11 w-11 items-center justify-center rounded-full border-[3px] border-[#171310] bg-[#fffaf7] text-sm font-black text-ink">
                          {step.number}
                        </div>
                      </div>

                      <p className="max-w-[18rem] text-[1.05rem] font-black leading-[1.2] text-white sm:text-[1.18rem]">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>

                {!isRight ? (
                  <div className="hidden items-center justify-center lg:flex">
                    <div className="relative flex h-16 w-16 items-center justify-center">
                      <div className="absolute h-12 w-12 rounded-full border-[3px] border-[#171310] bg-[#fffaf7]" />
                      <div className="absolute h-5 w-5 rotate-45 rounded-[6px] border-b-[3px] border-r-[3px] border-[#171310] bg-[#f4ce45]" />
                    </div>
                  </div>
                ) : (
                  <div className="hidden items-center justify-center lg:flex">
                    <div className="relative flex h-16 w-16 items-center justify-center">
                      <div className="absolute h-12 w-12 rounded-full border-[3px] border-[#171310] bg-[#fffaf7]" />
                      <div className="absolute h-5 w-5 rotate-45 rounded-[6px] border-b-[3px] border-l-[3px] border-[#171310] bg-[#f4ce45]" />
                    </div>
                  </div>
                )}

                {!isLast && (
                  <div className="flex justify-center lg:hidden">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border-[3px] border-[#171310] bg-[#fffaf7] shadow-[4px_4px_0_#171310]">
                      <div className="h-4 w-4 rotate-45 rounded-[4px] border-b-[3px] border-r-[3px] border-[#171310] bg-[#f4ce45]" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;

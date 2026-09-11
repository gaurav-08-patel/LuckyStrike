type Step = {
  id: string;
  title: string;
  description: string;
  cardClass: string;
  textClass: string;
  align: "left" | "right";
};

const steps: Step[] = [
  {
    id: "step-1",
    title: "STEP 1",
    description: "Buy Modesh Credit from the prize campaign of your choice.",
    cardClass: "from-[#4dd7a3] to-[#53c59a]",
    textClass: "text-white",
    align: "left",
  },
  {
    id: "step-2",
    title: "STEP 2",
    description:
      "Get entries to amazing prizes with every purchase of Modesh Credit.",
    cardClass: "from-[#ff5f8b] to-[#f44a7d]",
    textClass: "text-white",
    align: "right",
  },
  {
    id: "step-3",
    title: "STEP 3",
    description: "Watch the draws live from the App to see if you won!",
    cardClass: "from-[#8b7af0] to-[#7b68e5]",
    textClass: "text-white",
    align: "left",
  },
  {
    id: "step-4",
    title: "STEP 4",
    description:
      "Redeem your credits to shop clothing & accessories at our Modesh online store.",
    cardClass: "from-[#ff66b6] to-[#f94ea8]",
    textClass: "text-white",
    align: "right",
  },
];

function HowItWorks() {
  return (
    <section id="how" className="bg-[#d8d8d8] py-12 sm:py-16 lg:py-20">
      <div className="mx-auto w-full max-w-245 px-4 sm:px-6 lg:px-0">
        <div className="mb-8 flex justify-center">
          <div className="rounded-full border-4 border-ink bg-[#33d39b] px-7 py-4 shadow-[5px_5px_0_#171310]">
            <h2 className="font-display text-[2.1rem] leading-none uppercase tracking-[0.04em] text-ink sm:text-[2.8rem]">
              How it works
            </h2>
          </div>
        </div>

        <div className="space-y-5 lg:space-y-8">
          {steps.map((step, index) => {
            const isLast = index === steps.length - 1;
            const isRight = step.align === "right";

            return (
              <div
                key={step.id}
                className="flex flex-col items-center gap-3 lg:gap-0"
              >
                <div className="grid w-full items-center gap-4 lg:grid-cols-[1fr_100px_1fr]">
                  {isRight ? (
                    <>
                      <div className="hidden lg:block" />
                      <div className="hidden items-center justify-center lg:flex">
                        <div className="relative flex h-16 w-16 items-center justify-center">
                          <div className="absolute h-14 w-14 rounded-full border-4 border-[#171310] border-l-transparent border-b-transparent rotate-45" />
                          <div className="absolute h-4 w-4 rotate-45 border-b-4 border-l-4 border-[#171310] -translate-x-[14px] -translate-y-[10px]" />
                        </div>
                      </div>
                    </>
                  ) : null}

                  <div
                    className={`relative overflow-hidden rounded-3xl border-4 border-[#171310] bg-gradient-to-r ${step.cardClass} shadow-[6px_6px_0_#171310] ${
                      isRight ? "lg:col-start-3" : "lg:col-start-1"
                    }`}
                  >
                    <div className="flex min-h-[180px] flex-col justify-between gap-5 p-5 sm:p-6 lg:p-7">
                      <div className="flex items-center gap-4">
                        <div className="inline-flex rounded-full border-4 border-[#171310] bg-[#171310] px-4 py-2 text-[0.8rem] font-black uppercase tracking-[0.08em] text-white">
                          {step.title}
                        </div>
                      </div>

                      <p
                        className={`max-w-[17rem] text-[1.05rem] font-black leading-[1.15] sm:text-[1.15rem] ${step.textClass}`}
                      >
                        {step.description}
                      </p>
                    </div>
                  </div>

                  {isRight ? null : (
                    <div className="hidden items-center justify-center lg:flex">
                      <div className="relative flex h-16 w-16 items-center justify-center">
                        <div className="absolute h-14 w-14 rounded-full border-4 border-[#171310] border-r-transparent border-b-transparent rotate-45" />
                        <div className="absolute h-4 w-4 rotate-45 border-b-4 border-r-4 border-[#171310] translate-x-[14px] -translate-y-[10px]" />
                      </div>
                    </div>
                  )}
                </div>

                {!isLast && (
                  <div className="flex justify-center lg:hidden">
                    <div className="flex h-14 w-14 items-center justify-center">
                      <div className="h-10 w-10 rotate-45 rounded-xl border-4 border-[#171310] border-l-transparent border-b-transparent" />
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

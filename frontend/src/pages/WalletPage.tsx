import { useMemo, useState } from "react";
import SiteHeader from "../components/SiteHeader";

const presetAmounts = [50, 250, 500, 1000, 2000];

function WalletPage() {
  const [selectedAmount, setSelectedAmount] = useState<number>(50);
  const [customAmount, setCustomAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "voucher">(
    "card",
  );

  const activeAmount = useMemo(() => {
    if (customAmount.trim()) {
      const parsed = Number(customAmount);
      if (!Number.isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }

    return selectedAmount;
  }, [customAmount, selectedAmount]);

  const formattedAmount = new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: "AED",
    maximumFractionDigits: 0,
  }).format(activeAmount);

  return (
    <main className="min-h-screen bg-[#eae7e5] text-ink">
      <SiteHeader
        brand={
          <>
            Lucky<span className="text-red">Strike</span>
          </>
        }
      />

      <section className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="mb-8 flex items-end justify-between gap-4">
          <h1 className="font-display text-5xl uppercase leading-none tracking-[-0.08em] text-ink sm:text-6xl">
            Wallet
          </h1>
          <span className="hidden rounded-full border-[3px] border-ink bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-ink shadow-[3px_3px_0_#171310] sm:inline-flex">
            Secure checkout
          </span>
        </div>

        <div className="relative overflow-hidden rounded-[34px] border-[3px] border-ink bg-[linear-gradient(135deg,#ff3c8c_0%,#ff5f8f_30%,#ff2b74_100%)] p-5 shadow-[10px_10px_0_#171310] sm:p-8 lg:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.28),_transparent_26%)]" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-base font-semibold uppercase tracking-[0.12em] text-white/80">
                Available Wallet Balance
              </p>
              <div className="mt-3 flex items-center gap-3 text-4xl font-black text-white sm:text-5xl lg:text-[4rem]">
                <span className="font-display tracking-[-0.08em]">AED</span>
                <span className="font-display tracking-[-0.08em]">0.00</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                className="rounded-full border-[3px] border-ink bg-[#2d59f3] px-6 py-4 text-center font-display text-[1.05rem] uppercase tracking-[0.06em] text-white shadow-[5px_5px_0_#171310] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[7px_7px_0_#171310]"
              >
                Top up with card
              </button>

              <button
                type="button"
                className="rounded-full border-[3px] border-ink bg-[#f7f7f7] px-6 py-4 text-center font-display text-[1.05rem] uppercase tracking-[0.06em] text-ink shadow-[5px_5px_0_#171310] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[7px_7px_0_#171310]"
              >
                Top up with voucher code
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-[30px] border-[3px] border-ink bg-[#f5f3f1] p-4 shadow-[6px_6px_0_#171310] sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="font-display text-[2rem] uppercase leading-none tracking-[-0.06em] text-ink">
                Select top-up amount
              </h2>
              <span className="rounded-full border-[3px] border-ink bg-[#f6d857] px-3 py-1 text-[0.65rem] font-black uppercase tracking-[0.18em] text-ink">
                Popular
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
              {presetAmounts.map((amount) => {
                const isSelected = !customAmount && selectedAmount === amount;
                return (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => {
                      setSelectedAmount(amount);
                      setCustomAmount("");
                    }}
                    className={`rounded-[18px] border-[3px] p-4 text-center font-display text-[1.2rem] uppercase tracking-[-0.04em] transition-all duration-150 ${
                      isSelected
                        ? "border-[#2d59f3] bg-[linear-gradient(180deg,#ffffff_0%,#eef3ff_100%)] text-ink shadow-[4px_4px_0_#171310]"
                        : "border-[#d7d2cf] bg-[#f8f8f7] text-ink/80 shadow-[3px_3px_0_#d7d2cf] hover:border-[#2d59f3]"
                    }`}
                  >
                    AED {amount.toLocaleString("en-AE")}
                  </button>
                );
              })}
            </div>

            <label className="mt-6 block">
              <span className="mb-2 block text-lg font-medium italic text-ink/70">
                or enter an amount (Min AED50.00)
              </span>
              <input
                type="number"
                min={50}
                value={customAmount}
                onChange={(event) => {
                  setCustomAmount(event.target.value);
                  if (event.target.value.trim()) {
                    setSelectedAmount(50);
                  }
                }}
                placeholder="Enter amount"
                className="h-[60px] w-full rounded-[18px] border-[3px] border-ink bg-[#f7f7f7] px-4 text-lg font-medium text-ink outline-none transition-colors placeholder:text-ink/40 focus:border-[#ff3c8c] focus:bg-white"
              />
            </label>
          </div>

          <div className="rounded-[30px] border-[3px] border-ink bg-[#f5f3f1] p-4 shadow-[6px_6px_0_#171310] sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="font-display text-[2rem] uppercase leading-none tracking-[-0.06em] text-ink">
                Select payment option
              </h2>
              <span className="rounded-full border-[3px] border-ink bg-[#93e2c8] px-3 py-1 text-[0.65rem] font-black uppercase tracking-[0.18em] text-ink">
                Safe
              </span>
            </div>

            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setPaymentMethod("card")}
                className={`flex w-full items-center gap-3 rounded-[18px] border-[3px] p-4 text-left transition-all ${
                  paymentMethod === "card"
                    ? "border-[#2d59f3] bg-[linear-gradient(180deg,#ffffff_0%,#edf3ff_100%)] shadow-[4px_4px_0_#171310]"
                    : "border-[#d7d2cf] bg-[#f7f7f7] hover:border-[#2d59f3]"
                }`}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full border-[3px] border-ink bg-[#fff] text-2xl font-black text-ink">
                  +
                </span>
                <span className="text-xl font-black text-ink">
                  Add new card
                </span>
              </button>

              <div className="mt-6 flex items-center justify-between rounded-[18px] border-[3px] border-ink bg-[#f7f7f7] px-4 py-4 shadow-[4px_4px_0_#171310]">
                <span className="text-xl font-black text-ink sm:text-2xl">
                  Total Amount
                </span>
                <span className="font-display text-[2.25rem] uppercase tracking-[-0.06em] text-ink sm:text-[2.8rem]">
                  {formattedAmount}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between rounded-[16px] border-[3px] border-ink bg-[#f3f1f0] px-3 py-2 text-sm font-semibold text-ink/70">
                <span>Instant wallet credit</span>
                <span>Razorpay ready</span>
              </div>

              <button
                type="button"
                className="mt-4 flex h-[72px] w-full items-center justify-center rounded-[18px] border-[3px] border-ink bg-[linear-gradient(135deg,#ff3c8c_0%,#ff6b3d_100%)] text-center font-display text-[1.8rem] uppercase tracking-[0.08em] text-white shadow-[5px_5px_0_#171310] transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.01] hover:bg-[linear-gradient(135deg,#ff2e7f_0%,#ff7a38_100%)] hover:shadow-[7px_7px_0_#171310] active:translate-y-0 active:shadow-[3px_3px_0_#171310]"
              >
                Pay Now
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default WalletPage;

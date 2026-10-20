import { useMemo, useState } from "react";

const faqs = [
  {
    question: "Why am I not receiving the OTP?",
    answer:
      "Please make sure your phone number is entered correctly and that your mobile network signal is active. If you still do not receive the OTP, wait 30–60 seconds and request it again. If the issue continues, contact support with your registered phone number.",
  },
  {
    question: "How do I top up my wallet?",
    answer:
      "Go to Wallet, choose a top-up amount or enter a custom value, select your payment method, and confirm the transaction. The updated balance will appear in your wallet immediately after the payment is processed.",
  },
  {
    question: "Why is my ticket not showing in My Tickets?",
    answer:
      "Your ticket will appear after the purchase is successfully completed and the order is confirmed. If it is missing, refresh the page and check whether the transaction was completed in Wallet. If the issue persists, report it through the support form.",
  },
  {
    question: "How do I know if I won a draw?",
    answer:
      "Winners are announced after the draw closes. You can view results on the Winners page or in your account activity. If your ticket won, the prize is usually reflected in your wallet or the result page for that draw.",
  },
  {
    question: "Can I update my profile details?",
    answer:
      "Yes. Go to the Profile tab and click Edit. You can update your personal details, nationality, country of residence, and profile image. The saved changes are refreshed automatically after your profile is updated.",
  },
  {
    question: "What should I do if my wallet top-up failed?",
    answer:
      "Check whether the payment was deducted from your bank account or UPI app. If the wallet was not updated, try again after a short wait. If the issue continues, report it in the support form with your phone number and a screenshot or payment reference, if available.",
  },
];

export default function SupportTab() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [issueType, setIssueType] = useState("ticket");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const contactCards = useMemo(
    () => [
      {
        label: "Email support",
        value: "support@luckystrike.com",
        href: "mailto:support@luckystrike.com",
      },
      {
        label: "WhatsApp",
        value: "+91 98765 43210",
        href: "https://wa.me/919876543210",
      },
      {
        label: "Response time",
        value: "Usually within 1 hour",
        href: null,
      },
    ],
    [],
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!subject.trim() || !message.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 700));
      setSubmitted(true);
      setSubject("");
      setMessage("");
      setIssueType("ticket");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[#ffe7ec] bg-gradient-to-br from-[#fffafc] to-[#fffdfb] p-5 shadow-sm sm:p-6">
      <div className="mb-6 flex flex-col gap-3 border-b border-[#f1dfe7] pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-pink-600/70">
            Help center
          </p>
          <h2 className="mt-2 font-display text-[2rem] uppercase leading-none tracking-[-0.06em] text-ink sm:text-[2.5rem]">
            Support
          </h2>
        </div>

        <div className="rounded-full border border-[#f1dfe7] bg-[#fff2be] px-3 py-1.5 text-[0.62rem] font-black uppercase tracking-[0.16em] text-ink/80">
          Priority support
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-2xl border border-[#f1dfe7] bg-white/80 p-4 sm:p-5">
          <h3 className="font-display text-[1.5rem] uppercase leading-none tracking-[-0.05em] text-ink">
            FAQs
          </h3>

          <div className="mt-4 space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = openIndex === index;

              return (
                <div
                  key={faq.question}
                  className="overflow-hidden rounded-xl border border-[#f1dfe7] bg-[#fffafc] transition-colors duration-200 hover:border-[#f4b7cb]"
                >
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors duration-200"
                  >
                    <span className="text-base font-medium leading-6 text-ink sm:text-lg">
                      {faq.question}
                    </span>
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#f1dfe7] bg-white text-lg font-black text-pink-600 transition-transform duration-300">
                      <span className={isOpen ? "rotate-45" : "rotate-0"}>
                        +
                      </span>
                    </span>
                  </button>

                  <div
                    className={`grid transition-all duration-300 ease-in-out ${
                      isOpen
                        ? "grid-rows-[1fr] opacity-100"
                        : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="border-t border-[#f1dfe7] bg-[#fffdfd] px-4 pb-4 pt-3 text-sm leading-6 text-ink/75 sm:px-5">
                        {faq.answer}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-[#f1dfe7] bg-[#f7f9ff] p-4">
            <h3 className="font-display text-[1.3rem] uppercase leading-none tracking-[-0.04em] text-ink">
              Contact
            </h3>
            <div className="mt-4 space-y-3">
              {contactCards.map((card) => {
                const content = (
                  <>
                    <p className="text-[0.62rem] font-black uppercase tracking-[0.16em] text-ink/55">
                      {card.label}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-ink">
                      {card.value}
                    </p>
                  </>
                );

                if (card.href) {
                  return (
                    <a
                      key={card.label}
                      href={card.href}
                      target={
                        card.href.startsWith("http") ? "_blank" : undefined
                      }
                      rel={
                        card.href.startsWith("http") ? "noreferrer" : undefined
                      }
                      className="block rounded-xl border border-[#e9dfe6] bg-white px-3 py-3 transition-colors duration-200 hover:border-pink-200 hover:bg-[#fff9fb]"
                    >
                      {content}
                    </a>
                  );
                }

                return (
                  <div
                    key={card.label}
                    className="rounded-xl border border-[#e9dfe6] bg-white px-3 py-3"
                  >
                    {content}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-[#f1dfe7] bg-[#fff7ea] p-4">
            <h3 className="font-display text-[1.3rem] uppercase leading-none tracking-[-0.04em] text-ink">
              Need help urgently?
            </h3>
            <p className="mt-3 text-sm leading-6 text-ink/75">
              Include your registered phone number and any payment or draw
              reference in your message so our team can resolve the issue
              faster.
            </p>
          </div>
        </aside>
      </div>

      <section className="mt-6 rounded-2xl border border-[#f1dfe7] bg-white/80 p-4 sm:p-5">
        <div className="mb-4">
          <h3 className="font-display text-[1.5rem] uppercase leading-none tracking-[-0.05em] text-ink">
            Report an issue
          </h3>
          <p className="mt-2 text-sm text-ink/70">
            Use this form to share the problem. The API endpoint is left as a
            placeholder for future integration.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-[0.7rem] font-black uppercase tracking-[0.15em] text-ink/60">
                Issue type
              </span>
              <select
                value={issueType}
                onChange={(event) => setIssueType(event.target.value)}
                className="h-[48px] w-full rounded-xl border border-[#e9dfe6] bg-white px-3 text-sm font-medium text-ink outline-none transition-colors duration-200 focus:border-pink-300"
              >
                <option value="ticket">Ticket issue</option>
                <option value="wallet">Wallet / payment issue</option>
                <option value="verification">Verification issue</option>
                <option value="draw">Draw / result issue</option>
                <option value="profile">Profile issue</option>
                <option value="other">Other</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-[0.7rem] font-black uppercase tracking-[0.15em] text-ink/60">
                Subject
              </span>
              <input
                type="text"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder="Describe the issue briefly"
                className="h-[48px] w-full rounded-xl border border-[#e9dfe6] bg-white px-3 text-sm font-medium text-ink outline-none transition-colors duration-200 placeholder:text-ink/40 focus:border-pink-300"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-2 block text-[0.7rem] font-black uppercase tracking-[0.15em] text-ink/60">
              Message
            </span>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={5}
              placeholder="Tell us what happened, what you expected, and any relevant draw or payment details."
              className="w-full rounded-xl border border-[#e9dfe6] bg-white px-3 py-3 text-sm font-medium text-ink outline-none transition-colors duration-200 placeholder:text-ink/40 focus:border-pink-300"
            />
          </label>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-ink/60">
              API endpoint will be connected later.
            </p>

            <button
              type="submit"
              disabled={isSubmitting || !subject.trim() || !message.trim()}
              className="rounded-xl bg-gradient-to-r from-[#ff6b73] to-[#ff3b47] px-5 py-2.5 text-sm font-black uppercase tracking-[0.08em] text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Sending..." : "Send support request"}
            </button>
          </div>
        </form>

        {submitted && (
          <div className="mt-4 rounded-xl border border-[#c8ead4] bg-[#edfdf3] px-4 py-3 text-sm font-bold text-[#1b7d51]">
            Your support request has been recorded. We will follow up soon.
          </div>
        )}
      </section>
    </div>
  );
}

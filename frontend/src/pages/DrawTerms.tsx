import type { ReactNode } from "react";

/**
 * Lucky Strike — Draw Terms and Conditions page
 *
 * This page mirrors the structure of the legal agreement and privacy policy
 * pages to keep the site consistent and reusable.
 */

interface SectionProps {
  number: number;
  title: string;
  children: ReactNode;
}

function Section({ number, title, children }: SectionProps) {
  return (
    <section className="mb-6 border-[3px] border-ink bg-paper p-6 shadow-[4px_4px_0_#171310] md:p-8">
      <h2 className="mb-4 flex items-start gap-3 font-display text-2xl md:text-3xl">
        <span className="text-red">{number}.</span> {title}
      </h2>
      <div className="space-y-3 text-[0.98rem] leading-relaxed text-ink/90">
        {children}
      </div>
    </section>
  );
}

export default function DrawTerms() {
  return (
    <main className="min-h-screen bg-warm">
      <div className="border-b-[3px] border-ink bg-paper">
        <div className="mx-auto max-w-[880px] px-6 py-14 md:px-8">
          <span className="mb-5 inline-block border-[3px] border-ink bg-yellow px-4 py-1 text-sm font-bold shadow-[3px_3px_0_#171310]">
            Legal
          </span>
          <h1 className="mb-3 font-display text-4xl md:text-5xl">
            Draw Terms and Conditions
          </h1>
          <p className="text-sm font-medium text-ink/60">
            Last updated: 1 January 2026
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[880px] px-6 py-12 md:px-8">
        <p className="mb-10 text-base leading-relaxed text-ink/90">
          These Draw Terms and Conditions govern participation in all draws,
          prize promotions, and promotional competitions operated by Lucky
          Strike. By purchasing an entry or entering a draw, you agree to be
          bound by these terms. Please read them carefully before taking part.
        </p>

        <Section number={1} title="Eligibility">
          <p>
            Participation is open only to individuals who are at least 18 years
            old and legally entitled to enter prize competitions in their
            jurisdiction. Employees, affiliates, and immediate family of Lucky
            Strike and associated partners may be excluded from certain draws as
            required by law or internal policy.
          </p>
          <p>
            You must provide accurate information and maintain a valid account
            for the duration of the promotion. We reserve the right to cancel
            entries or disqualify any participant where false information,
            fraudulent activity, or misuse is identified.
          </p>
        </Section>

        <Section number={2} title="Entry purchase and validity">
          <p>
            Entry prices, draw dates, prize details, and available ticket limits
            are shown on the Platform and may be updated at any time prior to
            the draw close. Once an entry is purchased, it is final and cannot
            be cancelled, refunded, exchanged, or transferred, except where
            required by law or where a system error is identified by Lucky
            Strike.
          </p>
          <p>
            Each entry is assigned a unique entry number and is entered into the
            relevant draw automatically. We do not guarantee a specific number
            or selection of number, and entry numbers are allocated randomly by
            the platform.
          </p>
        </Section>

        <Section number={3} title="Draw process and winner selection">
          <p>
            Draws are conducted through a random selection process using a
            secure, auditable method. The selected winner is determined at the
            draw time published on the Platform, and the result is final unless
            a material error or legal requirement requires correction.
          </p>
          <p>
            We may postpone, suspend, or cancel a draw if required by law,
            operational issues, or circumstances beyond our reasonable control.
            If a draw is cancelled, any affected entries may be rolled over or
            refunded as determined by Lucky Strike and any applicable rules.
          </p>
        </Section>

        <Section number={4} title="Prize claims and verification">
          <p>
            Winners are notified using the account contact details on file. A
            winner may be asked to provide proof of identity, age, and legal
            eligibility before receiving a prize. Failure to provide requested
            information within the stated timeframe may result in prize
            forfeiture.
          </p>
          <p>
            Prizes are non-transferable and no cash alternative is available
            unless expressly stated in writing by Lucky Strike. Some prizes may
            be subject to tax, customs, import duties, or other local
            requirements, which are the responsibility of the winner.
          </p>
        </Section>

        <Section number={5} title="Payment and fees">
          <p>
            Payment is processed through authorized third-party payment
            providers. Lucky Strike does not store your full payment details. By
            making a purchase, you confirm that all information submitted is
            true and that you are authorized to use the selected payment method.
          </p>
          <p>
            If a payment is declined or reversed, Lucky Strike may void any
            associated entry or suspend account access pending resolution.
          </p>
        </Section>

        <Section number={6} title="Promotions and account responsibility">
          <p>
            You are responsible for keeping your account details and password
            secure. We are not liable for losses arising from unauthorized
            access resulting from your failure to protect your account.
          </p>
          <p>
            Lucky Strike may suspend or terminate any account that is used to
            manipulate a promotion, create multiple accounts, or otherwise abuse
            the Platform. Any suspicious or fraudulent activity may result in
            the loss of entries and prize eligibility.
          </p>
        </Section>

        <Section number={7} title="Intellectual property and marketing">
          <p>
            All promotional materials, branding, text, graphics, and campaign
            content remain the property of Lucky Strike or its licensors. You
            may not reproduce or redistribute these materials without express
            written permission.
          </p>
          <p>
            By participating in a draw, you consent to Lucky Strike using your
            name, username, and, where applicable, a short winner statement for
            marketing and announcement purposes, unless you explicitly withdraw
            that consent in accordance with our privacy practices.
          </p>
        </Section>

        <Section number={8} title="Liability and refunds">
          <p>
            Lucky Strike aims to provide a fair, accurate, and reliable
            platform, but we do not guarantee uninterrupted availability or
            error-free operation. We are not liable for indirect, consequential,
            or punitive losses arising out of participation in a draw, save to
            the extent required by law.
          </p>
          <p>
            Where a refund is required by law or due to an error by Lucky
            Strike, this will be processed at our discretion using the original
            payment method or platform credit where appropriate.
          </p>
        </Section>

        <Section number={9} title="Changes to terms">
          <p>
            We may change these Draw Terms and Conditions at any time to reflect
            legal obligations, product updates, or operational requirements. The
            updated version will be posted on the Platform and will apply from
            the publication date shown at the top of the page.
          </p>
        </Section>

        <Section number={10} title="Contact and support">
          <p>
            For questions relating to any draw, eligibility, or prize claim,
            contact us at{" "}
            <a
              href="mailto:support@luckystrike.com"
              className="font-bold text-red underline"
            >
              support@luckystrike.com
            </a>
            .
          </p>
        </Section>
      </div>
    </main>
  );
}

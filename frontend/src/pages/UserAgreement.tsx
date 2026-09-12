import type { ReactNode } from "react";

/**
 * Lucky Strike — User Agreement page
 *
 * NOTE: This is placeholder legal content written to match the structure
 * typical of prize-draw / raffle platforms. It is NOT legal advice and
 * has not been reviewed by a lawyer. Replace the content with terms
 * drafted or reviewed by qualified legal counsel in your operating
 * jurisdiction before publishing this page live — draw/raffle promotions
 * are usually subject to specific local licensing and consumer-protection
 * regulations that this placeholder does not attempt to satisfy.
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

export default function UserAgreement() {
  return (
    <main className="min-h-screen bg-warm">
      <div className="border-b-[3px] border-ink bg-paper">
        <div className="mx-auto max-w-[880px] px-6 py-14 md:px-8">
          <span className="mb-5 inline-block border-[3px] border-ink bg-yellow px-4 py-1 text-sm font-bold shadow-[3px_3px_0_#171310]">
            Legal
          </span>
          <h1 className="mb-3 font-display text-4xl md:text-5xl">
            User Agreement
          </h1>
          <p className="text-sm font-medium text-ink/60">
            Last updated: 1 January 2026
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[880px] px-6 py-12 md:px-8">
        <p className="mb-10 text-base leading-relaxed text-ink/90">
          This User Agreement explains the rules for using the Lucky Strike
          website and app (the “Platform”), operated by Lucky Strike
          Entertainment LLC (“Lucky Strike,” “we,” “us,” or “our”). By creating
          an account or using the Platform, you agree to be bound by these
          terms. Please read them carefully. We may update this Agreement from
          time to time; continued use of the Platform after an update means you
          accept the revised terms.
        </p>

        <Section number={1} title="Eligibility">
          <p>
            You must be at least 18 years old, or the legal age of majority in
            your jurisdiction if higher, to create an account or enter any draw
            on the Platform. By registering, you confirm that you meet this
            requirement and that all information you provide is accurate and
            truthful.
          </p>
          <p>
            We may refuse, suspend, or terminate any account at our discretion,
            including where we reasonably suspect a violation of these terms or
            applicable law.
          </p>
        </Section>

        <Section number={2} title="Your account">
          <p>
            You&apos;re responsible for keeping your login details secure and
            for all activity that happens under your account. Let us know
            immediately if you suspect unauthorized access. Accounts are
            personal to you and may not be sold, transferred, or shared.
          </p>
          <p>
            Only one account is permitted per person. We may request identity
            verification at any time, particularly before releasing a prize.
          </p>
        </Section>

        <Section number={3} title="Entries and draws">
          <p>
            Purchasing an entry gives you a randomly generated entry number into
            the associated draw. Entry numbers are assigned automatically at
            checkout and cannot be chosen or reserved in advance.
          </p>
          <p>
            Draw dates shown on the Platform are estimates and may move earlier
            or later depending on ticket sales or operational needs; we&apos;ll
            always communicate the confirmed date before a draw takes place.
            Once purchased, entries are final and non-transferable.
          </p>
          <p>
            Each draw is conducted using a verifiable random-selection method.
            Results are final and are not subject to negotiation or dispute,
            except where required by law.
          </p>
        </Section>

        <Section number={4} title="Payments">
          <p>
            All prices shown include applicable taxes unless stated otherwise.
            Payments are processed by a third-party payment provider; we
            don&apos;t store your full card details. Charges are generally
            final, though we&apos;ll issue platform credit or a refund where
            required by law or where we&apos;ve made a billing error.
          </p>
          <p>
            You&apos;re responsible for any currency conversion differences that
            may occur depending on your card issuer or location.
          </p>
        </Section>

        <Section number={5} title="Prizes and winner obligations">
          <p>
            Winners are notified using the contact details on file for their
            account. You may be asked to provide identification before a prize
            is released, to confirm eligibility and comply with applicable
            regulations.
          </p>
          <p>
            Prizes must generally be claimed within the timeframe stated in your
            winner notification. Unclaimed prizes after that period may be
            forfeited or, where required by local regulation, transferred to the
            relevant authority.
          </p>
          <p>
            For non-cash prizes, delivery logistics and any related costs (such
            as customs duties for international winners) will be discussed
            directly with you. Once a prize is handed to a courier for delivery,
            risk transfers to the winner.
          </p>
          <p>
            By accepting a prize, you agree that we may use your name and, where
            you consent, your photo or a short statement, for winner
            announcements on the Platform and our social channels. You can
            withdraw this consent at any time, though this may not be
            retroactive for material already published.
          </p>
        </Section>

        <Section number={6} title="Acceptable use">
          <p>You agree not to, while using the Platform:</p>
          <ul className="list-disc space-y-1 pl-6">
            <li>Provide false or misleading information</li>
            <li>Attempt to manipulate or interfere with the draw process</li>
            <li>
              Use automated tools to scrape, access, or interact with the
              Platform
            </li>
            <li>
              Impersonate another person or misuse another user&apos;s account
            </li>
            <li>Use the Platform for any unlawful purpose</li>
          </ul>
          <p>
            We may suspend or terminate accounts that violate these rules, and
            may forfeit any associated entries where fraud or manipulation is
            reasonably suspected.
          </p>
        </Section>

        <Section number={7} title="Intellectual property">
          <p>
            All content on the Platform — including text, graphics, logos, and
            design — is owned by or licensed to Lucky Strike and is protected by
            copyright and other intellectual property laws. You may view and use
            the Platform for personal, non-commercial purposes only, and may not
            copy, redistribute, or create derivative works from our content
            without written permission.
          </p>
        </Section>

        <Section number={8} title="Disclaimers and limitation of liability">
          <p>
            The Platform is provided “as is.” We work to keep it accurate,
            available, and error-free, but we can&apos;t guarantee uninterrupted
            service and aren&apos;t liable for issues arising from factors
            outside our reasonable control, such as third-party service outages.
          </p>
          <p>
            To the fullest extent permitted by law, our liability for any claim
            relating to your use of the Platform is limited to the amount
            you&apos;ve spent on entries in the 12 months preceding the claim.
          </p>
        </Section>

        <Section number={9} title="Termination">
          <p>
            You may close your account at any time. We may suspend or terminate
            access to the Platform where we believe these terms have been
            violated, or where required by law. Entries already purchased at the
            time of termination are handled in line with the draws they belong
            to, unless termination results from a violation of these terms.
          </p>
        </Section>

        <Section number={10} title="Governing law">
          <p>
            These terms are governed by the laws of [jurisdiction to be
            specified]. Any disputes will be resolved in the courts of that
            jurisdiction, unless applicable consumer protection law gives you
            the right to bring a claim elsewhere.
          </p>
        </Section>

        <Section number={11} title="Contact us">
          <p>
            Questions about this Agreement can be sent to{" "}
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

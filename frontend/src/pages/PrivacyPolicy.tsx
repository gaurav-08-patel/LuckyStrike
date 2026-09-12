import type { ReactNode } from "react";

/**
 * Lucky Strike — Privacy Policy page
 *
 * NOTE: This is placeholder legal content intended to mirror a production
 * privacy policy structure. It is not legal advice and should be reviewed by
 * qualified counsel before going live in a regulated jurisdiction.
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

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-warm">
      <div className="border-b-[3px] border-ink bg-paper">
        <div className="mx-auto max-w-[880px] px-6 py-14 md:px-8">
          <span className="mb-5 inline-block border-[3px] border-ink bg-yellow px-4 py-1 text-sm font-bold shadow-[3px_3px_0_#171310]">
            Legal
          </span>
          <h1 className="mb-3 font-display text-4xl md:text-5xl">
            Privacy Policy
          </h1>
          <p className="text-sm font-medium text-ink/60">
            Last updated: 1 January 2026
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[880px] px-6 py-12 md:px-8">
        <p className="mb-10 text-base leading-relaxed text-ink/90">
          Lucky Strike respects your privacy and is committed to handling your
          personal information responsibly and transparently. This Privacy
          Policy explains what data we collect, why we collect it, how we use
          it, and the choices available to you.
        </p>

        <Section number={1} title="Information we collect">
          <p>
            We may collect information that you provide directly when you create
            an account, participate in a draw, contact support, or otherwise use
            our Platform. This may include your name, email address, phone
            number, date of birth, country of residence, and information needed
            to verify your identity or eligibility.
          </p>
          <p>
            We also automatically collect technical data such as your device
            type, browser, IP address, approximate location, app usage patterns,
            and transaction records. This helps us prevent fraud, improve
            product performance, and maintain the integrity of our draws.
          </p>
        </Section>

        <Section number={2} title="How we use your information">
          <p>
            We use your information to provide services to you, process entries,
            verify account ownership, communicate prizes, deliver customer
            support, maintain security, and comply with legal obligations.
          </p>
          <p>
            We may also use aggregated or anonymized data for analytics, product
            improvements, and internal reporting. If we rely on your consent for
            a specific purpose, we will ask for that consent before proceeding.
          </p>
        </Section>

        <Section number={3} title="Sharing your information">
          <p>
            We do not sell your personal information. We may share it with
            trusted third parties who help operate our platform, such as payment
            processors, cloud hosting providers, fraud-prevention tools, SMS or
            email delivery providers, and customer support partners.
          </p>
          <p>
            We may also disclose personal information where required by law, to
            enforce our terms, or to protect the rights, safety, or security of
            our users or the public.
          </p>
        </Section>

        <Section number={4} title="Cookies and tracking">
          <p>
            Our Platform may use cookies, web beacons, and similar technologies
            to remember your preferences, understand how you navigate the site,
            and improve performance and security. These technologies help us
            recognize returning users and provide more relevant experiences.
          </p>
          <p>
            You can manage cookies in your browser settings, but disabling
            certain cookies may affect functionality such as session
            persistence, login, and the checkout flow.
          </p>
        </Section>

        <Section number={5} title="Data retention">
          <p>
            We retain personal information only for as long as necessary to
            provide services, satisfy legal or regulatory requirements, resolve
            disputes, and enforce our policies. When data is no longer needed,
            we delete or anonymize it in a secure manner.
          </p>
        </Section>

        <Section number={6} title="Security">
          <p>
            We implement reasonable administrative, technical, and
            organizational safeguards designed to protect your data from loss,
            misuse, unauthorized access, and disclosure. No system is completely
            secure, and we cannot guarantee the absolute security of information
            transmitted over the internet.
          </p>
        </Section>

        <Section number={7} title="Your rights">
          <p>
            Depending on your location, you may have rights to access, correct,
            delete, or limit the use of your personal data, and to object to or
            withdraw consent for certain processing activities. You may also be
            able to request a copy of the data we hold about you.
          </p>
          <p>
            To exercise these rights, contact us using the details listed below.
            We may ask you to verify your identity before responding to a
            request.
          </p>
        </Section>

        <Section number={8} title="Children and minors">
          <p>
            Our services are intended for adults and users who meet the legal
            age requirements for participation in the relevant market. We do not
            knowingly collect personal information from children without valid
            parental consent or other lawful basis.
          </p>
        </Section>

        <Section number={9} title="International transfers">
          <p>
            Your information may be transferred to, stored in, or processed in
            countries other than your own. When we do this, we take steps to
            ensure the information is protected in a manner consistent with this
            Privacy Policy and applicable law.
          </p>
        </Section>

        <Section number={10} title="Changes to this policy">
          <p>
            We may update this Privacy Policy from time to time to reflect
            changes in our services, legal obligations, or user needs. We will
            post the updated version on the Platform and update the “Last
            updated” date. Continued use of the Platform after revision means
            you accept the new terms.
          </p>
        </Section>

        <Section number={11} title="Contact us">
          <p>
            If you have any questions about this Privacy Policy or how we
            process personal information, please contact us at{" "}
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

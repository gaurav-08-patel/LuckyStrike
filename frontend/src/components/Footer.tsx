import type { ReactNode } from 'react';

/**
 * Lucky Strike — Footer
 *
 * Reusable, responsive footer in the Pop-Art Ticket design system.
 * All content is passed via props with Lucky Strike defaults, so this
 * component can be dropped into any page and reused across the app.
 */

interface FooterLink {
  label: string;
  href: string;
}

type SocialAccent = 'red' | 'pink' | 'yellow';

interface SocialLink {
  label: string;
  href: string;
  icon: ReactNode;
  /** Background color shown on hover — cycles through the brand accents by default. */
  hoverAccent?: SocialAccent;
}

interface FooterProps {
  logoText?: string;
  primaryLinks?: FooterLink[];
  legalLinks?: FooterLink[];
  whatsappHref?: string;
  phone?: string;
  email?: string;
  socialLinks?: SocialLink[];
  copyrightText?: string;
}

/** Tailwind can't see dynamically-built class strings, so hover styles are spelled out per accent. */
const socialHoverClasses: Record<SocialAccent, string> = {
  red: 'hover:bg-red hover:text-white hover:border-red',
  pink: 'hover:bg-pink hover:text-white hover:border-pink',
  yellow: 'hover:bg-yellow hover:text-ink hover:border-yellow',
};

/* --- Inline icons (kept local so this file has no external icon dependency) --- */

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
      <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" />
    </svg>
  );
}
function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M13.5 21v-7.5H16l.4-3H13.5V8.4c0-.87.24-1.46 1.5-1.46H16.5V4.34C16.2 4.3 15.2 4.2 14 4.2c-2.4 0-4 1.46-4 4.15V10.5H7.5v3H10V21h3.5z" />
    </svg>
  );
}
function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M16.5 3c.3 1.9 1.6 3.4 3.5 3.7v2.6c-1.3 0-2.5-.4-3.5-1.1v6.3c0 3-2.4 5.5-5.5 5.5S5.5 17.5 5.5 14.5 8 9 11 9c.3 0 .6 0 .9.1v2.7c-.3-.1-.6-.2-.9-.2-1.6 0-3 1.3-3 3s1.4 3 3 3 3-1.3 3-3V3h2.5z" />
    </svg>
  );
}
function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M4 4l7.3 8.4L4.4 20h2.1l6-6.5 4.4 6.5H20l-7.6-8.9L19.6 4h-2.1l-5.5 6-4-6H4z" />
    </svg>
  );
}
function LinkedinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M6.9 8.4H3.9V20h3zM5.4 4c-1 0-1.8.8-1.8 1.8S4.4 7.6 5.4 7.6s1.8-.8 1.8-1.8S6.4 4 5.4 4zM20 20v-6.4c0-3.1-1.7-4.6-3.9-4.6-1.8 0-2.6 1-3 1.7V8.4h-3V20h3v-6c0-.6 0-1.2.2-1.6.4-.9 1.1-1.6 2.2-1.6 1.5 0 2.2 1.1 2.2 3V20z" />
    </svg>
  );
}
function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M12 3a9 9 0 00-7.7 13.6L3 21l4.5-1.3A9 9 0 1012 3zm0 16.2a7.2 7.2 0 01-3.7-1l-.3-.2-2.7.8.8-2.6-.2-.3A7.2 7.2 0 1112 19.2zm3.9-5.4c-.2-.1-1.3-.6-1.5-.7-.2-.1-.4-.1-.5.1-.2.2-.6.7-.7.8-.1.2-.3.2-.5.1-1.3-.6-2.1-1.1-3-2.5-.2-.4.2-.3.6-1.1.1-.2 0-.4 0-.5s-.5-1.3-.7-1.7c-.2-.5-.4-.4-.5-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 2s.8 2.3 1 2.5c.1.2 1.7 2.6 4 3.6.6.2 1 .4 1.4.5.6.2 1.1.1 1.5-.1.5-.1 1.3-.5 1.5-1 .2-.5.2-.9.1-1z" />
    </svg>
  );
}
const defaultPrimaryLinks: FooterLink[] = [
  { label: 'Home', href: '/' },
  { label: 'How it works', href: '/how-it-works' },
  { label: 'Wallet', href: '/wallet' },
  { label: 'Entries', href: '/entries' },
  { label: 'Winners', href: '/winners' },
];

const defaultLegalLinks: FooterLink[] = [
  { label: 'User Agreement', href: '/user-agreement' },
  { label: 'Privacy Policy', href: '/privacy-policy' },
  { label: 'Draw Terms and Conditions', href: '/draw-terms' },
];

const defaultSocialLinks: SocialLink[] = [
  { label: 'Instagram', href: '#', icon: <InstagramIcon />, hoverAccent: 'pink' },
  { label: 'Facebook', href: '#', icon: <FacebookIcon />, hoverAccent: 'red' },
  { label: 'TikTok', href: '#', icon: <TikTokIcon />, hoverAccent: 'yellow' },
  { label: 'X', href: '#', icon: <XIcon />, hoverAccent: 'red' },
  { label: 'LinkedIn', href: '#', icon: <LinkedinIcon />, hoverAccent: 'pink' },
];

export default function Footer({
  logoText = 'Lucky Strike',
  primaryLinks = defaultPrimaryLinks,
  legalLinks = defaultLegalLinks,
  whatsappHref = 'https://wa.me/000000000000',
  phone = '+1 000 000 0000',
  email = 'support@luckystrike.com',
  socialLinks = defaultSocialLinks,
  copyrightText,
}: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-paper border-t-3 border-ink">
      <div className="max-w-[1180px] mx-auto px-6 md:px-8 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-6">
          {/* Logo */}
          <div className="lg:col-span-3">
            <div className="font-display text-2xl uppercase leading-none">
              Lucky<span className="text-pink">Strike</span>
            </div>
            <p className="mt-3 text-sm text-ink/60 font-medium max-w-[220px]">
              {logoText} — real draws, real winners, every week.
            </p>
          </div>

          {/* Primary links */}
          <nav className="lg:col-span-2" aria-label="Footer navigation">
            <ul className="space-y-3">
              {primaryLinks.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="font-bold text-sm hover:text-pink transition-colors duration-fast">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Legal links */}
          <nav className="lg:col-span-3" aria-label="Legal links">
            <ul className="space-y-3">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="font-bold text-sm hover:text-pink transition-colors duration-fast">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contact block */}
          <div className="lg:col-span-4 flex flex-col gap-3">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="stamped bg-red text-white flex items-center justify-between px-5 py-4 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-pressed transition-all duration-fast"
            >
              <span className="font-bold text-sm leading-tight">
                Have questions?
                <br />
                Chat with us
              </span>
              <WhatsAppIcon />
            </a>

            <div className="stamped bg-warm px-5 py-4">
              <p className="text-xs font-bold text-ink/60 uppercase tracking-wide">Call us</p>
              <a href={`tel:${phone.replace(/\s/g, '')}`} className="font-bold text-sm hover:text-pink transition-colors duration-fast">
                {phone}
              </a>
            </div>

            <div className="stamped bg-warm px-5 py-4">
              <p className="text-xs font-bold text-ink/60 uppercase tracking-wide">Email us</p>
              <a href={`mailto:${email}`} className="font-bold text-sm hover:text-pink transition-colors duration-fast break-all">
                {email}
              </a>
            </div>
          </div>
        </div>

        {/* Social row */}
        <div className="mt-12 pt-8 border-t-2 border-ink/10 flex flex-wrap gap-3">
          {socialLinks.map((social) => (
            <a
              key={social.label}
              href={social.href}
              aria-label={social.label}
              target="_blank"
              rel="noopener noreferrer"
              className={`stamped w-11 h-11 rounded-full bg-paper flex items-center justify-center transition-all duration-fast hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-pressed ${socialHoverClasses[social.hoverAccent ?? 'pink']}`}
            >
              {social.icon}
            </a>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-8 text-sm font-medium text-ink/50">
          {copyrightText ?? `Lucky Strike © ${year} - All Rights Reserved.`}
        </div>
      </div>
    </footer>
  );
}
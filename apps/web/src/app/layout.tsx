import type { Metadata } from "next";
import Link from "next/link";
import {
  Geist,
  Geist_Mono,
} from "next/font/google";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Distillogic CRM",
  description:
    "Recruitment CRM for candidates, jobs, applications and candidate matching.",
};

const navigation = [
  {
    href: "/",
    label: "Dashboard",
    icon: "⌂",
  },
  {
    href: "/candidates",
    label: "Υποψήφιοι",
    icon: "◎",
  },
  {
    href: "/applications",
    label: "Αιτήσεις",
    icon: "▣",
  },
  {
    href: "/jobs",
    label: "Θέσεις εργασίας",
    icon: "◇",
  },
  {
    href: "/upload",
    label: "CV Inbox",
    icon: "⇧",
  },
];

const secondaryNavigation = [
  {
    href: "/integrations",
    label: "Integrations",
    icon: "⚡",
  },
  {
    href: "/settings",
    label: "Ρυθμίσεις",
    icon: "⚙",
  },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="el"
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body>
        <div className="crm-shell">
          <aside className="crm-sidebar">
            <div className="crm-brand">
              <div className="crm-brand-mark">
                D
              </div>

              <div className="crm-brand-copy">
                <div className="crm-brand-name">
                  Distillogic
                </div>

                <div className="crm-brand-subtitle">
                  CV CRM
                </div>
              </div>
            </div>

            <nav
              className="crm-nav"
              aria-label="Κύριο μενού"
            >
              <div className="crm-nav-section-label">
                WORKSPACE
              </div>

              {navigation.map(
                (item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="crm-nav-link"
                  >
                    <span
                      className="crm-nav-icon"
                      aria-hidden="true"
                    >
                      {item.icon}
                    </span>

                    <span>
                      {item.label}
                    </span>
                  </Link>
                )
              )}

              <div className="crm-nav-section-label crm-nav-section-spacing">
                SYSTEM
              </div>

              {secondaryNavigation.map(
                (item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="crm-nav-link"
                  >
                    <span
                      className="crm-nav-icon"
                      aria-hidden="true"
                    >
                      {item.icon}
                    </span>

                    <span>
                      {item.label}
                    </span>
                  </Link>
                )
              )}
            </nav>

            <div className="crm-sidebar-footer">
              <div className="crm-system-status">
                <span className="crm-status-dot" />

                <div>
                  <div className="crm-system-status-title">
                    CRM Online
                  </div>

                  <div className="crm-system-status-copy">
                    Local environment
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <div className="crm-main">
            <header className="crm-topbar">
              <div className="crm-topbar-left">
                <div className="crm-mobile-brand">
                  Distillogic CRM
                </div>

                <div className="crm-search">
                  <span
                    className="crm-search-icon"
                    aria-hidden="true"
                  >
                    ⌕
                  </span>

                  <input
                    type="search"
                    placeholder="Αναζήτηση υποψηφίων, θέσεων..."
                    aria-label="Αναζήτηση"
                  />
                </div>
              </div>

              <div className="crm-topbar-actions">
                <Link
                  href="/upload"
                  className="crm-quick-action"
                >
                  + Νέο CV
                </Link>

                <div className="crm-user">
                  <div className="crm-user-avatar">
                    D
                  </div>

                  <div className="crm-user-copy">
                    <div className="crm-user-name">
                      Distillogic
                    </div>

                    <div className="crm-user-role">
                      Administrator
                    </div>
                  </div>
                </div>
              </div>
            </header>

            <main className="crm-content">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
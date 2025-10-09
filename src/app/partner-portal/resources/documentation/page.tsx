import Link from "next/link";
import { BookOpen, Code, Layers, Shield } from "lucide-react";

const documentationSections = [
  {
    title: "Getting Started",
    icon: Layers,
    links: [
      { label: "Installation Guide", href: "#" },
      { label: "First Steps", href: "#" },
      { label: "Basic Configuration", href: "#" },
      { label: "Quick Start Tutorial", href: "#" },
    ],
  },
  {
    title: "API Reference",
    icon: Code,
    links: [
      { label: "Authentication", href: "#" },
      { label: "Endpoints", href: "#" },
      { label: "Webhooks", href: "#" },
      { label: "Rate Limits", href: "#" },
    ],
  },
  {
    title: "Administration",
    icon: Shield,
    links: [
      { label: "User Management", href: "#" },
      { label: "Reporting Tools", href: "#" },
      { label: "Analytics", href: "#" },
      { label: "Governance", href: "#" },
    ],
  },
  {
    title: "Tutorials",
    icon: BookOpen,
    links: [
      { label: "Building Your First App", href: "#" },
      { label: "Advanced Workflows", href: "#" },
      { label: "Best Practices", href: "#" },
      { label: "Optimization Tips", href: "#" },
    ],
  },
];

export default function DocumentationPage() {
  return (
    <div className="bg-slate-50 text-slate-900">
      <section className="border-b border-slate-200 bg-white/80 px-4 py-10">
        <div className="mx-auto max-w-5xl">
          <nav className="text-sm text-slate-500">
            <Link
              href="/partner-portal"
              className="font-medium text-slate-600 transition hover:text-slate-900"
            >
              Home
            </Link>
            <span className="mx-2 text-slate-400">/</span>
            <Link
              href="/partner-portal/resources/documentation"
              className="font-medium text-slate-600 transition hover:text-slate-900"
            >
              Resources
            </Link>
            <span className="mx-2 text-slate-400">/</span>
            <span className="font-medium text-slate-900">Documentation</span>
          </nav>
          <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-slate-900 md:text-4xl">
                Documentation
              </h1>
              <p className="mt-3 max-w-xl text-sm text-slate-600 md:text-base">
                Discover comprehensive references, implementation guides, and
                best practices curated for partners.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-12">
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
          {documentationSections.map((section) => (
            <div
              key={section.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900/10 text-slate-900">
                <section.icon className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-xl font-semibold text-slate-900">
                {section.title}
              </h2>
              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="transition hover:text-slate-900"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

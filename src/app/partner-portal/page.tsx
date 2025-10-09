import Link from "next/link";
import {
  Award,
  BookOpen,
  Code,
  FileText,
  GraduationCap,
  Users,
  Video,
} from "lucide-react";

const highlights = [
  {
    icon: BookOpen,
    title: "Interactive courses",
    description: "Hands-on lessons that cover every aspect of the platform.",
  },
  {
    icon: FileText,
    title: "Practical documentation",
    description: "Step-by-step guides and references for daily operations.",
  },
  {
    icon: Video,
    title: "Video library",
    description: "Expert-led walkthroughs with real implementation examples.",
  },
  {
    icon: Award,
    title: "Certification program",
    description: "Validate your knowledge and unlock exclusive partner benefits.",
  },
];

const stats = [
  { value: "500+", label: "Certified Partners" },
  { value: "50+", label: "Training Modules" },
  { value: "95%", label: "Success Rate" },
  { value: "24/7", label: "Support Access" },
];

const learningCards = [
  {
    icon: BookOpen,
    title: "Fundamentals",
    description: "Get started with platform basics.",
    bullets: [
      "Account setup & onboarding",
      "Core features & navigation",
      "Best practices",
    ],
    href: "/partner-portal/learning/fundamentals",
    action: "Start Course",
  },
  {
    icon: Code,
    title: "Advanced Integration",
    description: "Connect, automate, and extend the platform.",
    bullets: [
      "Custom workflows & automation",
      "API integration & webhooks",
      "Performance optimization",
    ],
    href: "/partner-portal/learning/advanced",
    action: "Start Course",
  },
  {
    icon: Users,
    title: "Sales & Solutions",
    description: "Deliver compelling solutions that resonate.",
    bullets: [
      "Solution design fundamentals",
      "Demo delivery & storytelling",
      "Pricing & packaging",
    ],
    href: "/partner-portal/learning/sales",
    action: "Start Course",
  },
];

const resourceCards = [
  {
    icon: FileText,
    title: "Documentation",
    description: ["API Reference", "Admin Guide", "Best Practices"],
    href: "/partner-portal/resources/documentation",
    action: "View Docs",
  },
  {
    icon: Video,
    title: "Video Library",
    description: ["Step-by-step video walkthroughs"],
    href: "#",
    action: "Watch Videos",
  },
  {
    icon: BookOpen,
    title: "Case Studies",
    description: [
      "Real-world success stories from top performing partners.",
    ],
    href: "#",
    action: "Read Stories",
  },
  {
    icon: Users,
    title: "Community",
    description: ["Connect with other partners and experts."],
    href: "#",
    action: "Join Community",
  },
];

const footerColumns = [
  {
    title: "Programs",
    items: ["Learning Paths", "Certification", "Partner Tiers", "Workshops"],
  },
  {
    title: "Resources",
    items: ["Documentation", "API Status", "Release Notes", "Roadmap"],
  },
  {
    title: "Support",
    items: ["Help Center", "Contact Support", "System Status", "Report Issue"],
  },
  {
    title: "Company",
    items: ["About", "Careers", "Partner Program", "Press"],
  },
];

export default function PartnerPortalHome() {
  return (
    <div className="bg-slate-50 text-slate-900">
      <section className="bg-gradient-to-b from-white via-white to-slate-50 px-4 py-20">
        <div className="mx-auto max-w-5xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
            <GraduationCap className="h-4 w-4 text-slate-500" />
            Partner Education Hub
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
            Master our platform.
            <br />
            Grow your business.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-slate-600">
            Comprehensive training, resources, and certification programs
            designed to help partners succeed with our SaaS platform.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/partner-portal/learning/fundamentals"
              className="w-full rounded-md bg-slate-900 px-6 py-3 text-center text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 sm:w-auto"
            >
              Explore Learning Paths
            </Link>
            <Link
              href="/partner-portal/certification"
              className="w-full rounded-md border border-slate-200 px-6 py-3 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-100 sm:w-auto"
            >
              View Certification
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 pb-16">
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-4">
          {highlights.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900/10 text-slate-900">
                <item.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-900">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white/70 px-4 py-14">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 text-center md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label}>
              <div className="text-3xl font-semibold text-slate-900">
                {stat.value}
              </div>
              <div className="mt-2 text-sm font-medium uppercase tracking-wide text-slate-500">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col items-start justify-between gap-4 pb-8 md:flex-row md:items-center">
            <div>
              <h2 className="text-3xl font-semibold text-slate-900">
                Learning Paths
              </h2>
              <p className="mt-2 text-slate-600">
                Structured training to help every partner grow with confidence.
              </p>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {learningCards.map((card) => (
              <div
                key={card.title}
                className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900/10 text-slate-900">
                  <card.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-slate-900">
                  {card.title}
                </h3>
                <p className="mt-2 text-sm text-slate-600">{card.description}</p>
                <ul className="mt-4 space-y-2 text-sm text-slate-600">
                  {card.bullets.map((item) => (
                    <li key={item} className="leading-6">
                      • {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href={card.href}
                  className="mt-6 inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                >
                  {card.action}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-16">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col gap-4 pb-8 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-3xl font-semibold text-slate-900">
                Resources
              </h2>
              <p className="mt-2 text-slate-600">
                Everything you need to design, implement, and support solutions.
              </p>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {resourceCards.map((resource) => (
              <div
                key={resource.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900/10 text-slate-900">
                  <resource.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-slate-900">
                  {resource.title}
                </h3>
                <ul className="mt-3 space-y-2 text-sm text-slate-600">
                  {resource.description.map((line) => (
                    <li key={line} className="leading-6">
                      • {line}
                    </li>
                  ))}
                </ul>
                <Link
                  href={resource.href}
                  className="mt-6 inline-flex items-center rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  {resource.action}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-16">
        <div className="mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition hover:shadow-xl">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-900/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-900">
                <Award className="h-4 w-4" />
                Partner Certified
              </span>
              <h3 className="mt-4 text-2xl font-semibold text-slate-900">
                SaaSPlatform Expert
              </h3>
              <p className="mt-2 text-slate-600">
                Earn recognition for your expertise and unlock premium partner
                benefits.
              </p>
            </div>
            <Link
              href="/partner-portal/certification"
              className="inline-flex items-center rounded-md bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              View Certification Path
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-slate-900 px-4 py-16 text-slate-50">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="text-3xl font-semibold text-white md:text-4xl">
            Ready to get started?
          </h2>
          <p className="mt-3 text-base text-slate-200">
            Join hundreds of successful partners accelerating their growth with
            our platform.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="#"
              className="w-full rounded-md bg-white px-6 py-3 text-center text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-100 sm:w-auto"
            >
              Create Partner Account
            </Link>
            <Link
              href="#"
              className="w-full rounded-md border border-white/40 px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/10 sm:w-auto"
            >
              Contact Partner Team
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white px-4 py-12">
        <div className="mx-auto grid max-w-5xl gap-10 text-sm md:grid-cols-4">
          {footerColumns.map((column) => (
            <div key={column.title}>
              <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                {column.title}
              </h4>
              <ul className="mt-4 space-y-2 text-slate-600">
                {column.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mx-auto mt-10 max-w-5xl border-t border-slate-200 pt-6 text-sm text-slate-500">
          © 2025 SaaSPlatform.
        </div>
      </footer>
    </div>
  );
}

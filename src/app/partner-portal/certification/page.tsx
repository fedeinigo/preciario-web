import Link from "next/link";
import { Award, CheckCircle2, Sparkles, Star } from "lucide-react";

const levels = [
  {
    title: "Associate Partner",
    icon: Star,
    description: [
      "Complete Fundamentals course",
      "Pass certification exam (70% required)",
      "Valid for 1 year",
    ],
    href: "/partner-portal/learning/fundamentals",
  },
  {
    title: "Professional Partner",
    icon: Sparkles,
    description: [
      "Complete Fundamentals & Advanced paths",
      "Submit client case study",
      "Valid for 2 years",
    ],
    href: "/partner-portal/learning/advanced",
  },
  {
    title: "Expert Partner",
    icon: Award,
    description: [
      "Achieve Professional Partner certification",
      "Complete all learning paths",
      "Submit capstone project",
      "Valid for 3 years",
    ],
    href: "/partner-portal/learning/sales",
  },
];

const benefits = [
  "Official Badge & Credentials",
  "Priority Support",
  "Marketplace Profile",
  "Revenue Incentives",
];

export default function CertificationPage() {
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
            <span className="font-medium text-slate-900">Certification</span>
          </nav>
          <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg">
              <Award className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-slate-900 md:text-4xl">
                Partner Certification
              </h1>
              <p className="mt-3 max-w-xl text-sm text-slate-600 md:text-base">
                Credential program for partners who lead transformative customer
                outcomes on the SaaSPlatform ecosystem.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-12">
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
          {levels.map((level) => (
            <div
              key={level.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900/10 text-slate-900">
                <level.icon className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-xl font-semibold text-slate-900">
                {level.title}
              </h2>
              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                {level.description.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
              <Link
                href={level.href}
                className="mt-6 inline-flex items-center rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                View Requirements
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 pb-12">
        <div className="mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-900">
            Certification Benefits
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {benefits.map((benefit) => (
              <div
                key={benefit}
                className="flex items-center gap-3 rounded-xl bg-slate-900/5 px-4 py-3 text-sm font-medium text-slate-700"
              >
                <CheckCircle2 className="h-5 w-5 text-slate-900" />
                {benefit}
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/partner-portal"
              className="inline-flex items-center justify-center rounded-md border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Back to Home
            </Link>
            <Link
              href="#"
              className="inline-flex items-center justify-center rounded-md bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Start Certification
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

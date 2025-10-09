import Link from "next/link";
import { CheckCircle2, Clock, Megaphone, Users } from "lucide-react";

const modules = [
  {
    title: "Partner Value Proposition",
    duration: "25 min",
    lessons: 3,
  },
  {
    title: "Discovery & Needs Analysis",
    duration: "30 min",
    lessons: 4,
  },
  {
    title: "Solution Design Workshop",
    duration: "35 min",
    lessons: 4,
  },
  {
    title: "Demo Delivery & Storytelling",
    duration: "30 min",
    lessons: 3,
  },
  {
    title: "Proposal Strategy & Packaging",
    duration: "35 min",
    lessons: 4,
  },
  {
    title: "Objection Handling & Negotiation",
    duration: "30 min",
    lessons: 3,
  },
  {
    title: "Implementation Planning",
    duration: "25 min",
    lessons: 3,
  },
  {
    title: "Success Metrics & ROI",
    duration: "20 min",
    lessons: 2,
  },
];

export default function SalesLearningPath() {
  return (
    <div className="bg-slate-50 text-slate-900">
      <section className="border-b border-slate-200 bg-white/80 px-4 py-10">
        <div className="mx-auto flex max-w-5xl flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-6">
            <nav className="text-sm text-slate-500">
              <Link
                href="/partner-portal"
                className="font-medium text-slate-600 transition hover:text-slate-900"
              >
                Home
              </Link>
              <span className="mx-2 text-slate-400">/</span>
              <span className="font-medium text-slate-900">
                Sales &amp; Solutions
              </span>
            </nav>
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg">
                <Megaphone className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-semibold text-slate-900 md:text-4xl">
                  Sales &amp; Solutions
                </h1>
                <p className="mt-3 max-w-xl text-sm text-slate-600 md:text-base">
                  Equip go-to-market teams with frameworks, demos, and pricing
                  strategies to deliver winning partner stories.
                </p>
              </div>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="flex items-center gap-2 rounded-lg bg-slate-900/5 px-4 py-2 text-sm font-medium text-slate-700">
              <Clock className="h-4 w-4" />
              3 hours
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-slate-900/5 px-4 py-2 text-sm font-medium text-slate-700">
              <Users className="h-4 w-4" />
              8 modules
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-slate-900/5 px-4 py-2 text-sm font-medium text-slate-700">
              <CheckCircle2 className="h-4 w-4" />
              Intermediate level
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-12">
        <div className="mx-auto max-w-5xl space-y-8">
          <div className="grid gap-6 md:grid-cols-2">
            {modules.map((module, index) => (
              <div
                key={module.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl"
              >
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Module {index + 1}
                </div>
                <h2 className="mt-2 text-xl font-semibold text-slate-900">
                  {module.title}
                </h2>
                <p className="mt-3 text-sm text-slate-600">
                  {module.duration} • {module.lessons} lessons
                </p>
                <button
                  type="button"
                  className="mt-6 inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                >
                  Start
                </button>
              </div>
            ))}
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white px-6 py-8 text-center shadow-sm sm:px-10">
            <h3 className="text-2xl font-semibold text-slate-900">
              Drive outcomes with confidence.
            </h3>
            <p className="mt-2 text-sm text-slate-600 md:text-base">
              Launch the first lesson to align sales and solution teams around a
              repeatable playbook.
            </p>
            <button
              type="button"
              className="mt-5 inline-flex items-center rounded-md bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Start First Module
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

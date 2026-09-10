import Link from "next/link";

import CreateJobForm
  from "./CreateJobForm";

export default function NewJobPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <Link
          href="/jobs"
          className="mb-8 inline-block text-sm text-slate-400 transition hover:text-white"
        >
          ← Back to Jobs
        </Link>

        <header className="mb-10 border-b border-slate-800 pb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-blue-400">
            Melas Recruitment CRM
          </p>

          <h1 className="text-4xl font-bold">
            Create Job
          </h1>

          <p className="mt-3 text-slate-400">
            Create a new position and
            define the requirements used
            for candidate matching.
          </p>
        </header>

        <CreateJobForm />
      </div>
    </main>
  );
}
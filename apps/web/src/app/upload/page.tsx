import Link
  from "next/link";

import UploadResumeForm
  from "./UploadResumeForm";

export default function UploadPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">

      <div className="mx-auto max-w-4xl px-6 py-10">

        {/* Navigation */}

        <nav className="mb-10 flex flex-wrap gap-3 border-b border-slate-800 pb-6">

          <Link
            href="/jobs"
            className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-slate-300 hover:text-white"
          >
            Jobs
          </Link>

          <Link
            href="/candidates"
            className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-slate-300 hover:text-white"
          >
            Candidates
          </Link>

          <Link
            href="/upload"
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
          >
            + Add Candidate
          </Link>

        </nav>

        <header className="mb-10 border-b border-slate-800 pb-8">

          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-blue-400">
            Melas Recruitment CRM
          </p>

          <h1 className="text-4xl font-bold">
            Add Candidate
          </h1>

          <p className="mt-3 max-w-2xl text-slate-400">
            Create a candidate,
            upload their CV and
            automatically generate
            their professional profile
            and job matches.
          </p>

        </header>

        <UploadResumeForm />

      </div>

    </main>
  );
}
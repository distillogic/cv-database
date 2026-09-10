import Link from "next/link";

import {
  getJobs,
  type Job,
} from "@/lib/api";

function formatLevel(
  level: Job["target_level"]
) {
  switch (level) {
    case "junior":
      return "Junior";

    case "senior":
      return "Senior";

    case "expert":
      return "Expert";
  }
}

function formatStatus(
  status: string
) {
  switch (status) {
    case "open":
      return "Open";

    case "paused":
      return "Paused";

    case "closed":
      return "Closed";

    default:
      return status;
  }
}

export default async function JobsPage() {
  const jobs =
    await getJobs();

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-6 py-10">

        {/* Navigation */}

        <nav className="mb-10 flex flex-wrap items-center gap-3 border-b border-slate-800 pb-6">

          <Link
            href="/jobs"
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Jobs
          </Link>

          <Link
            href="/candidates"
            className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-700 hover:text-white"
          >
            Candidates
          </Link>

        </nav>

        {/* Header */}

        <header className="mb-10 border-b border-slate-800 pb-8">

          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">

            <div>

              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-blue-400">
                Melas Recruitment CRM
              </p>

              <h1 className="text-4xl font-bold">
                Jobs
              </h1>

              <p className="mt-3 text-slate-400">
                Manage jobs,
                requirements and
                candidate rankings.
              </p>

            </div>

            <div className="flex flex-col gap-3 sm:flex-row">

              <Link
                href="/jobs/new"
                className="flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                + Create Job
              </Link>

              <div className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-3">

                <p className="text-xs uppercase text-slate-500">
                  Total Jobs
                </p>

                <p className="mt-1 text-2xl font-bold">
                  {jobs.length}
                </p>

              </div>

            </div>

          </div>

        </header>

        {/* Jobs */}

        {jobs.length === 0 ? (

          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-12 text-center">

            <h2 className="text-xl font-semibold">
              No jobs yet
            </h2>

            <p className="mt-2 text-slate-400">
              Create your first job
              and define its requirements.
            </p>

            <Link
              href="/jobs/new"
              className="mt-6 inline-flex rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-500"
            >
              + Create Job
            </Link>

          </div>

        ) : (

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">

            {jobs.map((job) => (

              <article
                key={job.id}
                className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900 p-6 transition hover:border-slate-700"
              >

                {/* Job title */}

                <div className="mb-5 flex justify-between gap-4">

                  <div>

                    <p className="text-sm text-slate-500">
                      Job #{job.id}
                    </p>

                    <h2 className="mt-1 text-xl font-semibold">
                      {job.title}
                    </h2>

                  </div>

                  <span className="h-fit rounded-full border border-emerald-900 bg-emerald-950 px-3 py-1 text-xs font-semibold text-emerald-300">
                    {formatStatus(
                      job.status
                    )}
                  </span>

                </div>

                {/* Job information */}

                <div className="mb-6 space-y-3 text-sm">

                  <div className="flex justify-between gap-4 border-b border-slate-800 pb-3">

                    <span className="text-slate-500">
                      Department
                    </span>

                    <span className="text-right">
                      {job.department ??
                        "—"}
                    </span>

                  </div>

                  <div className="flex justify-between gap-4 border-b border-slate-800 pb-3">

                    <span className="text-slate-500">
                      Location
                    </span>

                    <span className="text-right">
                      {job.location ??
                        "—"}
                    </span>

                  </div>

                  <div className="flex justify-between gap-4 border-b border-slate-800 pb-3">

                    <span className="text-slate-500">
                      Target Level
                    </span>

                    <span className="font-semibold text-blue-300">
                      {formatLevel(
                        job.target_level
                      )}
                    </span>

                  </div>

                  <div className="flex justify-between gap-4">

                    <span className="text-slate-500">
                      Requirements
                    </span>

                    <span className="font-semibold">
                      {
                        job.requirements_count
                      }
                    </span>

                  </div>

                </div>

                {/* Description */}

                {job.description && (

                  <p className="mb-6 line-clamp-3 text-sm leading-6 text-slate-400">
                    {job.description}
                  </p>

                )}

                {/* Candidates */}

                <Link
                  href={`/jobs/${job.id}`}
                  className="mt-auto flex justify-center rounded-xl bg-blue-600 px-4 py-3 font-semibold transition hover:bg-blue-500"
                >
                  View Candidates
                </Link>

              </article>

            ))}

          </div>

        )}

      </div>
    </main>
  );
}
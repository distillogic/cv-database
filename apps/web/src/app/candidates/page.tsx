import Link from "next/link";

import {
  getCandidates,
} from "@/lib/api";

function formatCandidateStatus(
  status: string
) {
  if (!status) {
    return "Unknown";
  }

  return (
    status.charAt(0).toUpperCase() +
    status.slice(1)
  );
}

export default async function CandidatesPage() {
  const candidates =
    await getCandidates();

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-6 py-10">

        {/* Navigation */}

        <nav className="mb-10 flex flex-wrap items-center gap-3 border-b border-slate-800 pb-6">
          <Link
            href="/jobs"
            className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-700 hover:text-white"
          >
            Jobs
          </Link>

          <Link
            href="/candidates"
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Candidates
          </Link>
        </nav>

        {/* Header */}

        <header className="mb-10 flex flex-col gap-5 border-b border-slate-800 pb-8 sm:flex-row sm:items-end sm:justify-between">

          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-blue-400">
              Melas Recruitment CRM
            </p>

            <h1 className="text-4xl font-bold">
              Candidates
            </h1>

            <p className="mt-3 text-slate-400">
              Review candidate profiles
              generated from validated CV
              information.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-3">

            <p className="text-xs uppercase tracking-wide text-slate-500">
              Total Candidates
            </p>

            <p className="mt-1 text-2xl font-bold">
              {candidates.length}
            </p>

          </div>

        </header>

        {/* Candidates */}

        {candidates.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-12 text-center">

            <h2 className="text-xl font-semibold">
              No candidates yet
            </h2>

            <p className="mt-2 text-slate-400">
              Candidates will appear
              here after they are added
              to the CRM.
            </p>

          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">

            {candidates.map(
              (candidate) => (
                <article
                  key={candidate.id}
                  className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900 p-6 transition hover:border-slate-700"
                >

                  <div className="mb-6 flex items-start gap-4">

                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-lg font-bold">
                      {candidate.first_name
                        ?.charAt(0)
                        .toUpperCase()}

                      {candidate.last_name
                        ?.charAt(0)
                        .toUpperCase()}
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">
                        Candidate #
                        {candidate.id}
                      </p>

                      <h2 className="mt-1 text-xl font-semibold">
                        {candidate.first_name}{" "}
                        {candidate.last_name}
                      </h2>
                    </div>

                  </div>

                  <div className="mb-6 space-y-3 text-sm">

                    <div className="flex justify-between gap-4 border-b border-slate-800 pb-3">
                      <span className="text-slate-500">
                        Status
                      </span>

                      <span className="font-medium">
                        {formatCandidateStatus(
                          candidate.status
                        )}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4 border-b border-slate-800 pb-3">
                      <span className="text-slate-500">
                        Source
                      </span>

                      <span className="text-right">
                        {candidate.source ??
                          "—"}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-slate-500">
                        Location
                      </span>

                      <span className="text-right">
                        {candidate.location ??
                          "—"}
                      </span>
                    </div>

                  </div>

                  <Link
                    href={`/candidates/${candidate.id}`}
                    className="mt-auto flex justify-center rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-500"
                  >
                    View Profile
                  </Link>

                </article>
              )
            )}

          </div>
        )}

      </div>
    </main>
  );
}
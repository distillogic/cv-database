import Link from "next/link";

import {
  getJobRanking,
  type JobLevel,
} from "@/lib/api";

import RecalculateCandidatesButton
  from "./RecalculateCandidatesButton";

function formatLevel(
  level: JobLevel | null
) {
  if (!level) {
    return "Unknown";
  }

  switch (level) {
    case "junior":
      return "Junior";

    case "senior":
      return "Senior";

    case "expert":
      return "Expert";
  }
}

function scoreLabel(
  score: number
) {
  if (score >= 80) {
    return "Strong match";
  }

  if (score >= 60) {
    return "Good match";
  }

  if (score >= 40) {
    return "Partial match";
  }

  return "Low match";
}

export default async function JobRankingPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } =
    await params;

  const data =
    await getJobRanking(id);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-6 py-10">

        {/* Back */}

        <Link
          href="/jobs"
          className="mb-8 inline-flex text-sm font-medium text-slate-400 transition hover:text-white"
        >
          ← Back to Jobs
        </Link>

        {/* Header */}

        <header className="mb-10 border-b border-slate-800 pb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-blue-400">
            Candidate Ranking
          </p>

          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">

            <div>
              <h1 className="text-4xl font-bold tracking-tight">
                {data.job.title}
              </h1>

              <p className="mt-3 text-slate-400">
                Candidates ranked using
                documented job-related
                requirements.
              </p>
            </div>

            <div className="flex flex-wrap items-start gap-3">

              <RecalculateCandidatesButton
                jobId={id}
              />

              <div className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Target Level
                </p>

                <p className="mt-1 font-semibold text-blue-300">
                  {formatLevel(
                    data.job.targetLevel
                  )}
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Candidates
                </p>

                <p className="mt-1 text-xl font-bold">
                  {data.ranking.length}
                </p>
              </div>

            </div>
          </div>
        </header>

        {/* Empty */}

        {data.ranking.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-12 text-center">

            <h2 className="text-xl font-semibold">
              No scored candidates yet
            </h2>

            <p className="mt-2 text-slate-400">
              Press Recalculate Candidates
              to generate the ranking
              for this job.
            </p>

          </div>
        ) : (

          <div className="space-y-6">

            {data.ranking.map(
              (candidate) => {

                const required =
                  candidate
                    .score_breakdown
                    .requirements
                    .filter(
                      (item) =>
                        item.importance ===
                        "required"
                    );

                const preferred =
                  candidate
                    .score_breakdown
                    .requirements
                    .filter(
                      (item) =>
                        item.importance ===
                        "preferred"
                    );

                return (
                  <article
                    key={candidate.id}
                    className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900"
                  >

                    {/* Candidate top row */}

                    <div className="flex flex-col gap-5 border-b border-slate-800 p-6 lg:flex-row lg:items-center lg:justify-between">

                      <div className="flex items-center gap-5">

                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-800 text-xl font-bold">
                          #{candidate.rank}
                        </div>

                        <div>

                          <p className="text-sm text-slate-500">
                            Candidate #
                            {candidate.candidate_id}
                          </p>

                          <h2 className="text-2xl font-semibold">
                            {candidate.first_name}{" "}
                            {candidate.last_name}
                          </h2>

                          <p className="mt-1 text-sm text-slate-400">
                            Estimated level:{" "}
                            <span className="font-medium text-slate-200">
                              {formatLevel(
                                candidate.estimated_level
                              )}
                            </span>
                          </p>

                        </div>

                      </div>

                      <div className="text-right">

                        <p className="text-sm text-slate-500">
                          Overall Match
                        </p>

                        <p className="text-4xl font-bold text-blue-400">
                          {candidate.overall_score}%
                        </p>

                        <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          {scoreLabel(
                            candidate.overall_score
                          )}
                        </p>

                      </div>

                    </div>

                    {/* Score boxes */}

                    <div className="grid gap-px bg-slate-800 sm:grid-cols-4">

                      <div className="bg-slate-900 p-5">
                        <p className="text-xs uppercase text-slate-500">
                          Requirements
                        </p>

                        <p className="mt-1 text-xl font-semibold">
                          {candidate.requirements_score}%
                        </p>
                      </div>

                      <div className="bg-slate-900 p-5">
                        <p className="text-xs uppercase text-slate-500">
                          Seniority
                        </p>

                        <p className="mt-1 text-xl font-semibold">
                          {candidate.seniority_score}%
                        </p>
                      </div>

                      <div className="bg-slate-900 p-5">
                        <p className="text-xs uppercase text-slate-500">
                          Required
                        </p>

                        <p className="mt-1 text-xl font-semibold">
                          {candidate.matched_required_count}
                          /
                          {candidate.total_required_count}
                        </p>
                      </div>

                      <div className="bg-slate-900 p-5">
                        <p className="text-xs uppercase text-slate-500">
                          Preferred
                        </p>

                        <p className="mt-1 text-xl font-semibold">
                          {candidate.matched_preferred_count}
                          /
                          {candidate.total_preferred_count}
                        </p>
                      </div>

                    </div>

                    {/* Requirements */}

                    <div className="grid gap-8 p-6 lg:grid-cols-2">

                      {/* Required */}

                      <section>

                        <h3 className="mb-4 font-semibold">
                          Required Requirements
                        </h3>

                        {required.length === 0 ? (
                          <p className="text-sm text-slate-500">
                            No required requirements.
                          </p>
                        ) : (
                          <div className="space-y-3">

                            {required.map(
                              (requirement) => (
                                <div
                                  key={
                                    requirement.requirementId
                                  }
                                  className="rounded-xl border border-slate-800 bg-slate-950 p-4"
                                >

                                  <div className="flex items-center justify-between gap-4">

                                    <span className="font-medium">
                                      {requirement.name}
                                    </span>

                                    <span>
                                      {requirement.matched
                                        ? "✅"
                                        : "❌"}
                                    </span>

                                  </div>

                                  {requirement.matchedValue && (
                                    <p className="mt-2 text-sm text-slate-400">
                                      Found:{" "}
                                      {
                                        requirement.matchedValue
                                      }
                                    </p>
                                  )}

                                </div>
                              )
                            )}

                          </div>
                        )}

                      </section>

                      {/* Preferred */}

                      <section>

                        <h3 className="mb-4 font-semibold">
                          Preferred Requirements
                        </h3>

                        {preferred.length === 0 ? (
                          <p className="text-sm text-slate-500">
                            No preferred requirements.
                          </p>
                        ) : (
                          <div className="space-y-3">

                            {preferred.map(
                              (requirement) => (
                                <div
                                  key={
                                    requirement.requirementId
                                  }
                                  className="rounded-xl border border-slate-800 bg-slate-950 p-4"
                                >

                                  <div className="flex items-center justify-between gap-4">

                                    <span className="font-medium">
                                      {requirement.name}
                                    </span>

                                    <span>
                                      {requirement.matched
                                        ? "✅"
                                        : "❌"}
                                    </span>

                                  </div>

                                  {requirement.matchedValue && (
                                    <p className="mt-2 text-sm text-slate-400">
                                      Found:{" "}
                                      {
                                        requirement.matchedValue
                                      }
                                    </p>
                                  )}

                                </div>
                              )
                            )}

                          </div>
                        )}

                      </section>

                    </div>

                    {/* Footer */}

                    <div className="border-t border-slate-800 px-6 py-4 text-xs text-slate-500">
                      Score version:{" "}
                      {candidate.scoring_version}
                      {" · "}
                      Recruiter review status:{" "}
                      {candidate.review_status}
                    </div>

                  </article>
                );
              }
            )}

          </div>
        )}

        <p className="mt-10 text-xs leading-5 text-slate-600">
          Candidate rankings are
          decision-support information
          based on documented professional
          criteria for this specific job.
          Final hiring decisions remain
          with the recruiter.
        </p>

      </div>
    </main>
  );
}
import Link from "next/link";

const API_BASE_URL =
  process.env.API_BASE_URL ??
  "http://localhost:4000";

type RequirementMatch = {
  requirementId:
    string;

  name:
    string;

  type:
    string;

  importance:
    "required" | "preferred";

  weight:
    number;

  matched:
    boolean;

  matchedValue:
    string | null;

  minimumLevel:
    string | null;

  minimumYears:
    number | null;

  pointsAwarded:
    number;

  pointsPossible:
    number;

  reason:
    string;

  evidence:
    string[];
};

type SeniorityBreakdown = {
  rule:
    string;

  score:
    number;

  evidence:
    string[];

  targetLevel:
    string;

  relevantYears:
    number;

  estimatedLevel:
    string;
};

type ScoreBreakdown = {
  formula?: {
    seniorityWeight?:
      number;

    requirementsWeight?:
      number;
  };

  seniority?:
    SeniorityBreakdown;

  requirements?:
    RequirementMatch[];
};

type CandidateJobMatch = {
  scoreId:
    string;

  candidateId:
    string;

  jobId:
    string;

  job: {
    id:
      string;

    title:
      string;

    department:
      string | null;

    location:
      string | null;

    status:
      string | null;
  };

  targetLevel:
    string;

  estimatedLevel:
    string | null;

  overallScore:
    number;

  requirementsScore:
    number;

  seniorityScore:
    number;

  matchedRequiredCount:
    number;

  totalRequiredCount:
    number;

  matchedPreferredCount:
    number;

  totalPreferredCount:
    number;

  scoreBreakdown:
    ScoreBreakdown | null;

  scoringVersion:
    string | null;

  reviewStatus:
    string | null;

  scoredAt:
    string;
};

type JobMatchesResponse = {
  data?: {
    candidateId?:
      string;

    matches?:
      CandidateJobMatch[];
  };
};

function formatScore(
  value: number
) {
  const rounded =
    Math.round(
      value * 100
    ) / 100;

  return `${rounded}%`;
}

function formatDate(
  value:
    string | null
) {
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "el-GR",
    {
      day:
        "2-digit",

      month:
        "2-digit",

      year:
        "numeric",

      hour:
        "2-digit",

      minute:
        "2-digit",
    }
  ).format(date);
}

function levelLabel(
  value:
    string | null
) {
  if (!value) {
    return "—";
  }

  switch (
    value.toLowerCase()
  ) {
    case "junior":
      return "Junior";

    case "senior":
      return "Senior";

    case "expert":
      return "Expert";

    default:
      return value;
  }
}

function requirementTypeLabel(
  type: string
) {
  switch (
    type.toLowerCase()
  ) {
    case "skill":
      return "Skill";

    case "language":
      return "Γλώσσα";

    case "education":
      return "Εκπαίδευση";

    case "experience":
      return "Εμπειρία";

    case "certification":
      return "Πιστοποίηση";

    case "training":
      return "Training";

    case "driving_license":
      return "Άδεια οδήγησης";

    default:
      return type;
  }
}

function reasonLabel(
  reason: string
) {
  switch (
    reason
  ) {
    case "exact_skill_match":
      return "Ακριβής αντιστοίχιση skill";

    case "skill_not_found":
      return "Δεν βρέθηκε skill";

    case "language_match":
      return "Αντιστοίχιση γλώσσας";

    case "education_match":
      return "Αντιστοίχιση εκπαίδευσης";

    default:
      return reason
        .replaceAll(
          "_",
          " "
        );
  }
}

function progressWidth(
  score: number
) {
  return `${Math.max(
    0,
    Math.min(
      100,
      score
    )
  )}%`;
}

async function getJobMatches(
  candidateId:
    string
): Promise<{
  available:
    boolean;

  matches:
    CandidateJobMatch[];
}> {
  try {
    const response =
      await fetch(
        `${API_BASE_URL}/api/candidates/${candidateId}/job-matches`,
        {
          cache:
            "no-store",
        }
      );

    if (
      !response.ok
    ) {
      return {
        available:
          false,

        matches:
          [],
      };
    }

    const result =
      await response.json() as
        JobMatchesResponse;

    return {
      available:
        true,

      matches:
        result.data
          ?.matches ??
        [],
    };
  } catch {
    return {
      available:
        false,

      matches:
        [],
    };
  }
}

export default async function CandidateJobMatches({
  candidateId,
}: {
  candidateId:
    string;
}) {
  const result =
    await getJobMatches(
      candidateId
    );

  return (
    <section className="crm-card mb-5">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-bold text-slate-800">
              Job Matching
            </h2>

            {result.available ? (
              <span className="crm-badge">
                {
                  result.matches
                    .length
                }{" "}
                θέσεις
              </span>
            ) : null}
          </div>

          <p className="mt-1 text-[11px] text-slate-500">
            Αναλυτικά
            job-specific scores
            με βάση τα
            τεκμηριωμένα
            επαγγελματικά
            στοιχεία του CV.
          </p>
        </div>

        <Link
          href="/jobs"
          className="text-xs font-semibold text-blue-600 transition hover:text-blue-800"
        >
          Προβολή θέσεων →
        </Link>
      </div>

      {!result.available ? (
        <div className="p-5">
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-xs text-amber-800">
            Δεν ήταν δυνατή η
            ανάκτηση των Job
            Matching δεδομένων.
            Έλεγξε ότι το
            backend λειτουργεί.
          </div>
        </div>
      ) : result.matches.length ===
        0 ? (
        <div className="crm-empty">
          <div>
            <div className="crm-empty-title">
              Δεν υπάρχουν
              ακόμη scores
            </div>

            <div className="crm-empty-copy">
              Ο υποψήφιος δεν
              έχει ακόμη
              αξιολογηθεί για
              κάποια θέση.
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 p-5">
          {result.matches.map(
            (
              match
            ) => {
              const requirements =
                match
                  .scoreBreakdown
                  ?.requirements ??
                [];

              const seniority =
                match
                  .scoreBreakdown
                  ?.seniority;

              const formula =
                match
                  .scoreBreakdown
                  ?.formula;

              return (
                <article
                  key={
                    match.scoreId
                  }
                  className="overflow-hidden rounded-xl border border-slate-200 bg-white"
                >
                  {/* JOB HEADER */}

                  <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/jobs/${match.jobId}`}
                          className="text-base font-bold text-slate-900 transition hover:text-blue-600"
                        >
                          {
                            match
                              .job
                              .title
                          }
                        </Link>

                        <span className="crm-badge">
                          Job #
                          {
                            match.jobId
                          }
                        </span>

                        {match
                          .job
                          .status ? (
                          <span className="crm-badge crm-badge-success">
                            {
                              match
                                .job
                                .status
                            }
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-500">
                        {match
                          .job
                          .department ? (
                          <span>
                            {
                              match
                                .job
                                .department
                            }
                          </span>
                        ) : null}

                        {match
                          .job
                          .location ? (
                          <span>
                            {
                              match
                                .job
                                .location
                            }
                          </span>
                        ) : null}

                        <span>
                          Target:{" "}
                          <strong className="text-slate-700">
                            {levelLabel(
                              match.targetLevel
                            )}
                          </strong>
                        </span>

                        <span>
                          Estimated:{" "}
                          <strong className="text-slate-700">
                            {levelLabel(
                              match.estimatedLevel
                            )}
                          </strong>
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 text-left lg:text-right">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Overall Score
                      </div>

                      <div className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
                        {formatScore(
                          match.overallScore
                        )}
                      </div>

                      <div className="mt-1 text-[9px] text-slate-400">
                        {
                          match.scoringVersion ??
                          "—"
                        }
                      </div>
                    </div>
                  </div>

                  {/* SCORE CARDS */}

                  <div className="grid gap-3 border-b border-slate-100 bg-slate-50/70 p-4 sm:grid-cols-3">
                    <div className="rounded-lg border border-slate-200 bg-white p-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[10px] font-semibold text-slate-500">
                          Requirements
                        </span>

                        <strong className="text-sm text-slate-800">
                          {formatScore(
                            match.requirementsScore
                          )}
                        </strong>
                      </div>

                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-blue-600"
                          style={{
                            width:
                              progressWidth(
                                match.requirementsScore
                              ),
                          }}
                        />
                      </div>

                      <div className="mt-2 text-[9px] text-slate-400">
                        Weight:{" "}
                        {formula
                          ?.requirementsWeight !==
                        undefined
                          ? `${Math.round(
                              formula.requirementsWeight *
                                100
                            )}%`
                          : "—"}
                      </div>
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-white p-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[10px] font-semibold text-slate-500">
                          Seniority
                        </span>

                        <strong className="text-sm text-slate-800">
                          {formatScore(
                            match.seniorityScore
                          )}
                        </strong>
                      </div>

                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-slate-700"
                          style={{
                            width:
                              progressWidth(
                                match.seniorityScore
                              ),
                          }}
                        />
                      </div>

                      <div className="mt-2 text-[9px] text-slate-400">
                        Weight:{" "}
                        {formula
                          ?.seniorityWeight !==
                        undefined
                          ? `${Math.round(
                              formula.seniorityWeight *
                                100
                            )}%`
                          : "—"}
                      </div>
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-white p-3">
                      <div className="text-[10px] font-semibold text-slate-500">
                        Requirements matched
                      </div>

                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="crm-badge crm-badge-primary">
                          Required{" "}
                          {
                            match.matchedRequiredCount
                          }
                          /
                          {
                            match.totalRequiredCount
                          }
                        </span>

                        <span className="crm-badge">
                          Preferred{" "}
                          {
                            match.matchedPreferredCount
                          }
                          /
                          {
                            match.totalPreferredCount
                          }
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* REQUIREMENTS */}

                  <div className="p-5">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3 className="text-xs font-bold text-slate-800">
                          Requirements
                        </h3>

                        <p className="mt-1 text-[10px] text-slate-500">
                          Αντιστοίχιση
                          requirement-by-requirement
                          με evidence από
                          το validated
                          profile.
                        </p>
                      </div>

                      <span className="crm-badge">
                        {
                          requirements.length
                        }{" "}
                        criteria
                      </span>
                    </div>

                    {requirements.length ===
                    0 ? (
                      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
                        Δεν υπάρχουν
                        requirement
                        details.
                      </div>
                    ) : (
                      <div className="grid gap-2">
                        {requirements.map(
                          (
                            requirement
                          ) => (
                            <div
                              key={
                                requirement.requirementId
                              }
                              className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                            >
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="flex min-w-0 gap-3">
                                  <div
                                    className={
                                      requirement.matched
                                        ? "grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700"
                                        : "grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-200 text-xs font-bold text-slate-500"
                                    }
                                  >
                                    {requirement.matched
                                      ? "✓"
                                      : "—"}
                                  </div>

                                  <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="text-xs font-bold text-slate-800">
                                        {
                                          requirement.name
                                        }
                                      </span>

                                      <span
                                        className={
                                          requirement.importance ===
                                          "required"
                                            ? "crm-badge crm-badge-primary"
                                            : "crm-badge"
                                        }
                                      >
                                        {requirement.importance ===
                                        "required"
                                          ? "Required"
                                          : "Preferred"}
                                      </span>

                                      <span className="crm-badge">
                                        {requirementTypeLabel(
                                          requirement.type
                                        )}
                                      </span>
                                    </div>

                                    <div className="mt-2 text-[10px] text-slate-500">
                                      {reasonLabel(
                                        requirement.reason
                                      )}
                                    </div>

                                    {requirement.matchedValue ? (
                                      <div className="mt-1 text-[10px] text-slate-600">
                                        Matched value:{" "}
                                        <strong>
                                          {
                                            requirement.matchedValue
                                          }
                                        </strong>
                                      </div>
                                    ) : null}

                                    {requirement.minimumLevel ? (
                                      <div className="mt-1 text-[10px] text-slate-500">
                                        Minimum level:{" "}
                                        {
                                          requirement.minimumLevel
                                        }
                                      </div>
                                    ) : null}

                                    {requirement.minimumYears !==
                                    null ? (
                                      <div className="mt-1 text-[10px] text-slate-500">
                                        Minimum years:{" "}
                                        {
                                          requirement.minimumYears
                                        }
                                      </div>
                                    ) : null}
                                  </div>
                                </div>

                                <div className="shrink-0 text-left sm:text-right">
                                  <div className="text-xs font-bold text-slate-800">
                                    {
                                      requirement.pointsAwarded
                                    }
                                    /
                                    {
                                      requirement.pointsPossible
                                    }
                                  </div>

                                  <div className="mt-1 text-[9px] text-slate-400">
                                    points
                                  </div>
                                </div>
                              </div>

                              <div className="mt-3 border-t border-slate-200 pt-3">
                                <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                                  Evidence
                                </div>

                                {requirement.evidence.length >
                                0 ? (
                                  <div className="mt-2 grid gap-1.5">
                                    {requirement.evidence.map(
                                      (
                                        evidence,
                                        index
                                      ) => (
                                        <div
                                          key={`${requirement.requirementId}-${index}`}
                                          className="rounded-lg bg-white px-3 py-2 text-[10px] leading-5 text-slate-600"
                                        >
                                          “
                                          {
                                            evidence
                                          }
                                          ”
                                        </div>
                                      )
                                    )}
                                  </div>
                                ) : (
                                  <div className="mt-2 text-[10px] text-slate-400">
                                    Δεν
                                    υπάρχει
                                    τεκμηρίωση
                                    για αυτό
                                    το
                                    requirement
                                    στο
                                    validated
                                    profile.
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>

                  {/* SENIORITY */}

                  {seniority ? (
                    <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-4">
                      <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                        Seniority
                        analysis
                      </div>

                      <div className="mt-2 text-xs leading-5 text-slate-600">
                        {
                          seniority.rule
                        }
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="crm-badge">
                          Target:{" "}
                          {levelLabel(
                            seniority.targetLevel
                          )}
                        </span>

                        <span className="crm-badge">
                          Estimated:{" "}
                          {levelLabel(
                            seniority.estimatedLevel
                          )}
                        </span>

                        <span className="crm-badge">
                          Relevant years:{" "}
                          {
                            seniority.relevantYears
                          }
                        </span>
                      </div>
                    </div>
                  ) : null}

                  {/* FOOTER */}

                  <div className="flex flex-col gap-2 border-t border-slate-100 px-5 py-3 text-[9px] text-slate-400 sm:flex-row sm:items-center sm:justify-between">
                    <span>
                      Score generated:{" "}
                      {formatDate(
                        match.scoredAt
                      )}
                    </span>

                    <span>
                      Review status:{" "}
                      {match.reviewStatus ??
                        "—"}
                    </span>
                  </div>
                </article>
              );
            }
          )}

          <div className="rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-[10px] leading-5 text-blue-800">
            Τα scores είναι
            ανά θέση και
            βασίζονται σε
            τεκμηριωμένα
            επαγγελματικά
            criteria. Δεν
            αποτελούν αυτόματη
            απόφαση πρόσληψης·
            η τελική αξιολόγηση
            παραμένει στον
            recruiter.
          </div>
        </div>
      )}
    </section>
  );
}
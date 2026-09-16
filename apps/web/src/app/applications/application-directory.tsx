"use client";

import Link from "next/link";

import {
  useMemo,
  useState,
} from "react";

type ApplicationStatus =
  | "new"
  | "reviewing"
  | "contacted"
  | "interview"
  | "hired"
  | "rejected"
  | "archived";

type ApplicationItem = {
  id: string;
  candidateId: string;
  jobId: string;

  resumeId:
    string | number | null;

  source: string;
  status: string;

  appliedAt:
    string | null;

  overallScore:
    number | null;

  requirementsScore:
    number | null;

  seniorityScore:
    number | null;
};

type CandidateItem = {
  id: string;
  name: string;

  email:
    string | null;
};

type JobItem = {
  id: string;
  title: string;

  department:
    string | null;

  location:
    string | null;
};

type Props = {
  applications:
    ApplicationItem[];

  candidates:
    CandidateItem[];

  jobs:
    JobItem[];

  apiAvailable:
    boolean;
};

const statusOptions: {
  value: ApplicationStatus;
  label: string;
}[] = [
  {
    value: "new",
    label: "Νέα",
  },
  {
    value: "reviewing",
    label: "Σε αξιολόγηση",
  },
  {
    value: "contacted",
    label: "Επικοινωνία",
  },
  {
    value: "interview",
    label: "Συνέντευξη",
  },
  {
    value: "hired",
    label: "Ολοκληρωμένη",
  },
  {
    value: "rejected",
    label: "Κλειστή",
  },
  {
    value: "archived",
    label: "Αρχείο",
  },
];

function sourceLabel(
  value: string
) {
  switch (
    value.toLowerCase()
  ) {
    case "website":
      return "Website";

    case "indeed":
      return "Indeed";

    case "jobfind":
      return "Jobfind";

    case "gmail":
      return "Gmail";

    case "whatsapp":
      return "WhatsApp";

    case "viber":
      return "Viber";

    case "manual":
      return "Manual";

    case "bulk_import":
      return "Bulk Import";

    default:
      return value;
  }
}

function statusLabel(
  value: string
) {
  return (
    statusOptions.find(
      (option) =>
        option.value === value
    )?.label ??
    value
  );
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
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(date);
}

function formatScore(
  value:
    number | null
) {
  if (
    value === null
  ) {
    return "—";
  }

  return `${Math.round(
    value * 100
  ) / 100}%`;
}

export default function ApplicationDirectory({
  applications,
  candidates,
  jobs,
  apiAvailable,
}: Props) {
  const [
    applicationItems,
    setApplicationItems,
  ] =
    useState(
      applications
    );

  const [
    updatingId,
    setUpdatingId,
  ] =
    useState<
      string | null
    >(null);

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(null);

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    jobFilter,
    setJobFilter,
  ] =
    useState("all");

  const [
    sourceFilter,
    setSourceFilter,
  ] =
    useState("all");

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState("all");

  const candidateMap =
    useMemo(
      () =>
        new Map(
          candidates.map(
            (
              candidate
            ) => [
              candidate.id,
              candidate,
            ]
          )
        ),
      [
        candidates,
      ]
    );

  const jobMap =
    useMemo(
      () =>
        new Map(
          jobs.map(
            (
              job
            ) => [
              job.id,
              job,
            ]
          )
        ),
      [
        jobs,
      ]
    );

  const sources =
    useMemo(
      () =>
        Array.from(
          new Set(
            applicationItems.map(
              (
                application
              ) =>
                application.source
            )
          )
        ).sort(),
      [
        applicationItems,
      ]
    );

  const statuses =
    useMemo(
      () =>
        Array.from(
          new Set(
            applicationItems.map(
              (
                application
              ) =>
                application.status
            )
          )
        ).sort(),
      [
        applicationItems,
      ]
    );

  const filtered =
    useMemo(
      () => {
        const query =
          search
            .trim()
            .toLowerCase();

        return applicationItems
          .filter(
            (
              application
            ) => {
              const candidate =
                candidateMap.get(
                  application.candidateId
                );

              const job =
                jobMap.get(
                  application.jobId
                );

              const matchesSearch =
                !query ||
                [
                  candidate?.name,
                  candidate?.email,
                  job?.title,
                  job?.department,
                  application.source,
                  application.status,
                  application.id,
                ]
                  .filter(
                    Boolean
                  )
                  .some(
                    (
                      value
                    ) =>
                      String(
                        value
                      )
                        .toLowerCase()
                        .includes(
                          query
                        )
                  );

              const matchesJob =
                jobFilter ===
                  "all" ||
                application.jobId ===
                  jobFilter;

              const matchesSource =
                sourceFilter ===
                  "all" ||
                application.source ===
                  sourceFilter;

              const matchesStatus =
                statusFilter ===
                  "all" ||
                application.status ===
                  statusFilter;

              return (
                matchesSearch &&
                matchesJob &&
                matchesSource &&
                matchesStatus
              );
            }
          )
          .sort(
            (
              a,
              b
            ) => {
              const aDate =
                a.appliedAt
                  ? new Date(
                      a.appliedAt
                    ).getTime()
                  : 0;

              const bDate =
                b.appliedAt
                  ? new Date(
                      b.appliedAt
                    ).getTime()
                  : 0;

              return (
                bDate -
                aDate
              );
            }
          );
      },
      [
        applicationItems,
        candidateMap,
        jobMap,
        search,
        jobFilter,
        sourceFilter,
        statusFilter,
      ]
    );

  const newCount =
    applicationItems.filter(
      (
        item
      ) =>
        item.status ===
        "new"
    ).length;

  const websiteCount =
    applicationItems.filter(
      (
        item
      ) =>
        item.source ===
        "website"
    ).length;

  const uniqueCandidates =
    new Set(
      applicationItems.map(
        (
          item
        ) =>
          item.candidateId
      )
    ).size;

  async function changeStatus(
    applicationId:
      string,

    status:
      ApplicationStatus
  ) {
    setError(
      null
    );

    setUpdatingId(
      applicationId
    );

    try {
      const response =
        await fetch(
          `/api/applications/${applicationId}/status`,
          {
            method:
              "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                status,
              }),
          }
        );

      const result =
        await response.json();

      if (
        !response.ok
      ) {
        throw new Error(
          result?.error ??
          "Η αλλαγή status απέτυχε."
        );
      }

      setApplicationItems(
        (
          current
        ) =>
          current.map(
            (
              application
            ) =>
              application.id ===
              applicationId
                ? {
                    ...application,
                    status,
                  }
                : application
          )
      );
    } catch (
      updateError
    ) {
      setError(
        updateError instanceof
          Error
          ? updateError.message
          : "Η αλλαγή status απέτυχε."
      );
    } finally {
      setUpdatingId(
        null
      );
    }
  }

  function clearFilters() {
    setSearch("");
    setJobFilter(
      "all"
    );
    setSourceFilter(
      "all"
    );
    setStatusFilter(
      "all"
    );
  }

  return (
    <div>
      <div className="crm-page-header">
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.1em] text-blue-600">
            Recruitment Pipeline
          </p>

          <h1 className="crm-page-title">
            Αιτήσεις
          </h1>

          <p className="crm-page-description">
            Διαχείριση αιτήσεων,
            θέσεων, CV, current
            match και recruitment
            status.
          </p>
        </div>

        <Link
          href="/upload"
          className="crm-quick-action"
        >
          + Νέο CV
        </Link>
      </div>

      <section className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="crm-stat-card">
          <div className="crm-stat-label">
            Σύνολο αιτήσεων
          </div>

          <div className="crm-stat-value">
            {
              applicationItems.length
            }
          </div>

          <div className="crm-stat-meta">
            Καταχωρημένες
            applications
          </div>
        </div>

        <div className="crm-stat-card">
          <div className="crm-stat-label">
            Νέες
          </div>

          <div className="crm-stat-value">
            {newCount}
          </div>

          <div className="crm-stat-meta">
            Χρειάζονται
            recruiter review
          </div>
        </div>

        <div className="crm-stat-card">
          <div className="crm-stat-label">
            Υποψήφιοι
          </div>

          <div className="crm-stat-value">
            {uniqueCandidates}
          </div>

          <div className="crm-stat-meta">
            Διαφορετικά profiles
          </div>
        </div>

        <div className="crm-stat-card">
          <div className="crm-stat-label">
            Website
          </div>

          <div className="crm-stat-value">
            {websiteCount}
          </div>

          <div className="crm-stat-meta">
            Applications από
            website
          </div>
        </div>
      </section>

      {error ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
          {error}
        </div>
      ) : null}

      {!apiAvailable ? (
        <section className="crm-card">
          <div className="crm-empty">
            <div>
              <div className="crm-empty-title">
                Applications API
                unavailable
              </div>
            </div>
          </div>
        </section>
      ) : (
        <>
          <section className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid gap-3 xl:grid-cols-[minmax(250px,1fr)_220px_170px_170px]">
              <input
                type="search"
                value={
                  search
                }
                onChange={
                  (
                    event
                  ) =>
                    setSearch(
                      event.target
                        .value
                    )
                }
                placeholder="Υποψήφιος, email, θέση..."
                className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none"
              />

              <select
                value={
                  jobFilter
                }
                onChange={
                  (
                    event
                  ) =>
                    setJobFilter(
                      event.target
                        .value
                    )
                }
                className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm"
              >
                <option value="all">
                  Όλες οι θέσεις
                </option>

                {jobs.map(
                  (
                    job
                  ) => (
                    <option
                      key={
                        job.id
                      }
                      value={
                        job.id
                      }
                    >
                      {
                        job.title
                      }
                    </option>
                  )
                )}
              </select>

              <select
                value={
                  sourceFilter
                }
                onChange={
                  (
                    event
                  ) =>
                    setSourceFilter(
                      event.target
                        .value
                    )
                }
                className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm"
              >
                <option value="all">
                  Όλες οι πηγές
                </option>

                {sources.map(
                  (
                    source
                  ) => (
                    <option
                      key={
                        source
                      }
                      value={
                        source
                      }
                    >
                      {sourceLabel(
                        source
                      )}
                    </option>
                  )
                )}
              </select>

              <select
                value={
                  statusFilter
                }
                onChange={
                  (
                    event
                  ) =>
                    setStatusFilter(
                      event.target
                        .value
                    )
                }
                className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm"
              >
                <option value="all">
                  Όλα τα statuses
                </option>

                {statuses.map(
                  (
                    status
                  ) => (
                    <option
                      key={
                        status
                      }
                      value={
                        status
                      }
                    >
                      {statusLabel(
                        status
                      )}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
              <span>
                {
                  filtered.length
                }{" "}
                από{" "}
                {
                  applicationItems.length
                }{" "}
                αιτήσεις
              </span>

              <button
                type="button"
                onClick={
                  clearFilters
                }
                className="font-semibold text-blue-600"
              >
                Καθαρισμός φίλτρων
              </button>
            </div>
          </section>

          <div className="crm-table-wrap">
            <table className="crm-table">
              <thead>
                <tr>
                  <th>
                    Υποψήφιος
                  </th>

                  <th>
                    Θέση
                  </th>

                  <th>
                    CV
                  </th>

                  <th>
                    Current Match
                  </th>

                  <th>
                    Πηγή
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Ημερομηνία
                  </th>
                </tr>
              </thead>

              <tbody>
                {filtered.map(
                  (
                    application
                  ) => {
                    const candidate =
                      candidateMap.get(
                        application.candidateId
                      );

                    const job =
                      jobMap.get(
                        application.jobId
                      );

                    return (
                      <tr
                        key={
                          application.id
                        }
                      >
                        <td>
                          <Link
                            href={`/candidates/${application.candidateId}`}
                            className="font-semibold text-slate-800 hover:text-blue-600"
                          >
                            {candidate
                              ?.name ||
                              `Candidate #${application.candidateId}`}
                          </Link>

                          {candidate
                            ?.email ? (
                            <div className="mt-1 text-[10px] text-slate-400">
                              {
                                candidate.email
                              }
                            </div>
                          ) : null}
                        </td>

                        <td>
                          <Link
                            href={`/jobs/${application.jobId}`}
                            className="font-semibold text-slate-800 hover:text-blue-600"
                          >
                            {job
                              ?.title ||
                              `Job #${application.jobId}`}
                          </Link>

                          {job
                            ?.department ? (
                            <div className="mt-1 text-[10px] text-slate-400">
                              {
                                job.department
                              }
                            </div>
                          ) : null}
                        </td>

                        <td>
                          {application.resumeId
                            ? `CV #${application.resumeId}`
                            : "—"}
                        </td>

                        <td>
                          <div className="font-bold text-slate-800">
                            {formatScore(
                              application.overallScore
                            )}
                          </div>

                          {application.overallScore !==
                          null ? (
                            <div className="mt-1 text-[9px] text-slate-400">
                              Req{" "}
                              {formatScore(
                                application.requirementsScore
                              )}
                              {" · "}
                              Sen{" "}
                              {formatScore(
                                application.seniorityScore
                              )}
                            </div>
                          ) : null}
                        </td>

                        <td>
                          <span className="crm-badge">
                            {sourceLabel(
                              application.source
                            )}
                          </span>
                        </td>

                        <td>
                          <select
                            value={
                              application.status
                            }
                            disabled={
                              updatingId ===
                              application.id
                            }
                            onChange={
                              (
                                event
                              ) =>
                                changeStatus(
                                  application.id,
                                  event
                                    .target
                                    .value as ApplicationStatus
                                )
                            }
                            className="h-8 min-w-[140px] rounded-lg border border-slate-200 bg-white px-2 text-[11px] font-semibold text-slate-700 outline-none disabled:opacity-50"
                          >
                            {statusOptions.map(
                              (
                                option
                              ) => (
                                <option
                                  key={
                                    option.value
                                  }
                                  value={
                                    option.value
                                  }
                                >
                                  {
                                    option.label
                                  }
                                </option>
                              )
                            )}
                          </select>
                        </td>

                        <td className="whitespace-nowrap">
                          {formatDate(
                            application.appliedAt
                          )}
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-[10px] leading-5 text-blue-800">
        Το Current Match είναι
        πληροφορία υποστήριξης
        του recruiter για το
        συγκεκριμένο
        Candidate↔Job. Η αλλαγή
        application status γίνεται
        μόνο χειροκίνητα από τον
        recruiter.
      </div>
    </div>
  );
}
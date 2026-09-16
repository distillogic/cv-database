"use client";

import Link from "next/link";

import {
  useMemo,
  useState,
} from "react";

type CandidateListItem = {
  id: string;

  firstName:
    string;

  lastName:
    string;

  email:
    string | null;

  phone:
    string | null;

  location:
    string | null;

  source:
    string;

  status:
    string;

  createdAt:
    string | null;
};

type Props = {
  candidates:
    CandidateListItem[];
};

function candidateName(
  candidate:
    CandidateListItem
) {
  const name =
    `${candidate.firstName} ${candidate.lastName}`.trim();

  return (
    name ||
    `Υποψήφιος #${candidate.id}`
  );
}

function initials(
  candidate:
    CandidateListItem
) {
  const first =
    candidate.firstName
      .charAt(0)
      .toUpperCase();

  const last =
    candidate.lastName
      .charAt(0)
      .toUpperCase();

  return (
    `${first}${last}` ||
    "?"
  );
}

function sourceLabel(
  source: string
) {
  switch (
    source.toLowerCase()
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
      return source;
  }
}

function statusLabel(
  status: string
) {
  switch (
    status.toLowerCase()
  ) {
    case "new":
      return "Νέος";

    case "active":
      return "Ενεργός";

    case "review":
    case "needs_review":
      return "Για έλεγχο";

    case "contacted":
      return "Επικοινωνία";

    case "archived":
      return "Αρχείο";

    case "rejected":
      return "Κλειστό";

    default:
      return status;
  }
}

function statusClasses(
  status: string
) {
  switch (
    status.toLowerCase()
  ) {
    case "new":
      return "bg-blue-50 text-blue-700 border-blue-100";

    case "active":
      return "bg-emerald-50 text-emerald-700 border-emerald-100";

    case "review":
    case "needs_review":
      return "bg-amber-50 text-amber-700 border-amber-100";

    case "contacted":
      return "bg-violet-50 text-violet-700 border-violet-100";

    case "archived":
      return "bg-slate-100 text-slate-600 border-slate-200";

    default:
      return "bg-slate-50 text-slate-600 border-slate-200";
  }
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

  return new Intl
    .DateTimeFormat(
      "el-GR",
      {
        day:
          "2-digit",

        month:
          "2-digit",

        year:
          "numeric",
      }
    )
    .format(date);
}

export default function CandidateDirectory({
  candidates,
}: Props) {
  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    sourceFilter,
    setSourceFilter,
  ] =
    useState(
      "all"
    );

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState(
      "all"
    );

  const [
    sort,
    setSort,
  ] =
    useState(
      "newest"
    );

  const sources =
    useMemo(
      () =>
        Array.from(
          new Set(
            candidates
              .map(
                (
                  candidate
                ) =>
                  candidate.source
              )
              .filter(
                Boolean
              )
          )
        ).sort(),
      [
        candidates,
      ]
    );

  const statuses =
    useMemo(
      () =>
        Array.from(
          new Set(
            candidates
              .map(
                (
                  candidate
                ) =>
                  candidate.status
              )
              .filter(
                Boolean
              )
          )
        ).sort(),
      [
        candidates,
      ]
    );

  const filteredCandidates =
    useMemo(
      () => {
        const query =
          search
            .trim()
            .toLowerCase();

        const result =
          candidates.filter(
            (
              candidate
            ) => {
              const matchesSearch =
                !query ||
                [
                  candidateName(
                    candidate
                  ),

                  candidate.email,

                  candidate.phone,

                  candidate.location,

                  candidate.source,

                  candidate.status,

                  candidate.id,
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

              const matchesSource =
                sourceFilter ===
                  "all" ||
                candidate.source ===
                  sourceFilter;

              const matchesStatus =
                statusFilter ===
                  "all" ||
                candidate.status ===
                  statusFilter;

              return (
                matchesSearch &&
                matchesSource &&
                matchesStatus
              );
            }
          );

        result.sort(
          (
            a,
            b
          ) => {
            if (
              sort ===
              "name"
            ) {
              return candidateName(
                a
              ).localeCompare(
                candidateName(
                  b
                ),
                "el"
              );
            }

            if (
              sort ===
              "status"
            ) {
              return a.status.localeCompare(
                b.status
              );
            }

            const dateA =
              a.createdAt
                ? new Date(
                    a.createdAt
                  ).getTime()
                : 0;

            const dateB =
              b.createdAt
                ? new Date(
                    b.createdAt
                  ).getTime()
                : 0;

            return (
              dateB -
              dateA
            );
          }
        );

        return result;
      },
      [
        candidates,
        search,
        sourceFilter,
        statusFilter,
        sort,
      ]
    );

  const newCandidates =
    candidates.filter(
      (
        candidate
      ) =>
        candidate.status
          .toLowerCase() ===
        "new"
    ).length;

  const websiteCandidates =
    candidates.filter(
      (
        candidate
      ) =>
        candidate.source
          .toLowerCase() ===
        "website"
    ).length;

  const manualCandidates =
    candidates.filter(
      (
        candidate
      ) =>
        candidate.source
          .toLowerCase() ===
        "manual"
    ).length;

  const filtersActive =
    search.trim() !==
      "" ||
    sourceFilter !==
      "all" ||
    statusFilter !==
      "all";

  function clearFilters() {
    setSearch("");
    setSourceFilter(
      "all"
    );
    setStatusFilter(
      "all"
    );
  }

  return (
    <div>
      {/* HEADER */}

      <div className="crm-page-header">
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.1em] text-blue-600">
            Talent Database
          </p>

          <h1 className="crm-page-title">
            Υποψήφιοι
          </h1>

          <p className="crm-page-description">
            Κεντρική βάση
            υποψηφίων και
            βιογραφικών.
            Αναζήτησε,
            φιλτράρισε και
            άνοιξε το πλήρες
            επαγγελματικό
            προφίλ κάθε
            υποψηφίου.
          </p>
        </div>

        <Link
          href="/upload"
          className="crm-quick-action"
        >
          + Νέο CV
        </Link>
      </div>

      {/* STATS */}

      <section className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="crm-stat-card">
          <div className="crm-stat-label">
            Σύνολο
          </div>

          <div className="crm-stat-value">
            {
              candidates.length
            }
          </div>

          <div className="crm-stat-meta">
            Υποψήφιοι στο CRM
          </div>
        </div>

        <div className="crm-stat-card">
          <div className="crm-stat-label">
            Νέοι
          </div>

          <div className="crm-stat-value">
            {
              newCandidates
            }
          </div>

          <div className="crm-stat-meta">
            Νέες εγγραφές
          </div>
        </div>

        <div className="crm-stat-card">
          <div className="crm-stat-label">
            Website
          </div>

          <div className="crm-stat-value">
            {
              websiteCandidates
            }
          </div>

          <div className="crm-stat-meta">
            Από website
          </div>
        </div>

        <div className="crm-stat-card">
          <div className="crm-stat-label">
            Manual
          </div>

          <div className="crm-stat-value">
            {
              manualCandidates
            }
          </div>

          <div className="crm-stat-meta">
            Χειροκίνητη
            εισαγωγή
          </div>
        </div>
      </section>

      {/* FILTER BAR */}

      <section className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_180px_180px_170px]">

          <div>
            <label
              htmlFor="candidate-search"
              className="mb-1.5 block text-[11px] font-semibold text-slate-500"
            >
              Αναζήτηση
            </label>

            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                ⌕
              </span>

              <input
                id="candidate-search"
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
                placeholder="Όνομα, email, τηλέφωνο, τοποθεσία..."
                className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="source-filter"
              className="mb-1.5 block text-[11px] font-semibold text-slate-500"
            >
              Πηγή
            </label>

            <select
              id="source-filter"
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
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none focus:border-blue-300 focus:bg-white"
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
          </div>

          <div>
            <label
              htmlFor="status-filter"
              className="mb-1.5 block text-[11px] font-semibold text-slate-500"
            >
              Status
            </label>

            <select
              id="status-filter"
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
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none focus:border-blue-300 focus:bg-white"
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

          <div>
            <label
              htmlFor="sort-filter"
              className="mb-1.5 block text-[11px] font-semibold text-slate-500"
            >
              Ταξινόμηση
            </label>

            <select
              id="sort-filter"
              value={
                sort
              }
              onChange={
                (
                  event
                ) =>
                  setSort(
                    event.target
                      .value
                  )
              }
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none focus:border-blue-300 focus:bg-white"
            >
              <option value="newest">
                Νεότεροι
              </option>

              <option value="name">
                Όνομα Α-Ω
              </option>

              <option value="status">
                Status
              </option>
            </select>
          </div>

        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
          <div className="text-xs text-slate-500">
            Εμφανίζονται{" "}
            <strong className="text-slate-800">
              {
                filteredCandidates.length
              }
            </strong>{" "}
            από{" "}
            <strong className="text-slate-800">
              {
                candidates.length
              }
            </strong>{" "}
            υποψηφίους
          </div>

          {filtersActive ? (
            <button
              type="button"
              onClick={
                clearFilters
              }
              className="text-xs font-semibold text-blue-600 transition hover:text-blue-800"
            >
              Καθαρισμός
              φίλτρων
            </button>
          ) : null}
        </div>
      </section>

      {/* EMPTY */}

      {candidates.length ===
      0 ? (
        <section className="crm-card">
          <div className="crm-empty">
            <div>
              <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl bg-blue-50 text-xl text-blue-600">
                +
              </div>

              <div className="crm-empty-title">
                Δεν υπάρχουν
                ακόμη υποψήφιοι
              </div>

              <div className="crm-empty-copy">
                Ανέβασε ένα
                βιογραφικό για
                να δημιουργηθεί
                το πρώτο
                επαγγελματικό
                προφίλ.
              </div>

              <Link
                href="/upload"
                className="crm-quick-action mt-5"
              >
                Εισαγωγή CV
              </Link>
            </div>
          </div>
        </section>
      ) : filteredCandidates.length ===
        0 ? (
        <section className="crm-card">
          <div className="crm-empty">
            <div>
              <div className="crm-empty-title">
                Δεν βρέθηκαν
                αποτελέσματα
              </div>

              <div className="crm-empty-copy">
                Δοκίμασε
                διαφορετική
                αναζήτηση ή
                καθάρισε τα
                φίλτρα.
              </div>

              <button
                type="button"
                onClick={
                  clearFilters
                }
                className="mt-4 text-sm font-semibold text-blue-600"
              >
                Καθαρισμός
                φίλτρων
              </button>
            </div>
          </div>
        </section>
      ) : (
        <>
          {/* DESKTOP TABLE */}

          <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:block">
            <div className="overflow-x-auto">
              <table className="crm-table">
                <thead>
                  <tr>
                    <th>
                      Υποψήφιος
                    </th>

                    <th>
                      Επικοινωνία
                    </th>

                    <th>
                      Τοποθεσία
                    </th>

                    <th>
                      Πηγή
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Εισαγωγή
                    </th>

                    <th />
                  </tr>
                </thead>

                <tbody>
                  {filteredCandidates.map(
                    (
                      candidate
                    ) => (
                      <tr
                        key={
                          candidate.id
                        }
                      >
                        <td>
                          <Link
                            href={`/candidates/${candidate.id}`}
                            className="flex min-w-[190px] items-center gap-3"
                          >
                            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600">
                              {initials(
                                candidate
                              )}
                            </div>

                            <div>
                              <div className="font-semibold text-slate-800">
                                {candidateName(
                                  candidate
                                )}
                              </div>

                              <div className="mt-0.5 text-[10px] text-slate-400">
                                Candidate #
                                {
                                  candidate.id
                                }
                              </div>
                            </div>
                          </Link>
                        </td>

                        <td>
                          <div className="max-w-[220px]">
                            <div className="truncate text-xs text-slate-700">
                              {candidate.email ??
                                "—"}
                            </div>

                            {candidate.phone ? (
                              <div className="mt-1 text-[10px] text-slate-400">
                                {
                                  candidate.phone
                                }
                              </div>
                            ) : null}
                          </div>
                        </td>

                        <td>
                          {candidate.location ??
                            "—"}
                        </td>

                        <td>
                          <span className="crm-badge">
                            {sourceLabel(
                              candidate.source
                            )}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold ${statusClasses(
                              candidate.status
                            )}`}
                          >
                            {statusLabel(
                              candidate.status
                            )}
                          </span>
                        </td>

                        <td className="whitespace-nowrap">
                          {formatDate(
                            candidate.createdAt
                          )}
                        </td>

                        <td className="text-right">
                          <Link
                            href={`/candidates/${candidate.id}`}
                            className="inline-flex h-8 items-center rounded-lg border border-slate-200 px-3 text-[11px] font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                          >
                            Προφίλ →
                          </Link>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* MOBILE */}

          <div className="grid gap-3 md:hidden">
            {filteredCandidates.map(
              (
                candidate
              ) => (
                <Link
                  key={
                    candidate.id
                  }
                  href={`/candidates/${candidate.id}`}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition active:bg-slate-50"
                >
                  <div className="flex items-start gap-3">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600">
                      {initials(
                        candidate
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-slate-800">
                        {candidateName(
                          candidate
                        )}
                      </div>

                      <div className="mt-1 truncate text-xs text-slate-500">
                        {candidate.email ??
                          "Χωρίς email"}
                      </div>
                    </div>

                    <span
                      className={`inline-flex rounded-full border px-2 py-1 text-[9px] font-semibold ${statusClasses(
                        candidate.status
                      )}`}
                    >
                      {statusLabel(
                        candidate.status
                      )}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 text-xs">
                    <div>
                      <div className="text-[9px] uppercase tracking-wide text-slate-400">
                        Πηγή
                      </div>

                      <div className="mt-1 font-medium text-slate-700">
                        {sourceLabel(
                          candidate.source
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="text-[9px] uppercase tracking-wide text-slate-400">
                        Τοποθεσία
                      </div>

                      <div className="mt-1 font-medium text-slate-700">
                        {candidate.location ??
                          "—"}
                      </div>
                    </div>
                  </div>
                </Link>
              )
            )}
          </div>
        </>
      )}

      <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-[11px] leading-5 text-blue-800">
        Το Candidates workspace
        είναι εσωτερικό και
        προορίζεται για πλήρη
        δεδομένα recruitment.
        Το δημόσιο website θα
        λαμβάνει αργότερα μόνο
        τα πεδία που θα
        επιτρέψουμε ρητά.
      </div>
    </div>
  );
}
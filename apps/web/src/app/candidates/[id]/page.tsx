import Link from "next/link";
import CandidateJobMatches from "./candidate-job-matches";
import {
  getCandidateProfile,
} from "@/lib/api";

const API_BASE_URL =
  process.env.API_BASE_URL ??
  "http://localhost:4000";

type UnknownRecord =
  Record<
    string,
    unknown
  >;

type CandidateData = {
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
    string | null;

  status:
    string | null;

  createdAt:
    string | null;

  updatedAt:
    string | null;
};

type ApplicationData = {
  id?: string | number;

  candidate_id?:
    string | number | null;

  candidateId?:
    string | number | null;

  job_id?:
    string | number | null;

  jobId?:
    string | number | null;

  resume_id?:
    string | number | null;

  resumeId?:
    string | number | null;

  source?:
    string | null;

  status?:
    string | null;

  applied_at?:
    string | null;

  appliedAt?:
    string | null;

  created_at?:
    string | null;

  createdAt?:
    string | null;
};

type JobData = {
  id?: string | number;

  title?:
    string | null;

  department?:
    string | null;

  location?:
    string | null;

  status?:
    string | null;

  target_level?:
    string | null;

  targetLevel?:
    string | null;
};

type CollectionResult<T> = {
  available:
    boolean;

  items:
    T[];
};

function asRecord(
  value: unknown
): UnknownRecord | null {
  if (
    typeof value !==
      "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return null;
  }

  return value as UnknownRecord;
}

function readString(
  record:
    UnknownRecord | null,

  ...keys:
    string[]
): string | null {
  if (!record) {
    return null;
  }

  for (
    const key of keys
  ) {
    const value =
      record[key];

    if (
      typeof value ===
        "string" ||
      typeof value ===
        "number"
    ) {
      return String(
        value
      );
    }
  }

  return null;
}

function unwrapObject(
  value: unknown
): UnknownRecord | null {
  const outer =
    asRecord(value);

  if (!outer) {
    return null;
  }

  const data =
    asRecord(
      outer.data
    );

  if (data) {
    return data;
  }

  const candidate =
    asRecord(
      outer.candidate
    );

  if (candidate) {
    return candidate;
  }

  return outer;
}

function extractArray<T>(
  value: unknown
): T[] {
  if (
    Array.isArray(
      value
    )
  ) {
    return value as T[];
  }

  const outer =
    asRecord(value);

  if (!outer) {
    return [];
  }

  for (
    const key of [
      "data",
      "items",
      "applications",
      "jobs",
      "results",
    ]
  ) {
    const nested =
      outer[key];

    if (
      Array.isArray(
        nested
      )
    ) {
      return nested as T[];
    }

    const nestedRecord =
      asRecord(
        nested
      );

    if (
      nestedRecord
    ) {
      for (
        const nestedKey of [
          "items",
          "applications",
          "jobs",
          "results",
        ]
      ) {
        if (
          Array.isArray(
            nestedRecord[
              nestedKey
            ]
          )
        ) {
          return nestedRecord[
            nestedKey
          ] as T[];
        }
      }
    }
  }

  return [];
}

async function fetchCandidate(
  id: string
): Promise<CandidateData | null> {
  try {
    const response =
      await fetch(
        `${API_BASE_URL}/api/candidates/${id}`,
        {
          cache:
            "no-store",
        }
      );

    if (
      !response.ok
    ) {
      return null;
    }

    const raw =
      await response.json();

    const record =
      unwrapObject(
        raw
      );

    if (!record) {
      return null;
    }

    return {
      id:
        readString(
          record,
          "id"
        ) ??
        id,

      firstName:
        readString(
          record,
          "first_name",
          "firstName"
        ) ??
        "",

      lastName:
        readString(
          record,
          "last_name",
          "lastName"
        ) ??
        "",

      email:
        readString(
          record,
          "email"
        ),

      phone:
        readString(
          record,
          "phone"
        ),

      location:
        readString(
          record,
          "location"
        ),

      source:
        readString(
          record,
          "source"
        ),

      status:
        readString(
          record,
          "status"
        ),

      createdAt:
        readString(
          record,
          "created_at",
          "createdAt"
        ),

      updatedAt:
        readString(
          record,
          "updated_at",
          "updatedAt"
        ),
    };
  } catch {
    return null;
  }
}

async function fetchCollection<T>(
  path: string
): Promise<
  CollectionResult<T>
> {
  try {
    const response =
      await fetch(
        `${API_BASE_URL}${path}`,
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

        items: [],
      };
    }

    const raw =
      await response.json();

    return {
      available:
        true,

      items:
        extractArray<T>(
          raw
        ),
    };
  } catch {
    return {
      available:
        false,

      items: [],
    };
  }
}

function candidateName(
  candidate:
    CandidateData | null,

  id: string
) {
  if (!candidate) {
    return `Υποψήφιος #${id}`;
  }

  const fullName =
    `${candidate.firstName} ${candidate.lastName}`.trim();

  return (
    fullName ||
    `Υποψήφιος #${id}`
  );
}

function initials(
  candidate:
    CandidateData | null
) {
  if (!candidate) {
    return "?";
  }

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

function formatDate(
  value:
    string | null | undefined
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
    }
  ).format(date);
}

function sourceLabel(
  source:
    string | null | undefined
) {
  switch (
    source
      ?.toLowerCase()
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
      return (
        source ??
        "—"
      );
  }
}

function statusLabel(
  status:
    string | null | undefined
) {
  switch (
    status
      ?.toLowerCase()
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
      return (
        status ??
        "—"
      );
  }
}

function reviewStatusLabel(
  value:
    string | null | undefined
) {
  if (!value) {
    return "Δεν έχει οριστεί";
  }

  switch (
    value.toLowerCase()
  ) {
    case "pending":
      return "Αναμονή ελέγχου";

    case "reviewed":
      return "Ελεγμένο";

    case "approved":
      return "Επιβεβαιωμένο";

    case "needs_review":
      return "Χρειάζεται έλεγχο";

    default:
      return value;
  }
}

function applicationStatusLabel(
  value:
    string | null | undefined
) {
  switch (
    value
      ?.toLowerCase()
  ) {
    case "new":
      return "Νέα";

    case "review":
    case "reviewing":
      return "Σε αξιολόγηση";

    case "contacted":
      return "Επικοινωνία";

    case "interview":
      return "Συνέντευξη";

    case "hired":
      return "Ολοκληρωμένη";

    case "rejected":
      return "Κλειστή";

    default:
      return (
        value ??
        "—"
      );
  }
}

function professionalCategoryLabel(
  value:
    string | null | undefined
) {
  switch (
    value
      ?.toLowerCase()
  ) {
    case "it_software":
      return "IT & Software";

    case "data_analytics":
      return "Data & Analytics";

    case "accounting_finance":
      return "Accounting & Finance";

    case "sales":
      return "Sales";

    case "marketing":
      return "Marketing";

    case "human_resources":
      return "Human Resources";

    case "administration":
      return "Administration";

    case "engineering":
      return "Engineering";

    case "logistics_supply_chain":
      return "Logistics & Supply Chain";

    case "hospitality_tourism":
      return "Hospitality & Tourism";

    case "customer_service":
      return "Customer Service";

    case "healthcare":
      return "Healthcare";

    case "construction_trades":
      return "Construction & Trades";

    case "education":
      return "Education";

    case "legal":
      return "Legal";

    case "operations":
      return "Operations";

    case "other":
      return "Other";

    default:
      return (
        value ??
        "Δεν έχει κατηγοριοποιηθεί"
      );
  }
}

function classificationConfidenceLabel(
  value:
    string | null | undefined
) {
  switch (
    value
      ?.toLowerCase()
  ) {
    case "high":
      return "Υψηλή";

    case "medium":
      return "Μεσαία";

    case "low":
      return "Χαμηλή";

    default:
      return "—";
  }
}

function seniorityLabel(
  value:
    string | null | undefined
) {
  switch (
    value
      ?.toLowerCase()
  ) {
    case "junior":
      return "Junior";

    case "senior":
      return "Senior";

    case "expert":
      return "Expert";

    default:
      return "Δεν έχει τεκμηριωθεί";
  }
}

function asStringArray(
  value: unknown
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is string =>
      typeof item ===
        "string" &&
      item.trim().length > 0
  );
}

function ProfileSection({
  title,
  description,
  count,
  children,
}: {
  title:
    string;

  description?:
    string;

  count?:
    number;

  children:
    React.ReactNode;
}) {
  return (
    <section className="crm-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <h2 className="text-sm font-bold text-slate-800">
            {title}
          </h2>

          {description ? (
            <p className="mt-1 text-[11px] text-slate-500">
              {description}
            </p>
          ) : null}
        </div>

        {typeof count ===
        "number" ? (
          <span className="crm-badge">
            {count}
          </span>
        ) : null}
      </div>

      <div className="p-5">
        {children}
      </div>
    </section>
  );
}

function EmptySection({
  message =
    "Δεν υπάρχει τεκμηριωμένη πληροφορία στο βιογραφικό.",
}: {
  message?:
    string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center">
      <p className="text-xs text-slate-500">
        {message}
      </p>
    </div>
  );
}

export default async function CandidateProfilePage({
  params,
}: {
  params:
    Promise<{
      id: string;
    }>;
}) {
  const { id } =
    await params;

  const [
    profile,
    candidate,
    applicationsResult,
    jobsResult,
  ] =
    await Promise.all([
      getCandidateProfile(
        id
      ),

      fetchCandidate(
        id
      ),

      fetchCollection<ApplicationData>(
        "/api/applications"
      ),

      fetchCollection<JobData>(
        "/api/jobs"
      ),
    ]);

  const name =
    candidateName(
      candidate,
      id
    );

  if (!profile) {
    return (
      <div>
        <Link
          href="/candidates"
          className="mb-5 inline-flex items-center gap-2 text-xs font-semibold text-slate-500 transition hover:text-blue-600"
        >
          ← Υποψήφιοι
        </Link>

        <section className="crm-card">
          <div className="crm-empty">
            <div>
              <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl bg-amber-50 text-lg font-bold text-amber-600">
                !
              </div>

              <div className="crm-empty-title">
                Δεν υπάρχει
                Professional Profile
              </div>

              <div className="crm-empty-copy">
                Ο υποψήφιος{" "}
                <strong>
                  {name}
                </strong>{" "}
                δεν έχει ακόμη
                ολοκληρωμένο
                επαγγελματικό
                προφίλ από CV.
              </div>

              <Link
                href="/candidates"
                className="crm-quick-action mt-5"
              >
                Επιστροφή στους
                υποψηφίους
              </Link>
            </div>
          </div>
        </section>
      </div>
    );
  }

  const classifiedProfile =
    profile as typeof profile & {
      professional_category?:
        string | null;

      professional_subcategory?:
        string | null;

      estimated_seniority?:
        string | null;

      classification_confidence?:
        string | null;

      classification_evidence?:
        unknown;

      seniority_evidence?:
        unknown;

      classification_updated_at?:
        string | null;
    };

  const professionalCategory =
    classifiedProfile
      .professional_category ??
    null;

  const professionalSubcategory =
    classifiedProfile
      .professional_subcategory ??
    null;

  const estimatedSeniority =
    classifiedProfile
      .estimated_seniority ??
    null;

  const classificationConfidence =
    classifiedProfile
      .classification_confidence ??
    null;

  const classificationEvidence =
    asStringArray(
      classifiedProfile
        .classification_evidence
    );

  const seniorityEvidence =
    asStringArray(
      classifiedProfile
        .seniority_evidence
    );

  const classificationUpdatedAt =
    classifiedProfile
      .classification_updated_at ??
    null;

  const skills =
    profile.skills ??
    [];

  const languages =
    profile.languages ??
    [];

  const workExperience =
    profile.workExperience ??
    [];

  const education =
    profile.education ??
    [];

  const training =
    profile.training ??
    [];

  const certifications =
    profile.certifications ??
    [];

  const drivingLicenses =
    profile.drivingLicenses ??
    [];

  const candidateApplications =
    applicationsResult
      .items
      .filter(
        (
          application
        ) => {
          const applicationCandidateId =
            application.candidate_id ??
            application.candidateId;

          return (
            applicationCandidateId !==
              null &&
            applicationCandidateId !==
              undefined &&
            String(
              applicationCandidateId
            ) ===
              id
          );
        }
      )
      .sort(
        (
          a,
          b
        ) => {
          const aDate =
            new Date(
              a.applied_at ??
                a.appliedAt ??
                a.created_at ??
                a.createdAt ??
                0
            ).getTime();

          const bDate =
            new Date(
              b.applied_at ??
                b.appliedAt ??
                b.created_at ??
                b.createdAt ??
                0
            ).getTime();

          return (
            bDate -
            aDate
          );
        }
      );

  const jobsById =
    new Map<
      string,
      JobData
    >();

  for (
    const job of
      jobsResult.items
  ) {
    if (
      job.id !==
        undefined &&
      job.id !==
        null
    ) {
      jobsById.set(
        String(
          job.id
        ),
        job
      );
    }
  }

  return (
    <div>
      {/* BACK */}

      <Link
        href="/candidates"
        className="mb-5 inline-flex items-center gap-2 text-xs font-semibold text-slate-500 transition hover:text-blue-600"
      >
        ← Υποψήφιοι
      </Link>

      {/* PROFILE HEADER */}

      <section className="mb-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-slate-900 text-lg font-bold text-white">
                {initials(
                  candidate
                )}
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-blue-600">
                    Candidate
                    Profile
                  </p>

                  <span className="crm-badge">
                    ID #{id}
                  </span>
                </div>

                <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  {name}
                </h1>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="crm-badge crm-badge-primary">
                    {statusLabel(
                      candidate
                        ?.status
                    )}
                  </span>

                  <span className="crm-badge">
                    {sourceLabel(
                      candidate
                        ?.source
                    )}
                  </span>

                  {candidate
                    ?.location ? (
                    <span className="crm-badge">
                      {
                        candidate.location
                      }
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/upload"
                className="inline-flex min-h-9 items-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Νέο CV
              </Link>

              <div className="inline-flex min-h-9 items-center rounded-lg bg-blue-50 px-3 text-xs font-semibold text-blue-700">
                Internal Profile
              </div>
            </div>
          </div>
        </div>

        {/* CONTACT + REVIEW */}

        <div className="grid divide-y divide-slate-100 lg:grid-cols-4 lg:divide-x lg:divide-y-0">
          <div className="px-5 py-4">
            <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
              Email
            </div>

            <div className="mt-1.5 break-all text-xs font-medium text-slate-700">
              {candidate
                ?.email ??
                "—"}
            </div>
          </div>

          <div className="px-5 py-4">
            <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
              Τηλέφωνο
            </div>

            <div className="mt-1.5 text-xs font-medium text-slate-700">
              {candidate
                ?.phone ??
                "—"}
            </div>
          </div>

          <div className="px-5 py-4">
            <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
              Review Status
            </div>

            <div className="mt-1.5 text-xs font-semibold text-blue-700">
              {reviewStatusLabel(
                profile.review_status
              )}
            </div>
          </div>

          <div className="px-5 py-4">
            <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
              Καταχώρηση
            </div>

            <div className="mt-1.5 text-xs font-medium text-slate-700">
              {formatDate(
                candidate
                  ?.createdAt
              )}
            </div>
          </div>
        </div>
      </section>

      {/* PROFILE STATS */}

      <section className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="crm-stat-card">
          <div className="crm-stat-label">
            Skills
          </div>

          <div className="crm-stat-value">
            {skills.length}
          </div>

          <div className="crm-stat-meta">
            Τεκμηριωμένες
            δεξιότητες
          </div>
        </div>

        <div className="crm-stat-card">
          <div className="crm-stat-label">
            Εμπειρίες
          </div>

          <div className="crm-stat-value">
            {
              workExperience.length
            }
          </div>

          <div className="crm-stat-meta">
            Εργασιακές
            καταχωρήσεις
          </div>
        </div>

        <div className="crm-stat-card">
          <div className="crm-stat-label">
            Εκπαίδευση
          </div>

          <div className="crm-stat-value">
            {education.length}
          </div>

          <div className="crm-stat-meta">
            Σπουδές /
            προσόντα
          </div>
        </div>

        <div className="crm-stat-card">
          <div className="crm-stat-label">
            Applications
          </div>

          <div className="crm-stat-value">
            {applicationsResult
              .available
              ? candidateApplications
                  .length
              : "—"}
          </div>

          <div className="crm-stat-meta">
            Συνδεδεμένες
            αιτήσεις
          </div>
        </div>
      </section>
      
      {/* PROFESSIONAL CLASSIFICATION */}

      <section className="mb-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-blue-600">
                Professional Classification
              </div>

              <h2 className="mt-1 text-base font-bold text-slate-900">
                {professionalCategoryLabel(
                  professionalCategory
                )}
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                {professionalSubcategory ??
                  "Δεν έχει οριστεί υποκατηγορία"}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="crm-badge crm-badge-primary">
                Confidence: {classificationConfidenceLabel(
                  classificationConfidence
                )}
              </span>

              <span className="crm-badge">
                Seniority: {seniorityLabel(
                  estimatedSeniority
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-0 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.75fr)]">
          <div className="border-b border-slate-100 p-5 lg:border-b-0 lg:border-r">
            <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
              Classification Evidence
            </div>

            {classificationEvidence.length ===
            0 ? (
              <div className="mt-3">
                <EmptySection message="Δεν υπάρχει αποθηκευμένο evidence για την επαγγελματική κατηγοριοποίηση." />
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                {classificationEvidence.map(
                  (evidence, index) => (
                    <div
                      key={`${evidence}-${index}`}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs leading-5 text-slate-700"
                    >
                      {evidence}
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          <div className="p-5">
            <div className="space-y-4">
              <div>
                <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  Seniority Evidence
                </div>

                {seniorityEvidence.length >
                0 ? (
                  <div className="mt-2 space-y-2">
                    {seniorityEvidence.map(
                      (evidence, index) => (
                        <div
                          key={`${evidence}-${index}`}
                          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] leading-5 text-slate-700"
                        >
                          {evidence}
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <p className="mt-2 text-[11px] leading-5 text-slate-500">
                    Δεν υπάρχει επαρκής τεκμηρίωση σχετικής επαγγελματικής εμπειρίας για ασφαλή εκτίμηση seniority.
                  </p>
                )}
              </div>

              <div className="border-t border-slate-100" />

              <div>
                <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  Updated
                </div>

                <div className="mt-1 text-xs font-medium text-slate-700">
                  {formatDate(
                    classificationUpdatedAt
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-50/70 px-3 py-3 text-[10px] leading-5 text-blue-800">
                Η κατηγοριοποίηση χρησιμοποιείται για οργάνωση και αναζήτηση του CRM. Δεν αποτελεί απόφαση πρόσληψης ή απόρριψης.
              </div>
            </div>
          </div>
        </div>
      </section>

      <CandidateJobMatches
        candidateId={id}
      />

      {/* MAIN GRID */}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.75fr)]">
        <div className="grid gap-5">
          {/* SKILLS */}

          <ProfileSection
            title="Skills"
            description="Δεξιότητες που τεκμηριώνονται από το CV."
            count={
              skills.length
            }
          >
            {skills.length ===
            0 ? (
              <EmptySection />
            ) : (
              <div className="flex flex-wrap gap-2">
                {skills.map(
                  (
                    skill,
                    index
                  ) => (
                    <div
                      key={
                        skill.id ??
                        `${skill.name}-${index}`
                      }
                      className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                    >
                      <div className="text-xs font-semibold text-slate-800">
                        {
                          skill.name
                        }
                      </div>

                      {skill.category ? (
                        <div className="mt-0.5 text-[9px] text-slate-400">
                          {
                            skill.category
                          }
                        </div>
                      ) : null}
                    </div>
                  )
                )}
              </div>
            )}
          </ProfileSection>

          {/* EXPERIENCE */}

          <ProfileSection
            title="Εργασιακή εμπειρία"
            description="Καταγεγραμμένη επαγγελματική εμπειρία."
            count={
              workExperience.length
            }
          >
            {workExperience.length ===
            0 ? (
              <EmptySection />
            ) : (
              <div className="space-y-3">
                {workExperience.map(
                  (
                    experience,
                    index
                  ) => (
                    <div
                      key={
                        experience.id ??
                        `${experience.role}-${index}`
                      }
                      className="relative rounded-xl border border-slate-200 bg-white p-4"
                    >
                      <div className="absolute bottom-4 left-0 top-4 w-[3px] rounded-r-full bg-blue-500" />

                      <div className="pl-2">
                        <h3 className="text-sm font-bold text-slate-800">
                          {
                            experience.role
                          }
                        </h3>

                        {experience.organization ? (
                          <p className="mt-1 text-xs font-medium text-slate-600">
                            {
                              experience.organization
                            }
                          </p>
                        ) : null}

                        {experience.dates_text ? (
                          <p className="mt-2 text-[10px] text-slate-400">
                            {
                              experience.dates_text
                            }
                          </p>
                        ) : null}
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </ProfileSection>

          {/* EDUCATION */}

          <ProfileSection
            title="Εκπαίδευση"
            description="Σπουδές και ακαδημαϊκά προσόντα."
            count={
              education.length
            }
          >
            {education.length ===
            0 ? (
              <EmptySection />
            ) : (
              <div className="space-y-3">
                {education.map(
                  (
                    item,
                    index
                  ) => (
                    <div
                      key={
                        item.id ??
                        `${item.qualification}-${index}`
                      }
                      className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <h3 className="text-sm font-bold text-slate-800">
                        {
                          item.qualification
                        }
                      </h3>

                      {item.institution ? (
                        <p className="mt-1 text-xs font-medium text-slate-600">
                          {
                            item.institution
                          }
                        </p>
                      ) : null}

                      <div className="mt-3 flex flex-wrap gap-2">
                        {item.dates_text ? (
                          <span className="crm-badge">
                            {
                              item.dates_text
                            }
                          </span>
                        ) : null}

                        {item.status ? (
                          <span className="crm-badge">
                            {
                              item.status
                            }
                          </span>
                        ) : null}

                        {item.grade ? (
                          <span className="crm-badge">
                            Βαθμός:{" "}
                            {
                              item.grade
                            }
                          </span>
                        ) : null}
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </ProfileSection>

          {/* APPLICATIONS */}

          <ProfileSection
            title="Applications"
            description="Θέσεις εργασίας με τις οποίες έχει συνδεθεί ο υποψήφιος."
            count={
              applicationsResult
                .available
                ? candidateApplications
                    .length
                : undefined
            }
          >
            {!applicationsResult.available ? (
              <EmptySection message="Το Applications GET API δεν είναι ακόμη διαθέσιμο. Θα το συνδέσουμε στο επόμενο στάδιο." />
            ) : candidateApplications.length ===
              0 ? (
              <EmptySection message="Δεν υπάρχουν καταχωρημένες αιτήσεις για αυτόν τον υποψήφιο." />
            ) : (
              <div className="overflow-x-auto">
                <table className="crm-table">
                  <thead>
                    <tr>
                      <th>
                        Θέση
                      </th>

                      <th>
                        Source
                      </th>

                      <th>
                        Status
                      </th>

                      <th>
                        Resume
                      </th>

                      <th>
                        Ημερομηνία
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {candidateApplications.map(
                      (
                        application
                      ) => {
                        const jobId =
                          application.job_id ??
                          application.jobId;

                        const resumeId =
                          application.resume_id ??
                          application.resumeId;

                        const job =
                          jobId !==
                            null &&
                          jobId !==
                            undefined
                            ? jobsById.get(
                                String(
                                  jobId
                                )
                              )
                            : undefined;

                        return (
                          <tr
                            key={String(
                              application.id
                            )}
                          >
                            <td>
                              {jobId ? (
                                <Link
                                  href={`/jobs/${jobId}`}
                                  className="font-semibold text-slate-800 transition hover:text-blue-600"
                                >
                                  {job
                                    ?.title ??
                                    `Job #${jobId}`}
                                </Link>
                              ) : (
                                "—"
                              )}

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
                              <span className="crm-badge">
                                {sourceLabel(
                                  application.source
                                )}
                              </span>
                            </td>

                            <td>
                              <span className="crm-badge crm-badge-primary">
                                {applicationStatusLabel(
                                  application.status
                                )}
                              </span>
                            </td>

                            <td>
                              {resumeId
                                ? `CV #${resumeId}`
                                : "—"}
                            </td>

                            <td>
                              {formatDate(
                                application.applied_at ??
                                  application.appliedAt ??
                                  application.created_at ??
                                  application.createdAt
                              )}
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </ProfileSection>
        </div>

        {/* RIGHT COLUMN */}

        <div className="grid content-start gap-5">
          {/* CONTACT */}

          <ProfileSection
            title="Στοιχεία υποψηφίου"
            description="Εσωτερικά στοιχεία επικοινωνίας."
          >
            <div className="space-y-4">
              <div>
                <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  Ονοματεπώνυμο
                </div>

                <div className="mt-1 text-xs font-semibold text-slate-700">
                  {name}
                </div>
              </div>

              <div>
                <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  Email
                </div>

                <div className="mt-1 break-all text-xs text-slate-700">
                  {candidate
                    ?.email ??
                    "—"}
                </div>
              </div>

              <div>
                <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  Τηλέφωνο
                </div>

                <div className="mt-1 text-xs text-slate-700">
                  {candidate
                    ?.phone ??
                    "—"}
                </div>
              </div>

              <div>
                <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  Τοποθεσία
                </div>

                <div className="mt-1 text-xs text-slate-700">
                  {candidate
                    ?.location ??
                    "—"}
                </div>
              </div>

              <div>
                <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  Source
                </div>

                <div className="mt-1">
                  <span className="crm-badge">
                    {sourceLabel(
                      candidate
                        ?.source
                    )}
                  </span>
                </div>
              </div>
            </div>
          </ProfileSection>

          {/* LANGUAGES */}

          <ProfileSection
            title="Γλώσσες"
            count={
              languages.length
            }
          >
            {languages.length ===
            0 ? (
              <EmptySection />
            ) : (
              <div className="space-y-2">
                {languages.map(
                  (
                    language,
                    index
                  ) => (
                    <div
                      key={
                        language.id ??
                        `${language.language}-${index}`
                      }
                      className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3"
                    >
                      <span className="text-xs font-semibold text-slate-800">
                        {
                          language.language
                        }
                      </span>

                      <span className="crm-badge">
                        {language.level ??
                          "—"}
                      </span>
                    </div>
                  )
                )}
              </div>
            )}
          </ProfileSection>

          {/* CERTIFICATIONS */}

          <ProfileSection
            title="Πιστοποιήσεις"
            count={
              certifications.length
            }
          >
            {certifications.length ===
            0 ? (
              <EmptySection />
            ) : (
              <div className="space-y-2">
                {certifications.map(
                  (
                    item,
                    index
                  ) => (
                    <div
                      key={
                        item.id ??
                        `${item.name}-${index}`
                      }
                      className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                    >
                      <div className="text-xs font-semibold text-slate-800">
                        {
                          item.name
                        }
                      </div>

                      {item.issuer ? (
                        <div className="mt-1 text-[10px] text-slate-500">
                          {
                            item.issuer
                          }
                        </div>
                      ) : null}
                    </div>
                  )
                )}
              </div>
            )}
          </ProfileSection>

          {/* TRAINING */}

          <ProfileSection
            title="Training"
            count={
              training.length
            }
          >
            {training.length ===
            0 ? (
              <EmptySection />
            ) : (
              <div className="space-y-2">
                {training.map(
                  (
                    item,
                    index
                  ) => (
                    <div
                      key={
                        item.id ??
                        `${item.name}-${index}`
                      }
                      className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                    >
                      <div className="text-xs font-semibold text-slate-800">
                        {
                          item.name
                        }
                      </div>

                      {item.provider ? (
                        <div className="mt-1 text-[10px] text-slate-500">
                          {
                            item.provider
                          }
                        </div>
                      ) : null}
                    </div>
                  )
                )}
              </div>
            )}
          </ProfileSection>

          {/* DRIVING */}

          <ProfileSection
            title="Άδειες οδήγησης"
            count={
              drivingLicenses.length
            }
          >
            {drivingLicenses.length ===
            0 ? (
              <EmptySection />
            ) : (
              <div className="flex flex-wrap gap-2">
                {drivingLicenses.map(
                  (
                    license,
                    index
                  ) => (
                    <span
                      key={
                        license.id ??
                        `${license.category}-${index}`
                      }
                      className="crm-badge crm-badge-primary"
                    >
                      Κατηγορία{" "}
                      {
                        license.category
                      }
                    </span>
                  )
                )}
              </div>
            )}
          </ProfileSection>

          {/* AUDIT */}

          <ProfileSection
            title="CV / Audit"
            description="Τεχνική ιχνηλασιμότητα του extracted profile."
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[10px] text-slate-500">
                  Resume ID
                </span>

                <span className="font-mono text-[10px] font-semibold text-slate-700">
                  {profile.source_resume_id ??
                    "—"}
                </span>
              </div>

              <div className="border-t border-slate-100" />

              <div className="flex items-center justify-between gap-4">
                <span className="text-[10px] text-slate-500">
                  Analysis Run
                </span>

                <span className="font-mono text-[10px] font-semibold text-slate-700">
                  {profile.source_analysis_run_id ??
                    "—"}
                </span>
              </div>

              <div className="border-t border-slate-100" />

              <div className="flex items-center justify-between gap-4">
                <span className="text-[10px] text-slate-500">
                  Review
                </span>

                <span className="text-[10px] font-semibold text-blue-700">
                  {reviewStatusLabel(
                    profile.review_status
                  )}
                </span>
              </div>
            </div>
          </ProfileSection>
        </div>
      </div>

      {/* INTERNAL NOTE */}

      <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-[11px] leading-5 text-blue-800">
        Το συγκεκριμένο
        workspace είναι
        ιδιωτικό και
        προορίζεται για
        εσωτερική χρήση
        recruitment. Τα
        δεδομένα του
        υποψηφίου δεν
        προορίζονται αυτόματα
        για δημοσίευση στο
        website.
      </div>
    </div>
  );
}
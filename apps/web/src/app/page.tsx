import Link from "next/link";

const API_BASE_URL =
  process.env.API_BASE_URL ??
  "http://localhost:4000";

type Candidate = {
  id?: string | number;
  first_name?: string | null;
  last_name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  location?: string | null;
  source?: string | null;
  status?: string | null;
  created_at?: string | null;
  createdAt?: string | null;
};

type Job = {
  id?: string | number;
  title?: string | null;
  department?: string | null;
  location?: string | null;
  status?: string | null;
  target_level?: string | null;
  targetLevel?: string | null;
  created_at?: string | null;
  createdAt?: string | null;
};

type Application = {
  id?: string | number;
  candidate_id?: string | number | null;
  candidateId?: string | number | null;
  job_id?: string | number | null;
  jobId?: string | number | null;
  resume_id?: string | number | null;
  resumeId?: string | number | null;
  source?: string | null;
  status?: string | null;
  applied_at?: string | null;
  appliedAt?: string | null;
  created_at?: string | null;
  createdAt?: string | null;
};

type FetchResult<T> = {
  available: boolean;
  items: T[];
};

function extractArray<T>(
  value: unknown
): T[] {
  if (Array.isArray(value)) {
    return value as T[];
  }

  if (
    typeof value !== "object" ||
    value === null
  ) {
    return [];
  }

  const record =
    value as Record<
      string,
      unknown
    >;

  for (
    const key of [
      "data",
      "items",
      "candidates",
      "jobs",
      "applications",
      "results",
    ]
  ) {
    const nested =
      record[key];

    if (Array.isArray(nested)) {
      return nested as T[];
    }

    if (
      typeof nested === "object" &&
      nested !== null
    ) {
      const nestedRecord =
        nested as Record<
          string,
          unknown
        >;

      for (
        const nestedKey of [
          "items",
          "candidates",
          "jobs",
          "applications",
          "results",
        ]
      ) {
        if (
          Array.isArray(
            nestedRecord[nestedKey]
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

async function fetchCollection<T>(
  path: string
): Promise<FetchResult<T>> {
  try {
    const response =
      await fetch(
        `${API_BASE_URL}${path}`,
        {
          cache: "no-store",
        }
      );

    if (!response.ok) {
      return {
        available: false,
        items: [],
      };
    }

    const data =
      await response.json();

    return {
      available: true,
      items:
        extractArray<T>(
          data
        ),
    };
  } catch {
    return {
      available: false,
      items: [],
    };
  }
}

function candidateName(
  candidate: Candidate
) {
  const firstName =
    candidate.first_name ??
    candidate.firstName ??
    "";

  const lastName =
    candidate.last_name ??
    candidate.lastName ??
    "";

  const name =
    `${firstName} ${lastName}`.trim();

  return (
    name ||
    `Υποψήφιος #${candidate.id ?? "—"}`
  );
}

function formatDate(
  value:
    | string
    | null
    | undefined
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
    }
  ).format(date);
}

function sourceLabel(
  source:
    | string
    | null
    | undefined
) {
  switch (
    source?.toLowerCase()
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
      return source || "Other";
  }
}

function getJobLevel(
  job: Job
) {
  return (
    job.target_level ??
    job.targetLevel ??
    "—"
  );
}

export default async function Home() {
  const [
    candidatesResult,
    jobsResult,
    applicationsResult,
  ] =
    await Promise.all([
      fetchCollection<Candidate>(
        "/api/candidates"
      ),

      fetchCollection<Job>(
        "/api/jobs"
      ),

      fetchCollection<Application>(
        "/api/applications"
      ),
    ]);

  const candidates =
    candidatesResult.items;

  const jobs =
    jobsResult.items;

  const applications =
    applicationsResult.items;

  const openJobs =
    jobs.filter(
      (job) =>
        job.status
          ?.toLowerCase() ===
        "open"
    );

  const recentCandidates =
    [...candidates]
      .sort(
        (
          a,
          b
        ) => {
          const dateA =
            new Date(
              a.created_at ??
                a.createdAt ??
                0
            ).getTime();

          const dateB =
            new Date(
              b.created_at ??
                b.createdAt ??
                0
            ).getTime();

          return (
            dateB -
            dateA
          );
        }
      )
      .slice(
        0,
        6
      );

  const sourceCounts =
    candidates.reduce<
      Record<
        string,
        number
      >
    >(
      (
        acc,
        candidate
      ) => {
        const key =
          sourceLabel(
            candidate.source
          );

        acc[key] =
          (
            acc[key] ??
            0
          ) + 1;

        return acc;
      },
      {}
    );

  const topSources =
    Object.entries(
      sourceCounts
    )
      .sort(
        (
          a,
          b
        ) =>
          b[1] -
          a[1]
      )
      .slice(
        0,
        5
      );

  return (
    <div>
      <div className="crm-page-header">
        <div>
          <p
            style={{
              margin: 0,
              color:
                "#275efe",
              fontSize:
                "11px",
              fontWeight: 700,
              letterSpacing:
                "0.08em",
              textTransform:
                "uppercase",
            }}
          >
            Recruitment
            Control Center
          </p>

          <h1 className="crm-page-title">
            Dashboard
          </h1>

          <p className="crm-page-description">
            Συνολική εικόνα
            υποψηφίων,
            αιτήσεων, θέσεων
            εργασίας και
            εισερχόμενων
            βιογραφικών.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <Link
            href="/candidates"
            style={{
              minHeight:
                "38px",
              display:
                "inline-flex",
              alignItems:
                "center",
              padding:
                "0 14px",
              border:
                "1px solid #e6eaf0",
              borderRadius:
                "9px",
              background:
                "#ffffff",
              fontSize:
                "12px",
              fontWeight: 650,
            }}
          >
            Υποψήφιοι
          </Link>

          <Link
            href="/upload"
            className="crm-quick-action"
          >
            + Εισαγωγή CV
          </Link>
        </div>
      </div>

      <section className="crm-stat-grid">
        <div className="crm-stat-card">
          <div className="crm-stat-label">
            Συνολικοί
            υποψήφιοι
          </div>

          <div className="crm-stat-value">
            {candidatesResult.available
              ? candidates.length
              : "—"}
          </div>

          <div className="crm-stat-meta">
            Καταχωρημένα
            προφίλ στο CRM
          </div>
        </div>

        <div className="crm-stat-card">
          <div className="crm-stat-label">
            Αιτήσεις
          </div>

          <div className="crm-stat-value">
            {applicationsResult.available
              ? applications.length
              : "—"}
          </div>

          <div className="crm-stat-meta">
            Αιτήσεις προς
            θέσεις εργασίας
          </div>
        </div>

        <div className="crm-stat-card">
          <div className="crm-stat-label">
            Ανοιχτές θέσεις
          </div>

          <div className="crm-stat-value">
            {jobsResult.available
              ? openJobs.length
              : "—"}
          </div>

          <div className="crm-stat-meta">
            Από{" "}
            {jobsResult.available
              ? jobs.length
              : "—"}{" "}
            συνολικές θέσεις
          </div>
        </div>

        <div className="crm-stat-card">
          <div className="crm-stat-label">
            Πηγές CV
          </div>

          <div className="crm-stat-value">
            {candidatesResult.available
              ? Object.keys(
                  sourceCounts
                ).length
              : "—"}
          </div>

          <div className="crm-stat-meta">
            Website, manual
            και μελλοντικά
            integrations
          </div>
        </div>
      </section>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "minmax(0, 1.6fr) minmax(280px, 0.8fr)",
          gap: "18px",
          marginTop: "18px",
        }}
      >
        <section className="crm-card">
          <div
            style={{
              display:
                "flex",
              justifyContent:
                "space-between",
              alignItems:
                "center",
              gap: "16px",
              padding:
                "18px 20px",
              borderBottom:
                "1px solid #e6eaf0",
            }}
          >
            <div>
              <div
                style={{
                  fontSize:
                    "14px",
                  fontWeight:
                    700,
                  color:
                    "#172033",
                }}
              >
                Πρόσφατοι
                υποψήφιοι
              </div>

              <div
                style={{
                  marginTop:
                    "4px",
                  color:
                    "#687386",
                  fontSize:
                    "11px",
                }}
              >
                Τελευταίες
                εγγραφές στο
                CRM
              </div>
            </div>

            <Link
              href="/candidates"
              style={{
                color:
                  "#275efe",
                fontSize:
                  "11px",
                fontWeight:
                  650,
              }}
            >
              Όλοι οι
              υποψήφιοι →
            </Link>
          </div>

          {!candidatesResult.available ? (
            <div className="crm-empty">
              <div>
                <div className="crm-empty-title">
                  Δεν υπάρχει
                  σύνδεση με το
                  Candidates API
                </div>

                <div className="crm-empty-copy">
                  Έλεγξε ότι το
                  backend τρέχει
                  στο port 4000.
                </div>
              </div>
            </div>
          ) : recentCandidates.length ===
            0 ? (
            <div className="crm-empty">
              <div>
                <div className="crm-empty-title">
                  Δεν υπάρχουν
                  ακόμη
                  υποψήφιοι
                </div>

                <div className="crm-empty-copy">
                  Ανέβασε το
                  πρώτο CV για να
                  δημιουργηθεί
                  υποψήφιος.
                </div>
              </div>
            </div>
          ) : (
            <div
              style={{
                overflowX:
                  "auto",
              }}
            >
              <table className="crm-table">
                <thead>
                  <tr>
                    <th>
                      Υποψήφιος
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
                  {recentCandidates.map(
                    (
                      candidate
                    ) => (
                      <tr
                        key={String(
                          candidate.id
                        )}
                      >
                        <td>
                          <Link
                            href={`/candidates/${candidate.id}`}
                            style={{
                              fontWeight:
                                650,
                              color:
                                "#253044",
                            }}
                          >
                            {candidateName(
                              candidate
                            )}
                          </Link>

                          {candidate.email ? (
                            <div
                              style={{
                                marginTop:
                                  "3px",
                                fontSize:
                                  "10.5px",
                                color:
                                  "#98a2b3",
                              }}
                            >
                              {
                                candidate.email
                              }
                            </div>
                          ) : null}
                        </td>

                        <td>
                          <span className="crm-badge">
                            {sourceLabel(
                              candidate.source
                            )}
                          </span>
                        </td>

                        <td>
                          <span className="crm-badge crm-badge-primary">
                            {candidate.status ??
                              "new"}
                          </span>
                        </td>

                        <td>
                          {formatDate(
                            candidate.created_at ??
                              candidate.createdAt
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="crm-card crm-card-padding">
          <div
            style={{
              fontSize:
                "14px",
              fontWeight:
                700,
              color:
                "#172033",
            }}
          >
            Πηγές
            υποψηφίων
          </div>

          <div
            style={{
              marginTop:
                "4px",
              color:
                "#687386",
              fontSize:
                "11px",
            }}
          >
            Από πού έχουν
            εισαχθεί τα CV
          </div>

          <div
            style={{
              display:
                "grid",
              gap: "11px",
              marginTop:
                "20px",
            }}
          >
            {topSources.length >
            0 ? (
              topSources.map(
                ([
                  source,
                  count,
                ]) => {
                  const percentage =
                    candidates
                      .length >
                    0
                      ? Math.round(
                          (count /
                            candidates.length) *
                            100
                        )
                      : 0;

                  return (
                    <div
                      key={
                        source
                      }
                    >
                      <div
                        style={{
                          display:
                            "flex",
                          justifyContent:
                            "space-between",
                          gap:
                            "12px",
                          fontSize:
                            "11px",
                        }}
                      >
                        <span
                          style={{
                            color:
                              "#526071",
                            fontWeight:
                              600,
                          }}
                        >
                          {
                            source
                          }
                        </span>

                        <span
                          style={{
                            color:
                              "#98a2b3",
                          }}
                        >
                          {count}
                        </span>
                      </div>

                      <div
                        style={{
                          height:
                            "6px",
                          marginTop:
                            "6px",
                          borderRadius:
                            "999px",
                          background:
                            "#edf0f4",
                          overflow:
                            "hidden",
                        }}
                      >
                        <div
                          style={{
                            height:
                              "100%",
                            width: `${percentage}%`,
                            borderRadius:
                              "999px",
                            background:
                              "#275efe",
                          }}
                        />
                      </div>
                    </div>
                  );
                }
              )
            ) : (
              <div
                style={{
                  color:
                    "#98a2b3",
                  fontSize:
                    "11px",
                }}
              >
                Δεν υπάρχουν
                ακόμη δεδομένα.
              </div>
            )}
          </div>
        </section>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(2, minmax(0, 1fr))",
          gap: "18px",
          marginTop: "18px",
        }}
      >
        <section className="crm-card">
          <div
            style={{
              display:
                "flex",
              justifyContent:
                "space-between",
              alignItems:
                "center",
              padding:
                "18px 20px",
              borderBottom:
                "1px solid #e6eaf0",
            }}
          >
            <div>
              <div
                style={{
                  fontSize:
                    "14px",
                  fontWeight:
                    700,
                }}
              >
                Ανοιχτές
                θέσεις
              </div>

              <div
                style={{
                  marginTop:
                    "4px",
                  color:
                    "#687386",
                  fontSize:
                    "11px",
                }}
              >
                Ενεργές
                ανάγκες
                στελέχωσης
              </div>
            </div>

            <Link
              href="/jobs"
              style={{
                color:
                  "#275efe",
                fontSize:
                  "11px",
                fontWeight:
                  650,
              }}
            >
              Όλες →
            </Link>
          </div>

          {openJobs.length ===
          0 ? (
            <div className="crm-empty">
              <div>
                <div className="crm-empty-title">
                  Δεν υπάρχουν
                  ανοιχτές θέσεις
                </div>

                <div className="crm-empty-copy">
                  Οι νέες θέσεις
                  θα εμφανίζονται
                  εδώ.
                </div>
              </div>
            </div>
          ) : (
            <div
              style={{
                padding:
                  "8px 20px",
              }}
            >
              {openJobs
                .slice(
                  0,
                  5
                )
                .map(
                  (
                    job
                  ) => (
                    <Link
                      key={String(
                        job.id
                      )}
                      href={`/jobs/${job.id}`}
                      style={{
                        display:
                          "flex",
                        justifyContent:
                          "space-between",
                        alignItems:
                          "center",
                        gap:
                          "16px",
                        padding:
                          "14px 0",
                        borderBottom:
                          "1px solid #edf0f4",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize:
                              "12.5px",
                            fontWeight:
                              650,
                            color:
                              "#253044",
                          }}
                        >
                          {job.title ??
                            `Job #${job.id}`}
                        </div>

                        <div
                          style={{
                            marginTop:
                              "4px",
                            color:
                              "#98a2b3",
                            fontSize:
                              "10.5px",
                          }}
                        >
                          {[
                            job.department,
                            job.location,
                          ]
                            .filter(
                              Boolean
                            )
                            .join(
                              " • "
                            ) ||
                            "Χωρίς επιπλέον στοιχεία"}
                        </div>
                      </div>

                      <span className="crm-badge crm-badge-success">
                        {getJobLevel(
                          job
                        )}
                      </span>
                    </Link>
                  )
                )}
            </div>
          )}
        </section>

        <section className="crm-card crm-card-padding">
          <div
            style={{
              fontSize:
                "14px",
              fontWeight:
                700,
            }}
          >
            Γρήγορες
            ενέργειες
          </div>

          <div
            style={{
              marginTop:
                "4px",
              color:
                "#687386",
              fontSize:
                "11px",
            }}
          >
            Συχνές
            λειτουργίες του
            recruitment team
          </div>

          <div
            style={{
              display:
                "grid",
              gap: "10px",
              marginTop:
                "18px",
            }}
          >
            <Link
              href="/upload"
              style={{
                padding:
                  "14px",
                border:
                  "1px solid #e6eaf0",
                borderRadius:
                  "10px",
                background:
                  "#f8fafc",
              }}
            >
              <div
                style={{
                  fontSize:
                    "12px",
                  fontWeight:
                    650,
                  color:
                    "#253044",
                }}
              >
                + Εισαγωγή
                νέου CV
              </div>

              <div
                style={{
                  marginTop:
                    "4px",
                  color:
                    "#98a2b3",
                  fontSize:
                    "10.5px",
                }}
              >
                Manual upload
                PDF ή DOCX
              </div>
            </Link>

            <Link
              href="/jobs"
              style={{
                padding:
                  "14px",
                border:
                  "1px solid #e6eaf0",
                borderRadius:
                  "10px",
                background:
                  "#f8fafc",
              }}
            >
              <div
                style={{
                  fontSize:
                    "12px",
                  fontWeight:
                    650,
                  color:
                    "#253044",
                }}
              >
                Διαχείριση
                θέσεων
              </div>

              <div
                style={{
                  marginTop:
                    "4px",
                  color:
                    "#98a2b3",
                  fontSize:
                    "10.5px",
                }}
              >
                Requirements,
                seniority και
                matching
              </div>
            </Link>

            <Link
              href="/candidates"
              style={{
                padding:
                  "14px",
                border:
                  "1px solid #e6eaf0",
                borderRadius:
                  "10px",
                background:
                  "#f8fafc",
              }}
            >
              <div
                style={{
                  fontSize:
                    "12px",
                  fontWeight:
                    650,
                  color:
                    "#253044",
                }}
              >
                Αναζήτηση
                υποψηφίων
              </div>

              <div
                style={{
                  marginTop:
                    "4px",
                  color:
                    "#98a2b3",
                  fontSize:
                    "10.5px",
                }}
              >
                Profiles,
                skills και
                applications
              </div>
            </Link>
          </div>
        </section>
      </div>

      <section
        className="crm-card"
        style={{
          marginTop: "18px",
        }}
      >
        <div
          style={{
            padding:
              "18px 20px",
            borderBottom:
              "1px solid #e6eaf0",
          }}
        >
          <div
            style={{
              fontSize:
                "14px",
              fontWeight:
                700,
            }}
          >
            Integrations
          </div>

          <div
            style={{
              marginTop:
                "4px",
              color:
                "#687386",
              fontSize:
                "11px",
            }}
          >
            Προετοιμασία
            εξωτερικών πηγών
            βιογραφικών
          </div>
        </div>

        <div
          style={{
            display:
              "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(140px, 1fr))",
            gap:
              "10px",
            padding:
              "18px 20px",
          }}
        >
          {[
            {
              name:
                "Website",
              status:
                "Ready",
            },
            {
              name:
                "Indeed",
              status:
                "Pending",
            },
            {
              name:
                "Jobfind",
              status:
                "Pending",
            },
            {
              name:
                "Gmail",
              status:
                "Pending",
            },
            {
              name:
                "WhatsApp",
              status:
                "Pending",
            },
            {
              name:
                "Viber",
              status:
                "Pending",
            },
          ].map(
            (
              integration
            ) => (
              <div
                key={
                  integration.name
                }
                style={{
                  padding:
                    "13px",
                  border:
                    "1px solid #e6eaf0",
                  borderRadius:
                    "10px",
                  background:
                    "#fbfcfe",
                }}
              >
                <div
                  style={{
                    fontSize:
                      "12px",
                    fontWeight:
                      650,
                  }}
                >
                  {
                    integration.name
                  }
                </div>

                <div
                  style={{
                    marginTop:
                      "7px",
                  }}
                >
                  <span
                    className={
                      integration.status ===
                      "Ready"
                        ? "crm-badge crm-badge-success"
                        : "crm-badge"
                    }
                  >
                    {
                      integration.status
                    }
                  </span>
                </div>
              </div>
            )
          )}
        </div>
      </section>
    </div>
  );
}
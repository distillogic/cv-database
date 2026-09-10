import Link from "next/link";

import {
  getCandidateProfile,
} from "@/lib/api";

function ProfileSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <h2 className="mb-5 text-xl font-semibold">
        {title}
      </h2>

      {children}
    </section>
  );
}

function EmptySection() {
  return (
    <p className="text-sm text-slate-500">
      No documented information.
    </p>
  );
}

export default async function CandidateProfilePage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } =
    await params;

  const profile =
    await getCandidateProfile(id);

  if (!profile) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto max-w-5xl px-6 py-10">

          <Link
            href="/candidates"
            className="mb-8 inline-block text-sm text-slate-400 hover:text-white"
          >
            ← Back to Candidates
          </Link>

          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900 p-12 text-center">
            <h1 className="text-2xl font-semibold">
              Professional profile not available
            </h1>

            <p className="mt-3 text-slate-400">
              This candidate does not have
              a generated professional
              profile yet.
            </p>
          </div>

        </div>
      </main>
    );
  }

  /*
   * Safe fallbacks.
   *
   * If one section is missing from the
   * API response, the page will show an
   * empty section instead of crashing.
   */
  const skills =
    profile.skills ?? [];

  const languages =
    profile.languages ?? [];

  const workExperience =
    profile.workExperience ?? [];

  const education =
    profile.education ?? [];

  const training =
    profile.training ?? [];

  const certifications =
    profile.certifications ?? [];

  const drivingLicenses =
    profile.drivingLicenses ?? [];

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">

      <div className="mx-auto max-w-6xl px-6 py-10">

        <Link
          href="/candidates"
          className="mb-8 inline-block text-sm text-slate-400 transition hover:text-white"
        >
          ← Back to Candidates
        </Link>

        {/* Header */}

        <header className="mb-10 border-b border-slate-800 pb-8">

          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-blue-400">
            Professional Profile
          </p>

          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

            <div>
              <h1 className="text-4xl font-bold">
                Candidate #{id}
              </h1>

              <p className="mt-3 text-slate-400">
                Validated professional
                information extracted
                from the candidate CV.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-3">

              <p className="text-xs uppercase text-slate-500">
                Review Status
              </p>

              <p className="mt-1 font-semibold text-blue-300">
                {profile.review_status}
              </p>

            </div>

          </div>

        </header>

        <div className="grid gap-6">

          {/* Skills */}

          <ProfileSection title="Skills">

            {skills.length === 0 ? (
              <EmptySection />
            ) : (
              <div className="flex flex-wrap gap-3">

                {skills.map(
                  (skill, index) => (
                    <div
                      key={
                        skill.id ??
                        `${skill.name}-${index}`
                      }
                      className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3"
                    >
                      <p className="font-medium">
                        {skill.name}
                      </p>

                      {skill.category && (
                        <p className="mt-1 text-xs text-slate-500">
                          {skill.category}
                        </p>
                      )}
                    </div>
                  )
                )}

              </div>
            )}

          </ProfileSection>

          {/* Languages */}

          <ProfileSection title="Languages">

            {languages.length === 0 ? (
              <EmptySection />
            ) : (
              <div className="grid gap-3 md:grid-cols-2">

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
                      className="rounded-xl border border-slate-800 bg-slate-950 p-4"
                    >

                      <p className="font-semibold">
                        {language.language}
                      </p>

                      <p className="mt-1 text-sm text-slate-400">
                        Level:{" "}
                        {language.level ??
                          "Not documented"}
                      </p>

                    </div>
                  )
                )}

              </div>
            )}

          </ProfileSection>

          {/* Work Experience */}

          <ProfileSection title="Work Experience">

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
                      className="rounded-xl border border-slate-800 bg-slate-950 p-5"
                    >

                      <h3 className="font-semibold">
                        {experience.role}
                      </h3>

                      {experience.organization && (
                        <p className="mt-1 text-sm text-slate-300">
                          {
                            experience.organization
                          }
                        </p>
                      )}

                      {experience.dates_text && (
                        <p className="mt-2 text-sm text-slate-500">
                          {
                            experience.dates_text
                          }
                        </p>
                      )}

                    </div>
                  )
                )}

              </div>
            )}

          </ProfileSection>

          {/* Education */}

          <ProfileSection title="Education">

            {education.length === 0 ? (
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
                      className="rounded-xl border border-slate-800 bg-slate-950 p-5"
                    >

                      <h3 className="font-semibold">
                        {
                          item.qualification
                        }
                      </h3>

                      {item.institution && (
                        <p className="mt-1 text-sm text-slate-300">
                          {
                            item.institution
                          }
                        </p>
                      )}

                      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">

                        {item.dates_text && (
                          <span>
                            {
                              item.dates_text
                            }
                          </span>
                        )}

                        {item.status && (
                          <span>
                            Status:{" "}
                            {
                              item.status
                            }
                          </span>
                        )}

                        {item.grade && (
                          <span>
                            Grade:{" "}
                            {
                              item.grade
                            }
                          </span>
                        )}

                      </div>

                    </div>
                  )
                )}

              </div>
            )}

          </ProfileSection>

          {/* Training */}

          <ProfileSection title="Training">

            {training.length === 0 ? (
              <EmptySection />
            ) : (
              <div className="grid gap-3 md:grid-cols-2">

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
                      className="rounded-xl border border-slate-800 bg-slate-950 p-4"
                    >

                      <p className="font-semibold">
                        {item.name}
                      </p>

                      {item.provider && (
                        <p className="mt-1 text-sm text-slate-400">
                          {
                            item.provider
                          }
                        </p>
                      )}

                    </div>
                  )
                )}

              </div>
            )}

          </ProfileSection>

          {/* Certifications */}

          <ProfileSection title="Certifications">

            {certifications.length ===
            0 ? (
              <EmptySection />
            ) : (
              <div className="grid gap-3 md:grid-cols-2">

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
                      className="rounded-xl border border-slate-800 bg-slate-950 p-4"
                    >

                      <p className="font-semibold">
                        {item.name}
                      </p>

                      {item.issuer && (
                        <p className="mt-1 text-sm text-slate-400">
                          {
                            item.issuer
                          }
                        </p>
                      )}

                    </div>
                  )
                )}

              </div>
            )}

          </ProfileSection>

          {/* Driving Licenses */}

          <ProfileSection title="Driving Licenses">

            {drivingLicenses.length ===
            0 ? (
              <EmptySection />
            ) : (
              <div className="flex flex-wrap gap-3">

                {drivingLicenses.map(
                  (
                    license,
                    index
                  ) => (
                    <div
                      key={
                        license.id ??
                        `${license.category}-${index}`
                      }
                      className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 font-semibold"
                    >
                      Category{" "}
                      {license.category}
                    </div>
                  )
                )}

              </div>
            )}

          </ProfileSection>

        </div>

        {/* Audit */}

        <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900 px-5 py-4 text-xs leading-5 text-slate-500">

          Source resume:{" "}
          {profile.source_resume_id ??
            "—"}

          {" · "}

          Analysis run:{" "}
          {profile.source_analysis_run_id ??
            "—"}

        </div>

      </div>

    </main>
  );
}
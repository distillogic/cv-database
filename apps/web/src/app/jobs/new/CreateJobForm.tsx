"use client";

import {
  useState,
  type FormEvent,
} from "react";

import {
  useRouter,
} from "next/navigation";

type RequirementType =
  | "skill"
  | "language"
  | "education"
  | "experience"
  | "certification"
  | "training"
  | "driving_license";

type RequirementImportance =
  | "required"
  | "preferred";

type RequirementForm = {
  type: RequirementType;
  name: string;
  importance:
    RequirementImportance;
  weight: string;
  minimumLevel: string;
  minimumYears: string;
  notes: string;
};

function emptyRequirement():
  RequirementForm {
  return {
    type: "skill",
    name: "",
    importance: "required",
    weight: "1",
    minimumLevel: "",
    minimumYears: "",
    notes: "",
  };
}

export default function CreateJobForm() {
  const router =
    useRouter();

  const [
    title,
    setTitle,
  ] = useState("");

  const [
    description,
    setDescription,
  ] = useState("");

  const [
    department,
    setDepartment,
  ] = useState("");

  const [
    location,
    setLocation,
  ] = useState("");

  const [
    status,
    setStatus,
  ] = useState<
    "open" |
    "paused" |
    "closed"
  >("open");

  const [
    targetLevel,
    setTargetLevel,
  ] = useState<
    "junior" |
    "senior" |
    "expert"
  >("junior");

  const [
    requirements,
    setRequirements,
  ] = useState<
    RequirementForm[]
  >([]);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null);

  function addRequirement() {
    setRequirements(
      (current) => [
        ...current,
        emptyRequirement(),
      ]
    );
  }

  function removeRequirement(
    index: number
  ) {
    setRequirements(
      (current) =>
        current.filter(
          (_, currentIndex) =>
            currentIndex !==
            index
        )
    );
  }

  function updateRequirement<
    K extends keyof RequirementForm
  >(
    index: number,
    field: K,
    value:
      RequirementForm[K]
  ) {
    setRequirements(
      (current) =>
        current.map(
          (
            requirement,
            currentIndex
          ) =>
            currentIndex ===
            index
              ? {
                  ...requirement,
                  [field]:
                    value,
                }
              : requirement
        )
    );
  }

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError(null);

    if (!title.trim()) {
      setError(
        "Job title is required."
      );
      return;
    }

    if (
      requirements.some(
        (requirement) =>
          !requirement.name.trim()
      )
    ) {
      setError(
        "Every requirement must have a name."
      );
      return;
    }

    if (
      requirements.some(
        (requirement) =>
          !Number.isFinite(
            Number(
              requirement.weight
            )
          ) ||
          Number(
            requirement.weight
          ) <= 0
      )
    ) {
      setError(
        "Every requirement must have a weight greater than 0."
      );
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        title:
          title.trim(),

        description:
          description.trim() ||
          null,

        department:
          department.trim() ||
          null,

        location:
          location.trim() ||
          null,

        status,

        targetLevel,

        requirements:
          requirements.map(
            (requirement) => ({
              type:
                requirement.type,

              name:
                requirement.name.trim(),

              importance:
                requirement.importance,

              weight:
                Number(
                  requirement.weight
                ),

              minimumLevel:
                requirement.minimumLevel
                  .trim() ||
                null,

              minimumYears:
                requirement.minimumYears
                  .trim()
                  ? Number(
                      requirement
                        .minimumYears
                    )
                  : null,

              notes:
                requirement.notes
                  .trim() ||
                null,
            })
          ),
      };

      const response =
        await fetch(
          "/api/jobs",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                payload
              ),
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        console.error(
          result
        );

        setError(
          result.error ??
            "Failed to create job."
        );

        return;
      }

      router.push("/jobs");
      router.refresh();
    } catch (submitError) {
      console.error(
        submitError
      );

      setError(
        "Could not connect to the server."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-8"
    >
      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="mb-6 text-xl font-semibold">
          Job Information
        </h2>

        <div className="grid gap-6 md:grid-cols-2">
          <label className="md:col-span-2">
            <span className="mb-2 block text-sm text-slate-400">
              Job Title *
            </span>

            <input
              value={title}
              onChange={(event) =>
                setTitle(
                  event.target.value
                )
              }
              placeholder="e.g. Sales Representative"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
            />
          </label>

          <label>
            <span className="mb-2 block text-sm text-slate-400">
              Department
            </span>

            <input
              value={department}
              onChange={(event) =>
                setDepartment(
                  event.target.value
                )
              }
              placeholder="e.g. Sales"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
            />
          </label>

          <label>
            <span className="mb-2 block text-sm text-slate-400">
              Location
            </span>

            <input
              value={location}
              onChange={(event) =>
                setLocation(
                  event.target.value
                )
              }
              placeholder="e.g. Patras"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
            />
          </label>

          <label>
            <span className="mb-2 block text-sm text-slate-400">
              Target Level
            </span>

            <select
              value={targetLevel}
              onChange={(event) =>
                setTargetLevel(
                  event.target
                    .value as
                    | "junior"
                    | "senior"
                    | "expert"
                )
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3"
            >
              <option value="junior">
                Junior
              </option>

              <option value="senior">
                Senior
              </option>

              <option value="expert">
                Expert
              </option>
            </select>
          </label>

          <label>
            <span className="mb-2 block text-sm text-slate-400">
              Status
            </span>

            <select
              value={status}
              onChange={(event) =>
                setStatus(
                  event.target
                    .value as
                    | "open"
                    | "paused"
                    | "closed"
                )
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3"
            >
              <option value="open">
                Open
              </option>

              <option value="paused">
                Paused
              </option>

              <option value="closed">
                Closed
              </option>
            </select>
          </label>

          <label className="md:col-span-2">
            <span className="mb-2 block text-sm text-slate-400">
              Description
            </span>

            <textarea
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value
                )
              }
              rows={5}
              placeholder="Describe the position..."
              className="w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">
              Requirements
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Add the professional
              criteria for this job.
            </p>
          </div>

          <button
            type="button"
            onClick={
              addRequirement
            }
            className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold hover:bg-slate-700"
          >
            + Add Requirement
          </button>
        </div>

        {requirements.length ===
        0 ? (
          <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-500">
            No requirements added yet.
          </div>
        ) : (
          <div className="space-y-5">
            {requirements.map(
              (
                requirement,
                index
              ) => (
                <div
                  key={index}
                  className="rounded-xl border border-slate-800 bg-slate-950 p-5"
                >
                  <div className="mb-5 flex items-center justify-between">
                    <h3 className="font-semibold">
                      Requirement #
                      {index + 1}
                    </h3>

                    <button
                      type="button"
                      onClick={() =>
                        removeRequirement(
                          index
                        )
                      }
                      className="text-sm text-red-400 hover:text-red-300"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                    <label>
                      <span className="mb-2 block text-sm text-slate-400">
                        Type
                      </span>

                      <select
                        value={
                          requirement.type
                        }
                        onChange={(
                          event
                        ) =>
                          updateRequirement(
                            index,
                            "type",
                            event.target
                              .value as RequirementType
                          )
                        }
                        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3"
                      >
                        <option value="skill">
                          Skill
                        </option>

                        <option value="language">
                          Language
                        </option>

                        <option value="education">
                          Education
                        </option>

                        <option value="experience">
                          Experience
                        </option>

                        <option value="certification">
                          Certification
                        </option>

                        <option value="training">
                          Training
                        </option>

                        <option value="driving_license">
                          Driving License
                        </option>
                      </select>
                    </label>

                    <label className="lg:col-span-2">
                      <span className="mb-2 block text-sm text-slate-400">
                        Requirement *
                      </span>

                      <input
                        value={
                          requirement.name
                        }
                        onChange={(
                          event
                        ) =>
                          updateRequirement(
                            index,
                            "name",
                            event.target
                              .value
                          )
                        }
                        placeholder="e.g. Python, English, Customer Service"
                        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3"
                      />
                    </label>

                    <label>
                      <span className="mb-2 block text-sm text-slate-400">
                        Importance
                      </span>

                      <select
                        value={
                          requirement.importance
                        }
                        onChange={(
                          event
                        ) =>
                          updateRequirement(
                            index,
                            "importance",
                            event.target
                              .value as RequirementImportance
                          )
                        }
                        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3"
                      >
                        <option value="required">
                          Required
                        </option>

                        <option value="preferred">
                          Preferred
                        </option>
                      </select>
                    </label>

                    <label>
                      <span className="mb-2 block text-sm text-slate-400">
                        Weight
                      </span>

                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={
                          requirement.weight
                        }
                        onChange={(
                          event
                        ) =>
                          updateRequirement(
                            index,
                            "weight",
                            event.target
                              .value
                          )
                        }
                        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3"
                      />
                    </label>

                    <label>
                      <span className="mb-2 block text-sm text-slate-400">
                        Minimum Level
                      </span>

                      <input
                        value={
                          requirement.minimumLevel
                        }
                        onChange={(
                          event
                        ) =>
                          updateRequirement(
                            index,
                            "minimumLevel",
                            event.target
                              .value
                          )
                        }
                        placeholder="e.g. B2"
                        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3"
                      />
                    </label>

                    <label>
                      <span className="mb-2 block text-sm text-slate-400">
                        Minimum Years
                      </span>

                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={
                          requirement.minimumYears
                        }
                        onChange={(
                          event
                        ) =>
                          updateRequirement(
                            index,
                            "minimumYears",
                            event.target
                              .value
                          )
                        }
                        placeholder="e.g. 2"
                        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3"
                      />
                    </label>

                    <label className="md:col-span-2">
                      <span className="mb-2 block text-sm text-slate-400">
                        Notes
                      </span>

                      <input
                        value={
                          requirement.notes
                        }
                        onChange={(
                          event
                        ) =>
                          updateRequirement(
                            index,
                            "notes",
                            event.target
                              .value
                          )
                        }
                        placeholder="Optional notes"
                        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3"
                      />
                    </label>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </section>

      {error && (
        <div className="rounded-xl border border-red-900 bg-red-950/50 px-5 py-4 text-red-300">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={() =>
            router.push(
              "/jobs"
            )
          }
          className="rounded-xl border border-slate-700 px-6 py-3 font-semibold hover:bg-slate-900"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={
            submitting
          }
          className="rounded-xl bg-blue-600 px-8 py-3 font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting
            ? "Saving..."
            : "Create Job"}
        </button>
      </div>
    </form>
  );
}
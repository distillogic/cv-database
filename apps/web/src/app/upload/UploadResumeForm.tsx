"use client";

import {
  useState,
  type FormEvent,
} from "react";

import Link
  from "next/link";

type UploadStatus =
  | "idle"
  | "creating"
  | "uploading"
  | "processing"
  | "completed";

type CreateCandidateResponse = {
  data?: {
    id?:
      | string
      | number;
  };

  id?:
    | string
    | number;

  error?: string;
};

function findCandidateId(
  result:
    CreateCandidateResponse
): string | null {
  if (
    result.data?.id !==
    undefined
  ) {
    return String(
      result.data.id
    );
  }

  if (
    result.id !==
    undefined
  ) {
    return String(
      result.id
    );
  }

  return null;
}

export default function UploadResumeForm() {
  const [
    firstName,
    setFirstName,
  ] = useState("");

  const [
    lastName,
    setLastName,
  ] = useState("");

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    phone,
    setPhone,
  ] = useState("");

  const [
    location,
    setLocation,
  ] = useState("");

  const [
    source,
    setSource,
  ] = useState(
    "manual"
  );

  const [
    file,
    setFile,
  ] = useState<
    File | null
  >(null);

  const [
    status,
    setStatus,
  ] = useState<
    UploadStatus
  >("idle");

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null);

  const [
    completedCandidateId,
    setCompletedCandidateId,
  ] = useState<
    string | null
  >(null);

  const [
    scoredJobs,
    setScoredJobs,
  ] = useState(0);

  const locked =
    status !== "idle";

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError(null);

    setCompletedCandidateId(
      null
    );

    setScoredJobs(0);

    if (
      !firstName.trim()
    ) {
      setError(
        "First name is required."
      );

      return;
    }

    if (
      !lastName.trim()
    ) {
      setError(
        "Last name is required."
      );

      return;
    }

    if (!file) {
      setError(
        "Select a PDF or DOCX CV."
      );

      return;
    }

    try {
      /**
       * --------------------------------
       * 1. CREATE CANDIDATE
       * --------------------------------
       */
      setStatus(
        "creating"
      );

      const candidateResponse =
        await fetch(
          "/api/candidates",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                firstName:
                  firstName.trim(),

                lastName:
                  lastName.trim(),

                email:
                  email.trim() ||
                  null,

                phone:
                  phone.trim() ||
                  null,

                location:
                  location.trim() ||
                  null,

                status:
                  "new",

                source,
              }),
          }
        );

      const candidateResult =
        (await candidateResponse.json()) as
          CreateCandidateResponse;

      if (
        !candidateResponse.ok
      ) {
        throw new Error(
          candidateResult.error ??
            "Candidate creation failed."
        );
      }

      const candidateId =
        findCandidateId(
          candidateResult
        );

      if (!candidateId) {
        console.error(
          candidateResult
        );

        throw new Error(
          "Candidate was created but no candidate ID was returned."
        );
      }

      /**
       * --------------------------------
       * 2. UPLOAD CV
       * --------------------------------
       */
      setStatus(
        "uploading"
      );

      const formData =
        new FormData();

      formData.append(
        "candidateId",
        candidateId
      );

      formData.append(
        "resume",
        file
      );

      const uploadResponse =
        await fetch(
          "/api/resumes/upload",
          {
            method:
              "POST",

            body:
              formData,
          }
        );

      const uploadResult =
        await uploadResponse.json();

      if (
        !uploadResponse.ok
      ) {
        throw new Error(
          uploadResult.error ??
            "CV upload failed."
        );
      }

      const resumeId =
        uploadResult.resumeId;

      if (!resumeId) {
        console.error(
          uploadResult
        );

        throw new Error(
          "CV was uploaded but no resume ID was returned."
        );
      }

      /**
       * --------------------------------
       * 3. PROCESS CV
       * --------------------------------
       */
      setStatus(
        "processing"
      );

      const processResponse =
        await fetch(
          `/api/resumes/${resumeId}/process`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                candidateId,
              }),
          }
        );

      const processResult =
        await processResponse.json();

      if (
        !processResponse.ok
      ) {
        throw new Error(
          processResult.error ??
            "CV processing failed."
        );
      }

      setScoredJobs(
        Number(
          processResult.data
            ?.scoredJobs ??
            0
        )
      );

      setCompletedCandidateId(
        candidateId
      );

      setStatus(
        "completed"
      );
    } catch (submitError) {
      console.error(
        submitError
      );

      setError(
        submitError instanceof
          Error
          ? submitError.message
          : "Something went wrong."
      );

      setStatus(
        "idle"
      );
    }
  }

  return (
    <form
      onSubmit={
        handleSubmit
      }
      className="space-y-8"
    >

      {/* Candidate information */}

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

        <h2 className="mb-6 text-xl font-semibold">
          Candidate
          Information
        </h2>

        <div className="grid gap-6 md:grid-cols-2">

          <label>
            <span className="mb-2 block text-sm text-slate-400">
              First Name *
            </span>

            <input
              value={
                firstName
              }
              onChange={(
                event
              ) =>
                setFirstName(
                  event.target
                    .value
                )
              }
              disabled={
                locked
              }
              placeholder="First name"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500 disabled:opacity-50"
            />
          </label>

          <label>
            <span className="mb-2 block text-sm text-slate-400">
              Last Name *
            </span>

            <input
              value={
                lastName
              }
              onChange={(
                event
              ) =>
                setLastName(
                  event.target
                    .value
                )
              }
              disabled={
                locked
              }
              placeholder="Last name"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500 disabled:opacity-50"
            />
          </label>

          <label>
            <span className="mb-2 block text-sm text-slate-400">
              Email
            </span>

            <input
              type="email"
              value={
                email
              }
              onChange={(
                event
              ) =>
                setEmail(
                  event.target
                    .value
                )
              }
              disabled={
                locked
              }
              placeholder="candidate@example.com"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500 disabled:opacity-50"
            />
          </label>

          <label>
            <span className="mb-2 block text-sm text-slate-400">
              Phone
            </span>

            <input
              value={
                phone
              }
              onChange={(
                event
              ) =>
                setPhone(
                  event.target
                    .value
                )
              }
              disabled={
                locked
              }
              placeholder="Phone number"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500 disabled:opacity-50"
            />
          </label>

          <label>
            <span className="mb-2 block text-sm text-slate-400">
              Location
            </span>

            <input
              value={
                location
              }
              onChange={(
                event
              ) =>
                setLocation(
                  event.target
                    .value
                )
              }
              disabled={
                locked
              }
              placeholder="e.g. Patras"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500 disabled:opacity-50"
            />
          </label>

          <label>
            <span className="mb-2 block text-sm text-slate-400">
              Source
            </span>

            <select
              value={
                source
              }
              onChange={(
                event
              ) =>
                setSource(
                  event.target
                    .value
                )
              }
              disabled={
                locked
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 disabled:opacity-50"
            >
              <option value="manual">
                Manual
              </option>

              <option value="wordpress">
                WordPress
              </option>

              <option value="indeed">
                Indeed
              </option>

              <option value="jobfind">
                Jobfind
              </option>

              <option value="other">
                Other
              </option>
            </select>
          </label>

        </div>

      </section>

      {/* Resume */}

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

        <h2 className="mb-2 text-xl font-semibold">
          Candidate CV
        </h2>

        <p className="mb-6 text-sm text-slate-400">
          Upload the CV that belongs
          to this candidate.
        </p>

        <input
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          disabled={
            locked
          }
          onChange={(
            event
          ) =>
            setFile(
              event.target
                .files?.[0] ??
                null
            )
          }
          className="block w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-4 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:font-semibold file:text-white disabled:opacity-50"
        />

        <p className="mt-3 text-xs text-slate-500">
          PDF or DOCX, maximum
          10 MB.
        </p>

      </section>

      {/* Progress */}

      {status !== "idle" && (
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

          <h2 className="mb-5 text-xl font-semibold">
            Processing
          </h2>

          <div className="space-y-4 text-sm">

            <div className="flex items-center gap-3">

              <span>
                {status ===
                  "creating"
                  ? "⏳"
                  : "✅"}
              </span>

              <span>
                Create Candidate
              </span>

            </div>

            <div className="flex items-center gap-3">

              <span>
                {status ===
                  "uploading"
                  ? "⏳"
                  : status ===
                      "creating"
                    ? "○"
                    : "✅"}
              </span>

              <span>
                Upload CV
              </span>

            </div>

            <div className="flex items-center gap-3">

              <span>
                {status ===
                  "processing"
                  ? "⏳"
                  : status ===
                      "completed"
                    ? "✅"
                    : "○"}
              </span>

              <span>
                Extract CV text
              </span>

            </div>

            <div className="flex items-center gap-3">

              <span>
                {status ===
                  "processing"
                  ? "⏳"
                  : status ===
                      "completed"
                    ? "✅"
                    : "○"}
              </span>

              <span>
                Sanitize CV
              </span>

            </div>

            <div className="flex items-center gap-3">

              <span>
                {status ===
                  "processing"
                  ? "⏳"
                  : status ===
                      "completed"
                    ? "✅"
                    : "○"}
              </span>

              <span>
                Local AI analysis
              </span>

            </div>

            <div className="flex items-center gap-3">

              <span>
                {status ===
                  "processing"
                  ? "⏳"
                  : status ===
                      "completed"
                    ? "✅"
                    : "○"}
              </span>

              <span>
                Build professional
                profile
              </span>

            </div>

            <div className="flex items-center gap-3">

              <span>
                {status ===
                  "processing"
                  ? "⏳"
                  : status ===
                      "completed"
                    ? "✅"
                    : "○"}
              </span>

              <span>
                Calculate job matches
              </span>

            </div>

          </div>

          {status ===
            "processing" && (
            <p className="mt-6 text-sm text-blue-300">
              The local AI is
              processing the CV.
              This can take around
              30–60 seconds.
            </p>
          )}

        </section>
      )}

      {/* Error */}

      {error && (
        <div className="rounded-xl border border-red-900 bg-red-950/40 p-5 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Success */}

      {status ===
        "completed" &&
        completedCandidateId && (

        <section className="rounded-2xl border border-emerald-900 bg-emerald-950/30 p-6">

          <h2 className="text-xl font-semibold text-emerald-300">
            Candidate created successfully
          </h2>

          <p className="mt-2 text-sm text-slate-300">
            The CV was processed and
            the professional profile
            was generated.
          </p>

          <p className="mt-2 text-sm text-slate-400">
            Job matches calculated:{" "}
            <strong className="text-slate-200">
              {scoredJobs}
            </strong>
          </p>

          <div className="mt-6 flex flex-wrap gap-3">

            <Link
              href={`/candidates/${completedCandidateId}`}
              className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
            >
              View Candidate Profile
            </Link>

            <Link
              href="/jobs"
              className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold transition hover:bg-slate-900"
            >
              View Job Rankings
            </Link>

          </div>

        </section>

      )}

      {/* Submit */}

      {status !==
        "completed" && (

        <button
          type="submit"
          disabled={
            status !==
              "idle"
          }
          className="w-full rounded-xl bg-blue-600 px-6 py-4 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === "idle" &&
            "Create Candidate & Process CV"}

          {status ===
            "creating" &&
            "Creating Candidate..."}

          {status ===
            "uploading" &&
            "Uploading CV..."}

          {status ===
            "processing" &&
            "Processing CV..."}
        </button>

      )}

    </form>
  );
}
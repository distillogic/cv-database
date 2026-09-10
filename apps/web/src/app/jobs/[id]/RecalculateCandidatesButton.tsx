"use client";

import {
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

export default function RecalculateCandidatesButton({
  jobId,
}: {
  jobId: string;
}) {
  const router =
    useRouter();

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState<
    string | null
  >(null);

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null);

  async function recalculate() {
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const response =
        await fetch(
          `/api/jobs/${jobId}/score-all`,
          {
            method: "POST",
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        setError(
          result.error ??
            "Failed to recalculate candidates."
        );

        return;
      }

      const scoredCount =
        result.data
          ?.scoredCount ?? 0;

      const failedCount =
        result.data
          ?.failedCount ?? 0;

      setMessage(
        `${scoredCount} candidate(s) scored${
          failedCount > 0
            ? `, ${failedCount} failed`
            : ""
        }.`
      );

      router.refresh();
    } catch (requestError) {
      console.error(
        requestError
      );

      setError(
        "Could not connect to the server."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={recalculate}
        disabled={loading}
        className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading
          ? "Recalculating..."
          : "Recalculate Candidates"}
      </button>

      {message && (
        <p className="mt-2 text-xs text-emerald-400">
          {message}
        </p>
      )}

      {error && (
        <p className="mt-2 text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
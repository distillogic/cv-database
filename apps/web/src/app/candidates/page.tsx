import CandidateDirectory from "./candidate-directory";

import {
  getCandidates,
} from "@/lib/api";

export default async function CandidatesPage() {
  const candidates =
    await getCandidates();

  const preparedCandidates =
    candidates.map(
      (candidate) => ({
        id:
          String(
            candidate.id
          ),

        firstName:
          candidate.first_name ??
          "",

        lastName:
          candidate.last_name ??
          "",

        email:
          candidate.email ??
          null,

        phone:
          candidate.phone ??
          null,

        location:
          candidate.location ??
          null,

        source:
          candidate.source ??
          "other",

        status:
          candidate.status ??
          "new",

        createdAt:
          candidate.created_at ??
          null,
      })
    );

  return (
    <CandidateDirectory
      candidates={
        preparedCandidates
      }
    />
  );
}
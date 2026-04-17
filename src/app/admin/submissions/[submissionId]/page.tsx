import { notFound } from "next/navigation";

import { SubmissionDetailView } from "@/components/admin/submission-detail-view";
import { AppError } from "@/server/http/app-error";
import { getAdminSubmissionDetail } from "@/server/services/submission-service";

type RouteContext = {
  params: Promise<{ submissionId: string }>;
};

export default async function AdminSubmissionDetailPage({
  params,
}: RouteContext) {
  const { submissionId } = await params;
  const submission = await getAdminSubmissionDetail(submissionId).catch((error) => {
    if (error instanceof AppError && error.statusCode === 404) {
      notFound();
    }

    throw error;
  });

  return <SubmissionDetailView submission={submission} />;
}

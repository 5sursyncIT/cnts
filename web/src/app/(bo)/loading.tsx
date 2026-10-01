import { Card, LoadingState } from "@/components/ui";

export default function BackOfficeLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-56 animate-pulse rounded-lg bg-gray-200" />
      <Card>
        <LoadingState rows={6} />
      </Card>
    </div>
  );
}

import { PageSkeleton } from "@/components/shared/Skeletons"
import { DashboardLayout } from "@/components/layout/DashboardLayout"

export default function Loading() {
    return (
        <DashboardLayout>
            <PageSkeleton />
        </DashboardLayout>
    )
}

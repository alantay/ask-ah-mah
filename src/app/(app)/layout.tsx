import { AppSidebar } from "@/features/shared/components/AppSidebar";
import { MobileTopBar } from "@/features/shared/components/MobileTopBar";
import { Suspense } from "react";

// The app shell — sidebar + mobile top bar — wraps every route except public
// ones (e.g. shared recipe links under /r), which sit outside this group.
export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="mx-0 mt-0 sm:mx-2 sm:mt-2 md:mx-4 md:mt-4 lg:mx-0 lg:mt-0 flex h-dvh overflow-hidden">
      <Suspense fallback={null}>
        <AppSidebar />
      </Suspense>
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <Suspense fallback={null}>
          <MobileTopBar />
        </Suspense>
        {children}
      </div>
    </div>
  );
}

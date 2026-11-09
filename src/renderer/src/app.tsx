import { useRef, useState } from 'react';

import { ContentAdminPage } from '@/features/admin/content-admin-page';
import { ContentProvider } from '@/features/content/content-provider';
import { EnrollmentPage } from '@/features/enrollment/enrollment-page';
import { GradesPage } from '@/features/grades/grades-page';
import { HomePage } from '@/features/home/home-page';
import { ComingSoonPage } from '@/features/placeholder/coming-soon-page';
import { PrerequisitesPage } from '@/features/prerequisites/prerequisites-page';
import { AppSidebar } from '@/features/shell/app-sidebar';
import { TopBar } from '@/features/shell/top-bar';
import { findNavItem } from '@/lib/navigation';
import type { PageId } from '@shared/content/pages';

function CurrentPage({ page, onNavigate }: { page: PageId; onNavigate: (page: PageId) => void }) {
  switch (page) {
    case 'home':
      return <HomePage onNavigate={onNavigate} />;
    case 'enrollment':
      return <EnrollmentPage />;
    case 'prerequisites':
      return <PrerequisitesPage />;
    case 'grades':
      return <GradesPage />;
    case 'content-admin':
      return <ContentAdminPage />;
    default:
      return <ComingSoonPage item={findNavItem(page)} />;
  }
}

export function App() {
  const [page, setPage] = useState<PageId>('home');
  const mainRef = useRef<HTMLElement>(null);

  function navigate(next: PageId) {
    setPage(next);
    mainRef.current?.scrollTo({ top: 0 });
  }

  return (
    <ContentProvider>
      <div className="flex h-screen overflow-hidden">
        <AppSidebar current={page} onNavigate={navigate} />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar onNavigate={navigate} />
          <main ref={mainRef} className="flex-1 overflow-y-auto px-10 py-8">
            <div className="mx-auto max-w-6xl">
              <CurrentPage key={page} page={page} onNavigate={navigate} />
            </div>
          </main>
        </div>
      </div>
    </ContentProvider>
  );
}

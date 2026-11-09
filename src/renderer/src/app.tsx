import { useRef, useState } from 'react';

import { ContentAdminPage } from '@/features/admin/content-admin-page';
import { ArticlePage } from '@/features/article/article-page';
import { CalendarPage } from '@/features/calendar/calendar-page';
import { ContentProvider } from '@/features/content/content-provider';
import { DirectoryPage } from '@/features/directory/directory-page';
import { EnrollmentPage } from '@/features/enrollment/enrollment-page';
import { FaqPage } from '@/features/faq/faq-page';
import { GradesPage } from '@/features/grades/grades-page';
import { HomePage } from '@/features/home/home-page';
import { PrerequisitesPage } from '@/features/prerequisites/prerequisites-page';
import { AppSidebar } from '@/features/shell/app-sidebar';
import { TopBar } from '@/features/shell/top-bar';
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
    case 'saia-first-login':
      return <ArticlePage articleKey="saiaFirstLogin" />;
    case 'procedures':
      return <ArticlePage articleKey="procedures" />;
    case 'summer':
      return <ArticlePage articleKey="summer" />;
    case 'rules':
      return <ArticlePage articleKey="rules" />;
    case 'teacher-onboarding':
      return <ArticlePage articleKey="teacherOnboarding" />;
    case 'teacher-calendar':
      return <CalendarPage />;
    case 'teacher-saia':
      return <ArticlePage articleKey="teacherSaia" />;
    case 'teacher-procedures':
      return <ArticlePage articleKey="teacherProcedures" />;
    case 'faq':
      return <FaqPage />;
    case 'directory':
      return <DirectoryPage />;
    case 'content-admin':
      return <ContentAdminPage />;
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

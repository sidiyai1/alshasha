import { lazy, Suspense, useEffect } from 'react'
import { createBrowserRouter, Outlet, RouterProvider, ScrollRestoration, useLocation } from 'react-router-dom'
import { AdminLayout } from './components/AdminLayout.tsx'
import { ProtectedRoute } from './components/ProtectedRoute.tsx'
import { PublicLayout } from './components/PublicLayout.tsx'
import { FullScreenStatus } from './components/ui.tsx'
import { AuthProvider } from './context/AuthContext.tsx'
import { ToastProvider } from './context/ToastContext.tsx'
import { AboutPage } from './pages/AboutPage.tsx'
import { ArticlePage } from './pages/ArticlePage.tsx'
import { CategoryPage } from './pages/CategoryPage.tsx'
import { ContactPage } from './pages/ContactPage.tsx'
import { HomePage } from './pages/HomePage.tsx'
import { NotFoundPage } from './pages/NotFoundPage.tsx'
import { SearchPage } from './pages/SearchPage.tsx'
import { ArchivePage } from './pages/ArchivePage.tsx'

const LoginPage = lazy(() => import('./pages/admin/LoginPage.tsx').then((module) => ({ default: module.LoginPage })))
const DashboardPage = lazy(() => import('./pages/admin/DashboardPage.tsx').then((module) => ({ default: module.DashboardPage })))
const ArticlesPage = lazy(() => import('./pages/admin/ArticlesPage.tsx').then((module) => ({ default: module.ArticlesPage })))
const ArticleEditorPage = lazy(() => import('./pages/admin/ArticleEditorPage.tsx').then((module) => ({ default: module.ArticleEditorPage })))
const EditionsPage = lazy(() => import('./pages/admin/EditionsPage.tsx').then((module) => ({ default: module.EditionsPage })))
const EditionEditorPage = lazy(() => import('./pages/admin/EditionEditorPage.tsx').then((module) => ({ default: module.EditionEditorPage })))
const CategoriesPage = lazy(() => import('./pages/admin/CategoriesPage.tsx').then((module) => ({ default: module.CategoriesPage })))
const SettingsPage = lazy(() => import('./pages/admin/SettingsPage.tsx').then((module) => ({ default: module.SettingsPage })))
const MessagesPage = lazy(() => import('./pages/admin/MessagesPage.tsx').then((module) => ({ default: module.MessagesPage })))
const ArchiveReaderPage = lazy(() => import('./pages/ArchiveReaderPage.tsx').then((module) => ({ default: module.ArchiveReaderPage })))

function Root() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return (
    <Suspense fallback={<FullScreenStatus label="جارٍ التحميل" />}>
      <Outlet />
      <ScrollRestoration />
    </Suspense>
  )
}

const router = createBrowserRouter([
  {
    element: <Root />,
    children: [
      {
        element: <PublicLayout />,
        children: [
          { index: true, element: <HomePage /> },
          { path: 'category/:slug', element: <CategoryPage /> },
          { path: 'article/:slug', element: <ArticlePage /> },
          { path: 'archive', element: <ArchivePage /> },
          { path: 'archive/:id', element: <ArchiveReaderPage /> },
          { path: 'search', element: <SearchPage /> },
          { path: 'about', element: <AboutPage /> },
          { path: 'contact', element: <ContactPage /> },
        ],
      },
      { path: 'admin/login', element: <LoginPage /> },
      {
        path: 'admin',
        element: <ProtectedRoute />,
        children: [
          {
            element: <AdminLayout />,
            children: [
              { index: true, element: <DashboardPage /> },
              { path: 'articles', element: <ArticlesPage /> },
              { path: 'articles/new', element: <ArticleEditorPage /> },
              { path: 'articles/:id', element: <ArticleEditorPage /> },
              { path: 'archives', element: <EditionsPage /> },
              { path: 'archives/new', element: <EditionEditorPage /> },
              { path: 'archives/:id', element: <EditionEditorPage /> },
              { path: 'editions', element: <EditionsPage /> },
              { path: 'editions/new', element: <EditionEditorPage /> },
              { path: 'editions/:id', element: <EditionEditorPage /> },
              { path: 'categories', element: <CategoriesPage /> },
              { path: 'settings', element: <SettingsPage /> },
              { path: 'messages', element: <MessagesPage /> },
            ],
          },
        ],
      },
      {
        path: '*',
        element: <PublicLayout />,
        children: [{ path: '*', element: <NotFoundPage /> }],
      },
    ],
  },
])

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </AuthProvider>
  )
}

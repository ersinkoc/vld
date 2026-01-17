import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from '@/hooks/use-theme'
import { Layout } from '@/components/layout/layout'

// Lazy load pages for code-splitting
const HomePage = lazy(() => import('@/pages/home').then(m => ({ default: m.HomePage })))
const DocsPage = lazy(() => import('@/pages/docs').then(m => ({ default: m.DocsPage })))
const ApiPage = lazy(() => import('@/pages/api').then(m => ({ default: m.ApiPage })))
const ExamplesPage = lazy(() => import('@/pages/examples').then(m => ({ default: m.ExamplesPage })))
const PlaygroundPage = lazy(() => import('@/pages/playground').then(m => ({ default: m.PlaygroundPage })))
const BenchmarkPage = lazy(() => import('@/pages/benchmark').then(m => ({ default: m.BenchmarkPage })))

// Loading fallback component
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  )
}

// Custom domain (vld.oxog.dev) uses root path, no subpath needed
const basename = '/'

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vld-theme">
      <BrowserRouter basename={basename}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="docs" element={<DocsPage />} />
              <Route path="api" element={<ApiPage />} />
              <Route path="examples" element={<ExamplesPage />} />
              <Route path="playground" element={<PlaygroundPage />} />
              <Route path="benchmark" element={<BenchmarkPage />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App

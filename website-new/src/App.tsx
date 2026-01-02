import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from '@/hooks/use-theme'
import { Layout } from '@/components/layout/layout'
import { HomePage } from '@/pages/home'
import { DocsPage } from '@/pages/docs'
import { ApiPage } from '@/pages/api'
import { ExamplesPage } from '@/pages/examples'
import { PlaygroundPage } from '@/pages/playground'
import { BenchmarkPage } from '@/pages/benchmark'

// Custom domain (vld.oxog.dev) uses root path, no subpath needed
const basename = '/'

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vld-theme">
      <BrowserRouter basename={basename}>
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
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App

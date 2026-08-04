import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import HomePage from './pages/HomePage';
import CategoryPage from './pages/CategoryPage';
import RecipePage from './pages/RecipePage';
import PageWrapper from './components/PageWrapper';
import SearchResultsPage from './pages/SearchResultsPage';
import AdminPage from './pages/AdminPage';
import logo from './assets/logo.png';

function App() {
  const location = useLocation();

  return (
    <div className="layout-wrapper">
      <header className="site-header">
        <Link to="/">
          <img src={logo} alt="Mama Kugler Logo" className="site-logo" />
        </Link>
      </header>

      <AnimatePresence mode="wait">
        <main className="main-content">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PageWrapper><HomePage /></PageWrapper>} />
            <Route path="/category/:categoryName" element={<PageWrapper><CategoryPage /></PageWrapper>} />
            <Route path="/recipe/:recipeId" element={<PageWrapper><RecipePage /></PageWrapper>} />
            <Route path="/search/:searchTerm" element={<PageWrapper><SearchResultsPage /></PageWrapper>} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </main>
      </AnimatePresence>

      <footer className="site-footer">
        <p>© {new Date().getFullYear()} Mama Kugler. כל הזכויות שמורות.</p>
      </footer>
    </div>
  );
}

export default App;

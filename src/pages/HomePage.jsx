import '../styles/HomePage.css'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'

export default function HomePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const categories = t('categories', { returnObjects: true });
  const [searchTerm, setSearchTerm] = useState('');

  const handleCategoryClick = (categoryKey) => {
    navigate(`/category/${categoryKey}`);
  };

  const handleSearch = () => {
    if (searchTerm.trim() !== '') {
      navigate(`/search/${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <div className="home-container">
      <h1>{t('welcome_message')}</h1>

      <div className="search-container">
        <input
          type="text"
          placeholder={t('search.placeholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearch();
            }
          }}
          className="search-input"
        />
        <button onClick={handleSearch} className="search-button">
          {t('search.button')}
        </button>
      </div>

      <div className="category-buttons">
      {Object.entries(categories).map(([key, label]) => (
          <button
            key={key}
            onClick={() => handleCategoryClick(key)}
            className="category-button"
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

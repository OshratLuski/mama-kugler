import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { db } from '../firebase/firebase'
import { collection, getDocs } from 'firebase/firestore'
import { useTranslation } from 'react-i18next'
import '../styles/SearchResultsPage.css'
import '../styles/CategoryPage.css'

export default function SearchResultsPage() {
  const { searchTerm } = useParams();
  const [recipes, setRecipes] = useState([]);
  const [filteredRecipes, setFilteredRecipes] = useState([]);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    // Fetch all recipes
    const fetchRecipes = async () => {
      const snapshot = await getDocs(collection(db, "recipes"));
      const recipeList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRecipes(recipeList);
    };

    fetchRecipes();
  }, []);

  useEffect(() => {
    if (recipes.length > 0) {
      const trimmedTerm = searchTerm.trim();
      const filtered = recipes.filter(recipe =>
        recipe.title.includes(trimmedTerm) ||
        recipe.ingredients.some(ingredient => ingredient.includes(trimmedTerm))
      );
      setFilteredRecipes(filtered);
    }
  }, [recipes, searchTerm]);

  const handleRecipeClick = (id) => {
    navigate(`/recipe/${id}`);
  };

  return (
    <div className="search-results-container">
      <h1>
        {t('search_results.title')}: <span className="highlight">{searchTerm}</span>
      </h1>

      <ul className="recipe-list">
        {filteredRecipes.length > 0 ? (
          filteredRecipes.map(recipe => (
            <li
              key={recipe.id}
              className="recipe-item"
              onClick={() => handleRecipeClick(recipe.id)}
            >
              {recipe.title}
            </li>
          ))
        ) : (
          <li className="no-results">{t('search_results.no_results')}</li>
        )}
      </ul>
    </div>
  );
}

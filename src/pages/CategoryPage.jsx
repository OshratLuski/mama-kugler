import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { db } from '../firebase/firebase'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { useTranslation } from 'react-i18next'
import '../styles/CategoryPage.css'

export default function CategoryPage() {
  const { categoryName } = useParams();
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState([]);
  const { t } = useTranslation();

  useEffect(() => {
    // Fetch recipes based on selected category
    const fetchRecipes = async () => {
      const q = query(
        collection(db, "recipes"),
        where("category", "==", categoryName)
      );

      const querySnapshot = await getDocs(q);
      const fetchedRecipes = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setRecipes(fetchedRecipes);
    };

    fetchRecipes();
  }, [categoryName]);

  const handleRecipeClick = (recipeId) => {
    navigate(`/recipe/${recipeId}`);
  };

  return (
    <div className="category-container">
      <h1>{t(`categories.${categoryName}`)}</h1>

      {recipes.length === 0 ? (
        <p>{t('messages.no_recipes_in_category')}</p>
      ) : (
        <ul className="recipe-list">
          {recipes.map((recipe) => (
            <li 
              key={recipe.id}
              className="recipe-item"
              onClick={() => handleRecipeClick(recipe.id)}
              style={{ cursor: 'pointer' }}
            >
              {recipe.title}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

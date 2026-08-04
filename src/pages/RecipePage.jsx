import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { db } from '../firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import '../styles/RecipePage.css'

export default function RecipePage() {
  const { recipeId } = useParams();
  const [recipe, setRecipe] = useState(null);
  const { t } = useTranslation();

  useEffect(() => {
    // Fetch recipe details by ID
    const fetchRecipe = async () => {
      const docRef = doc(db, "recipes", recipeId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setRecipe(docSnap.data());
      } else {
        console.error(t('messages.recipe_not_found'));
      }
    };

    fetchRecipe();
  }, [recipeId, t]);

  if (!recipe) {
    return <div className="loading">{t('messages.loading_recipe')}</div>;
  }

  return (
    <div className="recipe-detail-container">
      <h1 className="recipe-title">{recipe.title}</h1>

      {recipe.img && (
        <img src={recipe.img} alt={recipe.title} className="recipe-detail-image" />
      )}

      <section className="ingredients-section">
        <h3>{t('recipe.ingredients')}</h3>
        <ul className="ingredients-list">
          {recipe.ingredients.map((item, index) => (
            <li key={index} className="ingredient-item">🧂 {item}</li>
          ))}
        </ul>
      </section>

      <section className="instructions-section">
        <h3>{t("recipe.instructions")}</h3>
        <ol className="instructions-list">
          {recipe.instructions.map((step, index) => (
            <li key={index} className="instruction-item">
              {step}
            </li>
          ))}
        </ol>
      </section>

      {recipe.audioUrl && (
        <section className="audio-section">
          <h3>{t('recipe.audio_explanation')}</h3>
          <audio controls src={recipe.audioUrl} className="recipe-audio"></audio>
        </section>
      )}
    </div>
  );
}

import React from 'react';
import { useTranslation } from 'react-i18next';

export default function RecipeCard({ recipe }) {
  const { t } = useTranslation();

  return (
    <div className="recipe-card">
      <h2>{recipe.title}</h2>

      {recipe.imageUrl && (
        <img src={recipe.imageUrl} alt={recipe.title} />
      )}

      <h4>{t('recipe.ingredients')}</h4>
      <ul>
        {recipe.ingredients.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>


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
        <>
          <h4>{t('recipe.audio')}</h4>
          <audio controls src={recipe.audioUrl}></audio>
        </>
      )}
    </div>
  );
}

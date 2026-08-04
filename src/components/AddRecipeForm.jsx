import { useState } from 'react'
import { db } from '../firebase/firebase'
import { collection, addDoc } from 'firebase/firestore'
import { useTranslation } from 'react-i18next'
import '../styles/AddRecipeForm.css'

export default function AddRecipeForm({ onCancel }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('cakes');
  const [ingredients, setIngredients] = useState([]);
  const [instructions, setInstructions] = useState([]);
  const [ingredientInput, setIngredientInput] = useState('');
  const [instructionInput, setInstructionInput] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const { t } = useTranslation();

  const categories = t('categories', { returnObjects: true });

  const handleAddIngredient = () => {
    if (ingredientInput.trim()) {
      setIngredients([...ingredients, ingredientInput.trim()]);
      setIngredientInput('');
    }
  };

  const handleAddInstruction = () => {
    if (instructionInput.trim()) {
      setInstructions([...instructions, instructionInput.trim()]);
      setInstructionInput('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newRecipe = {
      title,
      category,
      ingredients,
      instructions,
      imageUrl,
      audioUrl
    };

    try {
      await addDoc(collection(db, 'recipes'), newRecipe);
      alert(t('addRecipe.success'));
      setTitle('');
      setCategory('cakes');
      setIngredients([]);
      setInstructions([]);
      setImageUrl('');
      setAudioUrl('');
    } catch (error) {
      console.error('an error acured while addind the recipe:', error);
      alert(t('addRecipe.error'));
    }
  };

  const handleCancel = () => {
    setTitle('');
    setCategory('cakes');
    setIngredients([]);
    setInstructions([]);
    setImageUrl('');
    setAudioUrl('');
    if (onCancel) onCancel();
  };  

  return (
    <div className="add-recipe-form">
      <h1>{t('addRecipe.title')}</h1>
      <form onSubmit={handleSubmit}>
        <label>{t('addRecipe.nameLabel')}</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} required />

        <label>{t('addRecipe.categoryLabel')}</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
        {Object.entries(categories).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
        ))}
        </select>

        <label>{t('recipe.ingredients')}</label>
        <div>
          <input value={ingredientInput} onChange={(e) => setIngredientInput(e.target.value)} />
          <button type="button" onClick={handleAddIngredient}>{t('addRecipe.add')}</button>
        </div>
        <ul>
        {ingredients.map((item, index) => (
            <li key={index}>
            {item}
            <button type="button" onClick={() => {
                setIngredients(prev => prev.filter((_, i) => i !== index));
            }}>✖️</button>
            </li>
        ))}
        </ul>

        <label>{t('recipe.instructions')}</label>
        <div>
          <input value={instructionInput} onChange={(e) => setInstructionInput(e.target.value)} />
          <button type="button" onClick={handleAddInstruction}>{t('addRecipe.add')}</button>
        </div>
        <ol>
          {instructions.map((item, index) => <li key={index}>{item}</li>)}
        </ol>

        <label>{t('addRecipe.imageLabel')}</label>
        <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />

        <label>{t('addRecipe.audioLabel')}</label>
        <input value={audioUrl} onChange={(e) => setAudioUrl(e.target.value)} />

        <button type="submit">{t('addRecipe.submitButton')}</button>
        <button type="button" onClick={handleCancel} className="cancel-button"> {t('admin.cancelButton')}</button>
      </form>
    </div>
  );
}

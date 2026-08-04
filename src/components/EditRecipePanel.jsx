import { useState, useEffect } from 'react';
import { db } from '../firebase/firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import '../styles/AddRecipeForm.css'

export default function EditRecipePanel({onCancel}) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [instructions, setInstructions] = useState([]);
  const [ingredientInput, setIngredientInput] = useState('');
  const [instructionInput, setInstructionInput] = useState('');

  const [imageUrl, setImageUrl] = useState('');
  const [audioUrl, setAudioUrl] = useState('');

  const categories = t('categories', { returnObjects: true });

  const handleSearch = async () => {
    const snapshot = await getDocs(collection(db, 'recipes'));
    const allRecipes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const filtered = allRecipes.filter(recipe =>
      recipe.title.includes(searchTerm)
    );
    setResults(filtered);
  };

  const handleSelectRecipe = (recipe) => {
    setSelectedRecipe(recipe);
    setTitle(recipe.title);
    setCategory(recipe.category || []);
    setIngredients(recipe.ingredients || []);
    setInstructions(recipe.instructions || []);
    setImageUrl(recipe.imageUrl || '');
    setAudioUrl(recipe.audioUrl || '');
  };

  const handleSaveChanges = async () => {
    if (!selectedRecipe) return;
    const ref = doc(db, 'recipes', selectedRecipe.id);
    await updateDoc(ref, {
      title,
      category,
      ingredients,
      instructions,
      imageUrl,
      audioUrl
    });
    alert(t('messages.recipe_updated'));
    setSelectedRecipe(null);
    setSearchTerm('');
    setResults([]);
  };

  const handleAddIngredient = () => {
    if (ingredientInput.trim()) {
      setIngredients(prev => [...prev, ingredientInput.trim()]);
      setIngredientInput('');
    }
  };
  
  const handleAddInstruction = () => {
    if (instructionInput.trim()) {
      setInstructions(prev => [...prev, instructionInput.trim()]);
      setInstructionInput('');
    }
  };  

  const handleCancel = () => {
    setTitle('');
    setCategory([]);
    setIngredients([]);
    setInstructions([]);
    setImageUrl('');
    setAudioUrl('');
    if (onCancel) onCancel();
  }; 

  return (
    <div>
      <h2>עריכת מתכון</h2>

      {!selectedRecipe && (
        <>
          <input
            type="text"
            placeholder="הכנס שם מתכון"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button onClick={handleSearch}>חפש</button>

          <ul>
            {results.map(r => (
              <li key={r.id} onClick={() => handleSelectRecipe(r)} style={{ cursor: 'pointer' }}>
                {r.title}
              </li>
            ))}
          </ul>
        </>
      )}

      {selectedRecipe && (
        <div className="add-recipe-form">
          <h1>{selectedRecipe.title}</h1>
          <label>{t('addRecipe.nameLabel')}</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} />

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

        <button type="button" onClick={handleSaveChanges}>{t('addRecipe.submitButton')}</button>
        <button type="button" onClick={handleCancel} className="cancel-button"> {t('admin.cancelButton')}</button>
        </div>
      )}
    </div>
  );
}

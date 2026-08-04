import { useState } from 'react';
import { db } from '../firebase/firebase';
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';

export default function DeleteRecipePanel() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);

  const handleSearch = async () => {
    const snapshot = await getDocs(collection(db, 'recipes'));
    const allRecipes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const filtered = allRecipes.filter(recipe =>
      recipe.title.includes(searchTerm)
    );
    setResults(filtered);
  };

  const handleDelete = async (recipe) => {
    const confirm = window.confirm(`האם למחוק את המתכון "${recipe.title}"?`);
    if (!confirm) return;

    await deleteDoc(doc(db, 'recipes', recipe.id));
    alert(t('messages.recipe_deleted'));
    setResults(results.filter(r => r.id !== recipe.id));
  };

  return (
    <div>
      <h2>מחיקת מתכון</h2>

      <input
        type="text"
        placeholder="חפש לפי שם"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <button onClick={handleSearch}>חפש</button>

      <ul>
        {results.map((recipe) => (
          <li key={recipe.id}>
            {recipe.title}
            <button onClick={() => handleDelete(recipe)}>🗑️ מחק</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

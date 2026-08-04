import { useState } from 'react';
import AddRecipeForm from '../components/AddRecipeForm';
import EditRecipePanel from '../components/EditRecipePanel';
import DeleteRecipePanel from '../components/DeleteRecipePanel';
import { useTranslation } from 'react-i18next'
import adminImage from '../assets/admin_phto.png';
import '../styles/AdminPage.css';

export default function AdminPage() {
  // '', 'add', 'edit', 'delete'
  const [mode, setMode] = useState('');
  const {t} = useTranslation();

  return (
    <div className="admin-page">
      <img src={adminImage} alt="Admin illustration" className="admin-image" />

      <div className="admin-buttons">
        <button onClick={() => setMode('add')}>{t('admin.addRecipe')}</button>
        <button onClick={() => setMode('edit')}>{t('admin.editRecipe')}</button>
        <button onClick={() => setMode('delete')}>{t('admin.deleteRecipe')}</button>
      </div>

      <div className="admin-panel">
        {mode === 'add' && <AddRecipeForm onCancel={() => setMode('')} />}
        {mode === 'edit' && <EditRecipePanel onCancel={() => setMode('')} />}
        {mode === 'delete' && <DeleteRecipePanel />}
      </div>
    </div>
  );
}

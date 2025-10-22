import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, adminService } from '../services/api';

function ImportManager() {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();

  const [selectedFile, setSelectedFile] = useState(null);
  const [fileType, setFileType] = useState('');
  const [previewData, setPreviewData] = useState([]);
  const [importOptions, setImportOptions] = useState({
    skipDuplicates: true,
    updateExisting: false,
    preserveIds: false,
    markAsArchived: false
  });
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);

  useEffect(() => {
    if (!user || (user.role !== 'tenant_admin' && user.role !== 'global_admin')) {
      navigate('/');
      return;
    }
  }, []);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    setImportResult(null);
    setValidationErrors([]);

    // Détecter le type de fichier
    const extension = file.name.split('.').pop().toLowerCase();
    setFileType(extension);

    // Lire et prévisualiser le fichier
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        if (extension === 'json') {
          parseJSONFile(e.target.result);
        } else if (extension === 'csv') {
          parseCSVFile(e.target.result);
        } else if (extension === 'xls' || extension === 'xlsx') {
          parseExcelFile(e.target.result);
        } else {
          alert('Format de fichier non supporté');
        }
      } catch (error) {
        console.error('Error parsing file:', error);
        alert('Erreur lors de la lecture du fichier');
      }
    };
    reader.readAsText(file);
  };

  const parseJSONFile = (content) => {
    try {
      const data = JSON.parse(content);
      let calls = [];

      // Si c'est un export groupé, on aplatit les données
      if (typeof data === 'object' && !Array.isArray(data)) {
        calls = Object.values(data).flat();
      } else {
        calls = Array.isArray(data) ? data : [data];
      }

      setPreviewData(calls);
      validateData(calls);
    } catch (error) {
      alert('Fichier JSON invalide');
    }
  };

  const parseCSVFile = (content) => {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      alert('Fichier CSV vide ou invalide');
      return;
    }

    // Déterminer le séparateur (virgule, point-virgule, tabulation)
    const separator = content.includes(';') ? ';' : 
                     content.includes('\t') ? '\t' : ',';

    const headers = lines[0].split(separator).map(h => h.replace(/"/g, '').trim());
    const calls = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(separator).map(v => v.replace(/"/g, '').trim());
      const call = {};

      headers.forEach((header, index) => {
        const value = values[index] || '';
        
        // Mapper les en-têtes aux champs de l'API
        switch(header.toLowerCase()) {
          case 'appelant':
          case 'caller_name':
            call.caller_name = value;
            break;
          case 'téléphone':
          case 'caller_phone':
            call.caller_phone = value;
            break;
          case 'raison':
          case 'reason_name':
            call.reason_name = value;
            break;
          case 'lieu':
          case 'location':
            call.location = value;
            break;
          case 'bloquant':
          case 'is_blocking':
            call.is_blocking = value.toLowerCase() === 'oui' || value === '1' || value.toLowerCase() === 'true';
            break;
          case 'glpi':
          case 'is_glpi':
            call.is_glpi = value.toLowerCase() === 'oui' || value === '1' || value.toLowerCase() === 'true';
            break;
          case 'n° glpi':
          case 'glpi_number':
            call.glpi_number = value;
            break;
          case 'commentaire':
          case 'comments':
            call.comments = value;
            break;
          case 'date/heure':
          case 'created_at':
            call.created_at = value;
            break;
        }
      });

      if (call.caller_name || call.reason_name) {
        calls.push(call);
      }
    }

    setPreviewData(calls);
    validateData(calls);
  };

  const parseExcelFile = (content) => {
    // Pour Excel, on utilise le même parser que CSV (format tab-separated)
    parseCSVFile(content);
  };

  const validateData = (calls) => {
    const errors = [];

    calls.forEach((call, index) => {
      if (!call.caller_name && !call.reason_name) {
        errors.push(`Ligne ${index + 1}: Appelant ou raison requis`);
      }
      
      if (call.created_at) {
        const date = new Date(call.created_at);
        if (isNaN(date.getTime())) {
          errors.push(`Ligne ${index + 1}: Date invalide`);
        }
      }
    });

    setValidationErrors(errors);
  };

  const handleImport = async () => {
    if (!selectedFile || previewData.length === 0) {
      alert('Aucun fichier sélectionné ou aucune donnée à importer');
      return;
    }

    if (validationErrors.length > 0 && !window.confirm(
      `Il y a ${validationErrors.length} erreur(s) de validation. Continuer quand même ?`
    )) {
      return;
    }

    setImporting(true);
    setImportResult(null);

    try {
      // Convertir les données au format attendu par le backend
      const convertedCalls = previewData.map(call => ({
        caller: call.caller_name || call.caller,
        reason: call.reason_name || call.reason || '',
        tags: [],
        isBlocking: call.is_blocking || false,
        isGLPI: call.is_glpi || false,
        glpiNumber: call.glpi_number || call.glpiNumber || '',
        isArchived: importOptions.markAsArchived || call.is_archived || false,
        createdAt: call.created_at || new Date().toISOString()
      }));

      // Créer un objet JSON avec les appels convertis
      const jsonData = JSON.stringify(convertedCalls);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const file = new File([blob], 'import.json', { type: 'application/json' });

      // Créer un FormData pour l'envoi
      const formData = new FormData();
      formData.append('file', file);
      formData.append('tenantId', user.tenantId || user.tenant_id);

      const response = await adminService.importCalls(formData);
      
      setImportResult({
        success: true,
        imported: response.data.imported || 0,
        skipped: response.data.skipped || 0,
        duplicates: response.data.duplicates || 0,
        updated: response.data.updated || 0,
        errors: response.data.errors || []
      });

      // Réinitialiser le formulaire en cas de succès
      if (response.data.imported > 0) {
        setTimeout(() => {
          setSelectedFile(null);
          setPreviewData([]);
          document.getElementById('fileInput').value = '';
        }, 3000);
      }
    } catch (error) {
      console.error('Import error:', error);
      setImportResult({
        success: false,
        message: error.response?.data?.error || error.response?.data?.message || 'Erreur lors de l\'importation'
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="text-2xl font-bold text-gray-800 hover:text-blue-600"
            >
              ← CallFixV2
            </button>
            <span className="text-gray-300">|</span>
            <span className="text-gray-600">📥 Gestionnaire d'Imports</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin-tenant')}
              className="text-sm text-gray-600 hover:text-blue-600 font-medium"
            >
              👥 Admin Tenant
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={() => navigate('/archives')}
              className="text-sm text-gray-600 hover:text-blue-600 font-medium"
            >
              📦 Archives
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={() => navigate('/export-manager')}
              className="text-sm text-gray-600 hover:text-blue-600 font-medium"
            >
              📊 Exports
            </button>
            <span className="text-gray-300">|</span>
            <span className="text-sm text-gray-600">
              {user?.fullName || user?.username}
            </span>
            <button
              onClick={() => authService.logout()}
              className="btn btn-secondary text-sm"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Panneau de sélection et configuration */}
          <div className="card space-y-6">
            <h2 className="text-xl font-bold text-gray-800">📁 Sélection du Fichier</h2>

            {/* Zone de sélection de fichier */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fichier à importer
              </label>
              <input
                id="fileInput"
                type="file"
                accept=".json,.csv,.xls,.xlsx"
                onChange={handleFileSelect}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100 cursor-pointer"
              />
              <p className="mt-1 text-xs text-gray-500">
                Formats supportés: JSON, CSV, Excel (XLS/XLSX)
              </p>
            </div>

            {selectedFile && (
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">📄</span>
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">{selectedFile.name}</div>
                    <div className="text-xs text-gray-600">
                      {(selectedFile.size / 1024).toFixed(2)} KB - {fileType.toUpperCase()}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Options d'import */}
            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-800 mb-3">⚙️ Options d'Import</h3>
              
              <div className="space-y-2">
                <label className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={importOptions.skipDuplicates}
                    onChange={(e) => setImportOptions({
                      ...importOptions,
                      skipDuplicates: e.target.checked
                    })}
                    className="mt-1 rounded"
                  />
                  <div>
                    <div className="text-sm font-medium">Ignorer les doublons</div>
                    <div className="text-xs text-gray-600">
                      Ne pas importer les appels en double
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={importOptions.updateExisting}
                    onChange={(e) => setImportOptions({
                      ...importOptions,
                      updateExisting: e.target.checked
                    })}
                    className="mt-1 rounded"
                  />
                  <div>
                    <div className="text-sm font-medium">Mettre à jour existants</div>
                    <div className="text-xs text-gray-600">
                      Mettre à jour les appels existants
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={importOptions.preserveIds}
                    onChange={(e) => setImportOptions({
                      ...importOptions,
                      preserveIds: e.target.checked
                    })}
                    className="mt-1 rounded"
                  />
                  <div>
                    <div className="text-sm font-medium">Conserver les IDs</div>
                    <div className="text-xs text-gray-600">
                      Garder les IDs du fichier (admin seulement)
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={importOptions.markAsArchived}
                    onChange={(e) => setImportOptions({
                      ...importOptions,
                      markAsArchived: e.target.checked
                    })}
                    className="mt-1 rounded"
                  />
                  <div>
                    <div className="text-sm font-medium">Marquer comme archivés</div>
                    <div className="text-xs text-gray-600">
                      Importer directement dans les archives
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Validation */}
            {validationErrors.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                <div className="font-semibold text-yellow-800 mb-2">
                  ⚠️ {validationErrors.length} Erreur(s) de Validation
                </div>
                <div className="max-h-32 overflow-y-auto text-xs text-yellow-700 space-y-1">
                  {validationErrors.slice(0, 10).map((error, index) => (
                    <div key={index}>• {error}</div>
                  ))}
                  {validationErrors.length > 10 && (
                    <div>... et {validationErrors.length - 10} autres erreurs</div>
                  )}
                </div>
              </div>
            )}

            {/* Bouton d'import */}
            <button
              onClick={handleImport}
              disabled={!selectedFile || previewData.length === 0 || importing}
              className="btn btn-primary w-full"
            >
              {importing ? (
                <>
                  <span className="inline-block animate-spin mr-2">⏳</span>
                  Importation en cours...
                </>
              ) : (
                <>📥 Importer {previewData.length} appel(s)</>
              )}
            </button>

            {/* Résultat de l'import */}
            {importResult && (
              <div className={`rounded p-4 ${
                importResult.success 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className={`font-semibold mb-2 ${
                  importResult.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {importResult.success ? '✅ Import Réussi!' : '❌ Erreur d\'Import'}
                </div>
                {importResult.success ? (
                  <div className="text-sm text-green-700 space-y-1">
                    <div>• Importés: {importResult.imported}</div>
                    {importResult.duplicates > 0 && (
                      <div>• Doublons ignorés: {importResult.duplicates}</div>
                    )}
                    {importResult.updated > 0 && (
                      <div>• Mis à jour: {importResult.updated}</div>
                    )}
                    {importResult.skipped > importResult.duplicates && (
                      <div>• Erreurs: {importResult.skipped - importResult.duplicates}</div>
                    )}
                    {importResult.errors?.length > 0 && (
                      <div className="mt-2 text-yellow-700">
                        ⚠️ {importResult.errors.length} avertissement(s)
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-red-700">
                    {importResult.message}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Aperçu des données */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              👁️ Aperçu des Données
            </h2>

            {previewData.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-4xl mb-2">📋</div>
                <p>Sélectionnez un fichier pour voir l'aperçu</p>
              </div>
            ) : (
              <>
                <div className="mb-4 text-sm text-gray-600">
                  {previewData.length} appel(s) détecté(s)
                </div>
                
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {previewData.slice(0, 20).map((call, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-3 bg-white"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-800">
                            {call.caller_name || 'Appelant non spécifié'}
                          </div>
                          <div className="text-sm text-gray-600">
                            {call.reason_name || 'Raison non spécifiée'}
                          </div>
                        </div>
                        {call.created_at && (
                          <div className="text-xs text-gray-500">
                            {new Date(call.created_at).toLocaleDateString('fr-FR')}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-2 text-xs">
                        {call.caller_phone && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">
                            📞 {call.caller_phone}
                          </span>
                        )}
                        {call.location && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                            📍 {call.location}
                          </span>
                        )}
                        {call.is_blocking && (
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded">
                            🚨 Bloquant
                          </span>
                        )}
                        {call.is_glpi && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">
                            🎫 GLPI {call.glpi_number || ''}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {previewData.length > 20 && (
                    <div className="text-center py-3 text-sm text-gray-500">
                      ... et {previewData.length - 20} autres appels
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Guide d'utilisation */}
        <div className="card mt-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">📖 Guide d'Utilisation</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Format JSON</h4>
              <p className="text-gray-600 mb-2">
                Utilisez le format exporté par le système :
              </p>
              <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
{`[
  {
    "caller_name": "Jean Dupont",
    "caller_phone": "0123456789",
    "reason_name": "Problème réseau",
    "location": "Bureau A",
    "is_blocking": true,
    "is_glpi": false
  }
]`}
              </pre>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Format CSV</h4>
              <p className="text-gray-600 mb-2">
                En-têtes supportés (séparateur: ; ou ,) :
              </p>
              <ul className="text-gray-600 text-xs space-y-1">
                <li>• Appelant / caller_name</li>
                <li>• Téléphone / caller_phone</li>
                <li>• Raison / reason_name</li>
                <li>• Lieu / location</li>
                <li>• Bloquant / is_blocking (Oui/Non)</li>
                <li>• GLPI / is_glpi (Oui/Non)</li>
                <li>• N° GLPI / glpi_number</li>
                <li>• Date/Heure / created_at</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ImportManager;

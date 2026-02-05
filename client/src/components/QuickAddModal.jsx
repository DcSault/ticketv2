import React, { useState, useEffect } from 'react';

function QuickAddModal({ isOpen, onClose, onSubmit, suggestions }) {
    const [quickFormData, setQuickFormData] = useState({
        caller: '',
        reason: '',
        tags: [],
        isBlocking: false
    });

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setQuickFormData({
                caller: '',
                reason: '',
                tags: [],
                isBlocking: false
            });
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!quickFormData.caller.trim()) {
            alert('L\'appelant est obligatoire');
            return;
        }
        onSubmit(quickFormData);
    };

    const addQuickTag = (tag) => {
        if (tag && !quickFormData.tags.includes(tag)) {
            setQuickFormData({ ...quickFormData, tags: [...quickFormData.tags, tag] });
        }
    };

    const removeQuickTag = (tagToRemove) => {
        setQuickFormData({
            ...quickFormData,
            tags: quickFormData.tags.filter(tag => tag !== tagToRemove)
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Ajout Rapide</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 text-2xl"
                    >
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Caller */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Appelant *
                        </label>
                        <div className="space-y-2">
                            <input
                                type="text"
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="Nom de l'appelant"
                                value={quickFormData.caller} // Allow direct text input if not selecting suggestion
                                onChange={(e) => setQuickFormData({ ...quickFormData, caller: e.target.value })}
                                list="caller-suggestions"
                                required
                                autoFocus
                            />
                            <datalist id="caller-suggestions">
                                {suggestions?.callers?.map((item, index) => {
                                    const name = typeof item === 'string' ? item : item.name;
                                    return <option key={index} value={name} />;
                                })}
                            </datalist>

                            {/* Fallback to select if users prefer picking from top list explicitly */}
                            {suggestions?.callers?.length > 0 && (
                                <select
                                    onChange={(e) => {
                                        if (e.target.value) setQuickFormData({ ...quickFormData, caller: e.target.value })
                                    }}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm bg-gray-50"
                                    value=""
                                >
                                    <option value="">...ou choisir parmi les fréquents</option>
                                    {suggestions.callers.map((item, index) => {
                                        const name = typeof item === 'string' ? item : item.name;
                                        const count = typeof item === 'object' ? item.count : null;
                                        return (
                                            <option key={index} value={name}>
                                                {name}{count ? ` (${count} fois)` : ''}
                                            </option>
                                        );
                                    })}
                                </select>
                            )}
                        </div>
                    </div>

                    {/* Reason */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Raison
                        </label>
                        <select
                            value={quickFormData.reason}
                            onChange={(e) => setQuickFormData({ ...quickFormData, reason: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Sélectionner...</option>
                            {suggestions?.reasons?.map((item, index) => {
                                const name = typeof item === 'string' ? item : item.name;
                                const count = typeof item === 'object' ? item.count : null;
                                return (
                                    <option key={index} value={name}>
                                        {name}{count ? ` (${count} fois)` : ''}
                                    </option>
                                );
                            })}
                        </select>
                    </div>

                    {/* Tags */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tags
                        </label>
                        <select
                            onChange={(e) => {
                                addQuickTag(e.target.value);
                                e.target.value = '';
                            }}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Ajouter un tag...</option>
                            {suggestions?.tags?.map((item, index) => {
                                const name = typeof item === 'string' ? item : item.name;
                                const count = typeof item === 'object' ? item.count : null;
                                return (
                                    <option key={index} value={name}>
                                        {name}{count ? ` (${count} fois)` : ''}
                                    </option>
                                );
                            })}
                        </select>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {quickFormData.tags.map((tag, index) => (
                                <span
                                    key={index}
                                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                                >
                                    {tag}
                                    <button
                                        type="button"
                                        onClick={() => removeQuickTag(tag)}
                                        className="text-blue-600 hover:text-blue-800 font-bold"
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Blocking */}
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="quickBlocking"
                            checked={quickFormData.isBlocking}
                            onChange={(e) => setQuickFormData({ ...quickFormData, isBlocking: e.target.checked })}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="quickBlocking" className="text-sm text-gray-700">
                            Appel bloquant
                        </label>
                    </div>

                    {/* Submit */}
                    <div className="flex gap-2 pt-2">
                        <button
                            type="submit"
                            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 font-medium"
                        >
                            Créer
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 font-medium"
                        >
                            Annuler
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default QuickAddModal;

import React, { useState } from 'react';

function CallForm({ onSubmit, suggestions, userRole }) {
    const [formData, setFormData] = useState({
        caller: '',
        reason: '',
        tags: [],
        isGlpi: false,
        glpiNumber: '',
        isBlocking: false
    });

    const [showCallerSuggestions, setShowCallerSuggestions] = useState(false);
    const [showReasonSuggestions, setShowReasonSuggestions] = useState(false);
    const [showTagSuggestions, setShowTagSuggestions] = useState(false);
    const [currentTag, setCurrentTag] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData, () => {
            // Callback to reset form on success
            setFormData({
                caller: '',
                reason: '',
                tags: [],
                isGlpi: false,
                glpiNumber: '',
                isBlocking: false
            });
        });
    };

    const addTag = (tag) => {
        if (tag && !formData.tags.includes(tag)) {
            setFormData({ ...formData, tags: [...formData.tags, tag] });
        }
        setCurrentTag('');
        setShowTagSuggestions(false);
    };

    const removeTag = (tagToRemove) => {
        setFormData({
            ...formData,
            tags: formData.tags.filter(tag => tag !== tagToRemove)
        });
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Nouvel Appel</h2>
                {/* Quick Add button moved to parent or passed as prop if needed related to form, but Dashboard has it separate */}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                    {/* Appelant */}
                    <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Appelant *
                        </label>
                        <input
                            type="text"
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            value={formData.caller}
                            onChange={(e) => {
                                setFormData({ ...formData, caller: e.target.value });
                                setShowCallerSuggestions(true);
                            }}
                            onFocus={() => setShowCallerSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowCallerSuggestions(false), 200)}
                            required
                        />
                        {showCallerSuggestions && suggestions?.callers?.length > 0 && formData.caller && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                {suggestions.callers
                                    .filter(s => s.toLowerCase().includes(formData.caller.toLowerCase()))
                                    .map((suggestion, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            className="w-full text-left px-3 py-2 hover:bg-gray-100"
                                            onClick={() => {
                                                setFormData({ ...formData, caller: suggestion });
                                                setShowCallerSuggestions(false);
                                            }}
                                        >
                                            {suggestion}
                                        </button>
                                    ))}
                            </div>
                        )}
                    </div>

                    {/* Raison */}
                    {!formData.isGlpi && (
                        <div className="relative">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Raison
                            </label>
                            <input
                                type="text"
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                value={formData.reason}
                                onChange={(e) => {
                                    setFormData({ ...formData, reason: e.target.value });
                                    setShowReasonSuggestions(true);
                                }}
                                onFocus={() => setShowReasonSuggestions(true)}
                                onBlur={() => setTimeout(() => setShowReasonSuggestions(false), 200)}
                            />
                            {showReasonSuggestions && suggestions?.reasons?.length > 0 && formData.reason && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                    {suggestions.reasons
                                        .filter(s => s.toLowerCase().includes(formData.reason.toLowerCase()))
                                        .map((suggestion, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                className="w-full text-left px-3 py-2 hover:bg-gray-100"
                                                onClick={() => {
                                                    setFormData({ ...formData, reason: suggestion });
                                                    setShowReasonSuggestions(false);
                                                }}
                                            >
                                                {suggestion}
                                            </button>
                                        ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Tags */}
                {!formData.isGlpi && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tags
                        </label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {formData.tags.map((tag, idx) => (
                                <span
                                    key={idx}
                                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                                >
                                    {tag}
                                    <button
                                        type="button"
                                        onClick={() => removeTag(tag)}
                                        className="hover:text-blue-600"
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                        </div>
                        <div className="relative">
                            <input
                                type="text"
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                value={currentTag}
                                onChange={(e) => {
                                    setCurrentTag(e.target.value);
                                    setShowTagSuggestions(true);
                                }}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        addTag(currentTag);
                                    }
                                }}
                                onFocus={() => setShowTagSuggestions(true)}
                                onBlur={() => setTimeout(() => setShowTagSuggestions(false), 200)}
                                placeholder="Ajouter un tag..."
                            />
                            {showTagSuggestions && suggestions?.tags?.length > 0 && currentTag && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                    {suggestions.tags
                                        .filter(s => s.toLowerCase().includes(currentTag.toLowerCase()))
                                        .map((suggestion, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                className="w-full text-left px-3 py-2 hover:bg-gray-100"
                                                onClick={() => addTag(suggestion)}
                                            >
                                                {suggestion}
                                            </button>
                                        ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Checkboxes */}
                <div className="flex flex-wrap gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={formData.isGlpi}
                            onChange={(e) => setFormData({
                                ...formData,
                                isGlpi: e.target.checked,
                                reason: e.target.checked ? '' : formData.reason,
                                tags: e.target.checked ? [] : formData.tags
                            })}
                            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">Ticket GLPI</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={formData.isBlocking}
                            onChange={(e) => setFormData({ ...formData, isBlocking: e.target.checked })}
                            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">Bloquant</span>
                    </label>
                </div>

                {formData.isGlpi && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Numéro GLPI
                        </label>
                        <input
                            type="text"
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            value={formData.glpiNumber}
                            onChange={(e) => setFormData({ ...formData, glpiNumber: e.target.value })}
                            placeholder="Ex: GLPI-12345"
                        />
                    </div>
                )}

                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium">
                    Enregistrer l'appel
                </button>
            </form>
        </div>
    );
}

export default CallForm;

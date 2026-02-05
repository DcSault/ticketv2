import React, { useState, useEffect } from 'react';
import { authService, callService } from '../services/api';

function CallItem({ call, onUpdate, onDelete, onArchive }) {
    const [isEditing, setIsEditing] = useState(false);

    // Tag parsing logic from original code
    const initialTags = (call.tags && Array.isArray(call.tags))
        ? call.tags.filter(t => t && t.name).map(t => t.name)
        : [];

    const [editData, setEditData] = useState({
        caller: call.caller_name,
        reason: call.reason_name || '',
        tags: initialTags,
        isGlpi: call.is_glpi,
        glpiNumber: call.glpi_number || '',
        isBlocking: call.is_blocking,
        createdAt: call.created_at
    });

    const [callerSuggestions, setCallerSuggestions] = useState([]);
    const [reasonSuggestions, setReasonSuggestions] = useState([]);
    const [tagSuggestions, setTagSuggestions] = useState([]);
    const [showCallerSuggestions, setShowCallerSuggestions] = useState(false);
    const [showReasonSuggestions, setShowReasonSuggestions] = useState(false);
    const [showTagSuggestions, setShowTagSuggestions] = useState(false);
    const [currentTag, setCurrentTag] = useState('');

    useEffect(() => {
        if (isEditing) {
            // Re-parse tags when entering edit mode to be safe
            let parsedTags = [];
            if (call.tags && Array.isArray(call.tags)) {
                parsedTags = call.tags
                    .filter(t => t && (typeof t === 'string' ? t : t.name))
                    .map(t => typeof t === 'string' ? t : t.name);
            }

            setEditData({
                caller: call.caller_name,
                reason: call.reason_name || '',
                tags: parsedTags,
                isGlpi: call.is_glpi,
                glpiNumber: call.glpi_number || '',
                isBlocking: call.is_blocking,
                createdAt: call.created_at
            });
            loadSuggestions();
        }
    }, [isEditing, call]);

    const loadSuggestions = async () => {
        try {
            const [callers, reasons, tags] = await Promise.all([
                callService.getSuggestions('callers'),
                callService.getSuggestions('reasons'),
                callService.getSuggestions('tags')
            ]);
            setCallerSuggestions(callers.data);
            setReasonSuggestions(reasons.data);
            setTagSuggestions(tags.data);
        } catch (error) {
            console.error('Error loading suggestions:', error);
        }
    };

    const addTag = (tag) => {
        if (tag && !editData.tags.includes(tag)) {
            setEditData({ ...editData, tags: [...editData.tags, tag] });
        }
        setCurrentTag('');
        setShowTagSuggestions(false);
    };

    const removeTag = (tagToRemove) => {
        setEditData({
            ...editData,
            tags: editData.tags.filter(tag => tag !== tagToRemove)
        });
    };

    const handleSave = () => {
        onUpdate(call.id, editData);
        setIsEditing(false);
    };

    // Date formatters localized
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getDayName = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', { weekday: 'long' });
    };

    if (isEditing) {
        return (
            <div className="border border-gray-300 rounded-lg p-4 bg-blue-50 mb-4">
                <div className="space-y-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date/Heure</label>
                        <input
                            type="datetime-local"
                            className="w-full p-2 border border-gray-300 rounded text-sm"
                            value={new Date(editData.createdAt).toISOString().slice(0, 16)}
                            onChange={(e) => setEditData({ ...editData, createdAt: e.target.value })}
                        />
                    </div>

                    {/* Caller */}
                    <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Appelant</label>
                        <input
                            type="text"
                            className="w-full p-2 border border-gray-300 rounded text-sm"
                            value={editData.caller}
                            onChange={(e) => {
                                setEditData({ ...editData, caller: e.target.value });
                                setShowCallerSuggestions(true);
                            }}
                            onFocus={() => setShowCallerSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowCallerSuggestions(false), 200)}
                        />
                        {showCallerSuggestions && callerSuggestions.length > 0 && editData.caller && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                                {callerSuggestions
                                    .filter(s => s.toLowerCase().includes(editData.caller.toLowerCase()))
                                    .map((suggestion, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                                            onClick={() => {
                                                setEditData({ ...editData, caller: suggestion });
                                                setShowCallerSuggestions(false);
                                            }}
                                        >
                                            {suggestion}
                                        </button>
                                    ))}
                            </div>
                        )}
                    </div>

                    {/* Reason */}
                    {!editData.isGlpi && (
                        <div className="relative">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Raison</label>
                            <input
                                type="text"
                                className="w-full p-2 border border-gray-300 rounded text-sm"
                                value={editData.reason}
                                onChange={(e) => {
                                    setEditData({ ...editData, reason: e.target.value });
                                    setShowReasonSuggestions(true);
                                }}
                                onFocus={() => setShowReasonSuggestions(true)}
                                onBlur={() => setTimeout(() => setShowReasonSuggestions(false), 200)}
                            />
                            {showReasonSuggestions && reasonSuggestions.length > 0 && editData.reason && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                                    {reasonSuggestions
                                        .filter(s => s.toLowerCase().includes(editData.reason.toLowerCase()))
                                        .map((suggestion, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                                                onClick={() => {
                                                    setEditData({ ...editData, reason: suggestion });
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

                    {/* Tags */}
                    {!editData.isGlpi && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tags {editData.tags.length > 0 && `(${editData.tags.length})`}
                            </label>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {editData.tags && editData.tags.length > 0 ? (
                                    editData.tags.map((tag, idx) => (
                                        <span
                                            key={idx}
                                            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
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
                                    ))
                                ) : (
                                    <span className="text-xs text-gray-400">Aucun tag</span>
                                )}
                            </div>
                            <div className="relative">
                                <input
                                    type="text"
                                    className="w-full p-2 border border-gray-300 rounded text-sm"
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
                                {showTagSuggestions && tagSuggestions.length > 0 && currentTag && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                                        {tagSuggestions
                                            .filter(s => s.toLowerCase().includes(currentTag.toLowerCase()))
                                            .map((suggestion, idx) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
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
                    <div className="flex flex-wrap gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={editData.isGlpi}
                                onChange={(e) => setEditData({
                                    ...editData,
                                    isGlpi: e.target.checked,
                                    reason: e.target.checked ? '' : editData.reason,
                                    tags: e.target.checked ? [] : editData.tags
                                })}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-gray-700">Ticket GLPI</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={editData.isBlocking}
                                onChange={(e) => setEditData({ ...editData, isBlocking: e.target.checked })}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-gray-700">Bloquant</span>
                        </label>
                    </div>

                    {editData.isGlpi && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Numéro GLPI
                            </label>
                            <input
                                type="text"
                                className="w-full p-2 border border-gray-300 rounded text-sm"
                                value={editData.glpiNumber}
                                onChange={(e) => setEditData({ ...editData, glpiNumber: e.target.value })}
                                placeholder="Ex: GLPI-12345"
                            />
                        </div>
                    )}

                    <div className="flex gap-2">
                        <button
                            onClick={handleSave}
                            className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700"
                        >
                            Enregistrer
                        </button>
                        <button
                            onClick={() => setIsEditing(false)}
                            className="bg-gray-200 text-gray-700 px-3 py-1.5 rounded text-sm hover:bg-gray-300"
                        >
                            Annuler
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white mb-4">
            <div className="flex justify-between items-start">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-medium text-gray-500">
                            {formatDate(call.created_at)}
                        </span>
                        <span className="text-sm text-gray-400">•</span>
                        <span className="text-sm text-gray-500 capitalize">
                            {getDayName(call.created_at)}
                        </span>
                        {call.is_blocking && (
                            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                                Bloquant
                            </span>
                        )}
                        {call.is_glpi && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                                GLPI {call.glpi_number && `- ${call.glpi_number}`}
                            </span>
                        )}
                    </div>
                    <p className="text-lg font-semibold text-gray-800 mb-1">
                        {call.caller_name}
                    </p>
                    {call.reason_name && (
                        <p className="text-gray-600 mb-2">{call.reason_name}</p>
                    )}
                    {call.tags && Array.isArray(call.tags) && call.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {call.tags
                                .filter(t => t && (typeof t === 'string' ? t : t.name))
                                .map((tag, idx) => (
                                    <span
                                        key={idx}
                                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                                    >
                                        {typeof tag === 'string' ? tag : tag.name}
                                    </span>
                                ))}
                        </div>
                    )}
                </div>
                {authService.getCurrentUser()?.role !== 'viewer' && (
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsEditing(true)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                            Modifier
                        </button>
                        <button
                            onClick={() => onArchive(call.id)}
                            className="text-orange-600 hover:text-orange-800 text-sm font-medium"
                        >
                            📦 Archiver
                        </button>
                        <button
                            onClick={() => onDelete(call.id)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                            Supprimer
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default CallItem;

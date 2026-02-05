import React from 'react';
import CallItem from './CallItem';
import { useNavigate } from 'react-router-dom';

function CallList({ calls, loading, onUpdate, onDelete, onArchive }) {
    const navigate = useNavigate();

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                    Bisous d'aujourd'hui ({calls.length})
                </h2>
                <button
                    onClick={() => navigate('/archives')}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                    📦 Voir les appels précédents
                </button>
            </div>

            {loading ? (
                <div className="text-center py-8">
                    <p className="text-gray-600">Chargement...</p>
                </div>
            ) : calls.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-gray-600 mb-2">Aucun appel aujourd'hui</p>
                    <p className="text-sm text-gray-500">
                        Les appels des jours précédents sont dans les{' '}
                        <button
                            onClick={() => navigate('/archives')}
                            className="text-blue-600 hover:underline font-medium"
                        >
                            Archives
                        </button>
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {calls.map((call) => (
                        <CallItem
                            key={call.id}
                            call={call}
                            onUpdate={onUpdate}
                            onDelete={onDelete}
                            onArchive={onArchive}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default CallList;

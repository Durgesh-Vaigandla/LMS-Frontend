import React, { useState, useEffect } from "react";
import { testApi } from "../../../services/testApi";
import type { Test, UpdateTestRequest } from "../../../types";

interface EditTestModalProps {
    test: Test;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (updatedTest: Test) => void;
}

const EditTestModal: React.FC<EditTestModalProps> = ({ test, isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState<UpdateTestRequest>({
        title: test.title,
        description: test.description,
        startTime: test.startTime,
        endTime: test.endTime,
        totalMarks: test.totalMarks,
        maxAttempts: test.maxAttempts,
        proctored: test.proctored,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setFormData({
                title: test.title,
                description: test.description,
                startTime: test.startTime,
                endTime: test.endTime,
                totalMarks: test.totalMarks,
                maxAttempts: test.maxAttempts,
                proctored: test.proctored,
            });
            setError(null);
        }
    }, [isOpen, test]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await testApi.updateTest(test.id, formData);
            if (response.success && response.data) {
                onSuccess(response.data);
                onClose();
            } else {
                setError(response.message || "Failed to update test");
            }
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to update test");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "number" ? Number(value) : type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
        }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 overflow-hidden animate-fade-in">
                <div className="px-6 py-4 border-b border-border bg-gray-50 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-text">Edit Test Details</h3>
                    <button onClick={onClose} className="text-text-secondary hover:text-text">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm border border-red-200">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-text mb-1">Title</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title || ""}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text mb-1">Description</label>
                        <textarea
                            name="description"
                            value={formData.description || ""}
                            onChange={handleChange}
                            rows={3}
                            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-text mb-1">Start Time</label>
                            <input
                                type="datetime-local"
                                name="startTime"
                                value={formData.startTime || ""}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text mb-1">End Time</label>
                            <input
                                type="datetime-local"
                                name="endTime"
                                value={formData.endTime || ""}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text mb-1">Max Attempts</label>
                        <input
                            type="number"
                            name="maxAttempts"
                            value={formData.maxAttempts || 1}
                            onChange={handleChange}
                            min="1"
                            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            required
                        />
                    </div>
                    
                    <div className="flex items-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <input
                            type="checkbox"
                            name="proctored"
                            checked={formData.proctored || false}
                            onChange={handleChange}
                            className="w-5 h-5 text-blue-600 focus:ring-blue-500 border-border rounded"
                        />
                        <div className="ml-3">
                            <label className="block text-sm font-semibold text-blue-900">
                                Enable Proctoring (AI Monitoring)
                            </label>
                            <p className="text-xs text-blue-700">
                                Students will be monitored with camera/audio for cheating detection
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t border-border mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-text-secondary bg-surface hover:bg-gray-200 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-secondary rounded-lg shadow-sm transition-colors disabled:opacity-50 flex items-center"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Saving...
                                </>
                            ) : (
                                "Save Changes"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditTestModal;

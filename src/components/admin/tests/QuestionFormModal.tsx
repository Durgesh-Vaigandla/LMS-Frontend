import React, { useState } from "react";
import { testApi } from "../../../services/testApi";
import type { Question, QuestionTypeType } from "../../../types";

interface QuestionFormModalProps {
    testId: number;
    question: Question | null;
    onSuccess: () => void;
    onCancel: () => void;
}

const QuestionFormModal: React.FC<QuestionFormModalProps> = ({ testId, question, onSuccess, onCancel }) => {
    const [formData, setFormData] = useState({
        questionText: question?.questionText || "",
        questionType: (question?.questionType || "MCQ") as QuestionTypeType,
        marks: question?.marks || 1,
        negativeMarks: question?.negativeMarks || 0,
        optionA: question?.optionA || "",
        optionB: question?.optionB || "",
        optionC: question?.optionC || "",
        optionD: question?.optionD || "",
        correctOption: question?.correctOption || "",
        correctOptionsCsv: question?.correctOptionsCsv || "",
        correctAnswer: question?.correctAnswer || "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const questionData: any = {
                questionType: formData.questionType,
                questionText: formData.questionText,
                marks: formData.marks,
                negativeMarks: formData.negativeMarks,
            };

            if (formData.questionType === "MCQ") {
                questionData.optionA = formData.optionA;
                questionData.optionB = formData.optionB;
                questionData.optionC = formData.optionC;
                questionData.optionD = formData.optionD;
                questionData.correctOption = formData.correctOption;
            } else if (formData.questionType === "MAQ") {
                questionData.optionA = formData.optionA;
                questionData.optionB = formData.optionB;
                questionData.optionC = formData.optionC;
                questionData.optionD = formData.optionD;
                questionData.correctOptionsCsv = formData.correctOptionsCsv;
            } else {
                questionData.correctAnswer = formData.correctAnswer;
            }

            const response = question
                ? await testApi.updateQuestion(question.id, questionData)
                : await testApi.createQuestion(testId, questionData);

            if (response.success) {
                onSuccess();
            } else {
                setError(response.message);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || `Failed to ${question ? 'update' : 'create'} question`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full my-8">
                <div className="px-6 py-5 border-b border-border bg-gradient-to-r from-primary to-secondary">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">{question ? 'Edit Question' : 'Add New Question'}</h2>
                                <p className="text-red-100 text-sm">Fill in the details below</p>
                            </div>
                        </div>
                        <button
                            onClick={onCancel}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                    {error && (
                        <div className="flex items-center space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <svg className="w-5 h-5 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm text-primary font-medium">{error}</span>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-semibold text-text mb-2">
                            Question Type <span className="text-primary">*</span>
                        </label>
                        <select
                            value={formData.questionType}
                            onChange={(e) => setFormData({
                                ...formData,
                                questionType: e.target.value as QuestionTypeType,
                                correctOption: "",
                                correctOptionsCsv: "",
                                correctAnswer: "",
                            })}
                            className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                            required
                            disabled={!!question}
                        >
                            <option value="MCQ">Multiple Choice (Single Correct Answer)</option>
                            <option value="MAQ">Multiple Answer Question (Multiple Correct)</option>
                            <option value="FILL_BLANK">Fill in the Blank</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-text mb-2">
                            Question Text <span className="text-primary">*</span>
                        </label>
                        <textarea
                            value={formData.questionText}
                            onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
                            className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                            rows={4}
                            placeholder="Enter your question here..."
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-text mb-2">
                                Marks <span className="text-primary">*</span>
                            </label>
                            <input
                                type="number"
                                value={formData.marks}
                                onChange={(e) => setFormData({ ...formData, marks: parseInt(e.target.value) })}
                                className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                min="1"
                                placeholder="1"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-text mb-2">
                                Negative Marks
                            </label>
                            <input
                                type="number"
                                value={formData.negativeMarks}
                                onChange={(e) => setFormData({ ...formData, negativeMarks: parseInt(e.target.value) })}
                                className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                min="0"
                                placeholder="0"
                                required
                            />
                        </div>
                    </div>

                    {(formData.questionType === "MCQ" || formData.questionType === "MAQ") && (
                        <div>
                            <label className="block text-sm font-semibold text-text mb-3">
                                Options <span className="text-primary">*</span>
                            </label>
                            <div className="space-y-3">
                                {['A', 'B', 'C', 'D'].map((opt) => (
                                    <div key={opt} className="flex items-center space-x-3">
                                        <span className="flex items-center justify-center w-10 h-10 bg-surface text-text font-bold rounded-lg">
                                            {opt}
                                        </span>
                                        <input
                                            type="text"
                                            value={formData[`option${opt}` as keyof typeof formData] as string}
                                            onChange={(e) => setFormData({ ...formData, [`option${opt}`]: e.target.value })}
                                            className="flex-1 px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                            placeholder={`Option ${opt}`}
                                            required
                                        />
                                        {formData.questionType === "MCQ" ? (
                                            <input
                                                type="radio"
                                                name="correctOption"
                                                value={opt}
                                                checked={formData.correctOption === opt}
                                                onChange={(e) => setFormData({ ...formData, correctOption: e.target.value })}
                                                className="w-5 h-5 text-primary focus:ring-primary border-border"
                                                required
                                            />
                                        ) : (
                                            <input
                                                type="checkbox"
                                                checked={formData.correctOptionsCsv.includes(opt)}
                                                onChange={() => {
                                                    const current = formData.correctOptionsCsv.split(",").filter(x => x);
                                                    const newValue = current.includes(opt)
                                                        ? current.filter(x => x !== opt)
                                                        : [...current, opt];
                                                    setFormData({ ...formData, correctOptionsCsv: newValue.join(",") });
                                                }}
                                                className="w-5 h-5 text-primary focus:ring-primary border-border rounded"
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                            <p className="mt-2 text-sm text-text-secondary">
                                {formData.questionType === "MCQ"
                                    ? "Select the radio button for the correct answer"
                                    : "Check all correct answers"}
                            </p>
                        </div>
                    )}

                    {formData.questionType === "FILL_BLANK" && (
                        <div>
                            <label className="block text-sm font-semibold text-text mb-2">
                                Correct Answer <span className="text-primary">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.correctAnswer}
                                onChange={(e) => setFormData({ ...formData, correctAnswer: e.target.value })}
                                className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                placeholder="Enter the correct answer"
                                required
                            />
                        </div>
                    )}
                </form>

                <div className="px-6 py-4 border-t border-border bg-surface flex justify-end space-x-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-6 py-3 text-sm font-semibold text-text-secondary hover:text-text hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-6 py-3 text-sm font-semibold text-white bg-primary hover:bg-secondary rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>{question ? 'Updating...' : 'Creating...'}</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span>{question ? 'Update Question' : 'Create Question'}</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QuestionFormModal;

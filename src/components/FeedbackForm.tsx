"use client";

import { useState } from "react";
import { createFeedback } from "@/services/feedback";
import { FiStar } from "react-icons/fi";
import { toast } from "react-toastify";

interface FeedbackFormProps {
  ticketId: number;
  onFeedbackSubmitted?: () => void;
}

export default function FeedbackForm({ ticketId, onFeedbackSubmitted }: FeedbackFormProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (rating === 0) {
      toast.error("Por favor selecciona una calificación");
      return;
    }

    setSubmitting(true);
    try {
      await createFeedback(ticketId, rating, comment);
      toast.success("¡Gracias por tu feedback!");
      setRating(0);
      setComment("");
      if (onFeedbackSubmitted) onFeedbackSubmitted();
    } catch (error: any) {
      toast.error("Error al enviar feedback: " + error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        ¿Cómo calificarías la atención recibida?
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Calificación *
          </label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="focus:outline-none"
              >
                <FiStar
                  className={`w-8 h-8 transition-colors ${
                    star <= (hoveredRating || rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300 dark:text-gray-600"
                  }`}
                />
              </button>
            ))}
            {rating > 0 && (
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                {rating === 1 && "Muy malo"}
                {rating === 2 && "Malo"}
                {rating === 3 && "Regular"}
                {rating === 4 && "Bueno"}
                {rating === 5 && "Excelente"}
              </span>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Comentarios (opcional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            placeholder="Comparte tus comentarios sobre la atención recibida..."
          />
        </div>

        <button
          type="submit"
          disabled={submitting || rating === 0}
          className="w-full bg-orange-500 dark:bg-orange-600 text-white px-6 py-2 rounded-md hover:bg-orange-600 dark:hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {submitting ? "Enviando..." : "Enviar Feedback"}
        </button>
      </form>
    </div>
  );
}

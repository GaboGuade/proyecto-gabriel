"use client";

import { useEffect, useRef } from "react";
import { FiStar } from "react-icons/fi";

type Props = {
  data: any[];
};

export default function SupportReply({ data }: Props) {
  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No hay feedback aún para este ticket.</p>
      </div>
    );
  }

  return (
    <div ref={chatContainerRef} className="space-y-4">
      {data.map((feedback: any) => {
        const userName = feedback.profiles?.full_name || feedback.profiles?.email || "Usuario";
        
        return (
          <div
            key={feedback.id}
            className="border border-gray-200 rounded-lg p-4 bg-gray-50"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-semibold">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{userName}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(feedback.created_at).toLocaleString("es-ES")}
                  </p>
                </div>
              </div>
              {feedback.rating && (
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <FiStar
                      key={star}
                      className={`w-4 h-4 ${
                        star <= feedback.rating
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
            {feedback.comment && (
              <p className="text-gray-700 mt-2">{feedback.comment}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

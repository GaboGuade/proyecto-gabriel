"use client";

import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import FeedbackForm from "./FeedbackForm";
import SupportReply from "./SupportReply";
import { getTicketFeedback } from "@/services/feedback";
import Loading from "./Loading";

type Props = {
  status: string;
  tiket_id: string;
};

export default function Feedback({ status, tiket_id }: Props) {
  const [feedbackData, setFeedbackData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeedback();
  }, [tiket_id]);

  async function loadFeedback() {
    try {
      const feedback = await getTicketFeedback(parseInt(tiket_id));
      const data = feedback ? [feedback] : [];
      setFeedbackData(data);
    } catch (error: any) {
      console.error("Error loading feedback:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border border-orange-200 rounded-lg p-4 bg-white shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-orange-600">
        Feedback del Ticket
      </h2>

      {loading ? (
        <Loading />
      ) : (
        <>
          <div className="mb-4 max-h-96 overflow-y-auto">
            <SupportReply data={feedbackData} />
          </div>

          {status === "closed" && (
            <FeedbackForm 
              ticketId={parseInt(tiket_id)}
              onFeedbackSubmitted={loadFeedback}
            />
          )}
        </>
      )}
    </div>
  );
}

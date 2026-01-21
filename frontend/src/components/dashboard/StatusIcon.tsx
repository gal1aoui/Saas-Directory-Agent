import { AlertCircle, CheckCircle, Clock, Send, XCircle } from "lucide-react";
import type React from "react";
import type { SubmissionStatus } from "../../types/schema";

interface StatusIconProps {
  status: SubmissionStatus;
}

export const StatusIcon: React.FC<StatusIconProps> = ({ status }) => {
  const iconClass = "h-5 w-5";

  switch (status) {
    case "approved":
      return <CheckCircle className={`${iconClass} text-green-600`} />;
    case "submitted":
      return <Send className={`${iconClass} text-blue-600`} />;
    case "pending":
      return <Clock className={`${iconClass} text-yellow-600`} />;
    case "failed":
      return <XCircle className={`${iconClass} text-red-600`} />;
    case "rejected":
      return <XCircle className={`${iconClass} text-red-600`} />;
    default:
      return <AlertCircle className={`${iconClass} text-gray-600`} />;
  }
};

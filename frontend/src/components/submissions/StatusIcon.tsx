import { CheckCircle, Clock, Send, XCircle } from "lucide-react";
import type React from "react";
import type { SubmissionStatus } from "../../types/schema";

interface StatusIconProps {
  status: SubmissionStatus;
  className?: string;
}

export const StatusIcon: React.FC<StatusIconProps> = ({
  status,
  className,
}) => {
  const iconClass = `h-3 w-3 ${className || ""}`;

  switch (status) {
    case "approved":
      return <CheckCircle className={iconClass} />;
    case "submitted":
      return <Send className={iconClass} />;
    case "pending":
      return <Clock className={iconClass} />;
    case "failed":
    case "rejected":
      return <XCircle className={iconClass} />;
    default:
      return null;
  }
};

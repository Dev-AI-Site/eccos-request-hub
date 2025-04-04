
import React from "react";
import { RequestStatus } from "@/lib/requestService";
import { Badge } from "@/components/ui/badge";

interface RequestStatusBadgeProps {
  status: RequestStatus;
}

const RequestStatusBadge: React.FC<RequestStatusBadgeProps> = ({ status }) => {
  const getStatusColor = () => {
    switch (status) {
      case "Pendente":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
      case "Aprovado":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      case "Reprovado":
        return "bg-red-100 text-red-800 hover:bg-red-100";
      case "Em Andamento":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100";
      case "Concluida":
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
      case "Cancelado":
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    }
  };

  return (
    <Badge variant="outline" className={`${getStatusColor()} border-0`}>
      {status}
    </Badge>
  );
};

export default RequestStatusBadge;

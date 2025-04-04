
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "./firebase";
import { Request, RequestStatus } from "./requestService";
import { UserData } from "./authService";

// Função para enviar email (mock - integraria com um serviço real)
export const sendEmail = async (
  to: string[],
  subject: string,
  body: string
): Promise<void> => {
  console.log("Sending email:", { to, subject, body });
  
  // No ambiente de produção, isso chamaria uma função de backend
  // que usaria o nodemailer ou outro serviço para envio real
  
  // Mock do envio para implementação futura:
  /*
  const response = await fetch('/api/send-email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to,
      subject,
      body,
      from: 'suporte@colegioeccos.com.br',
      pass: 'qtem cnbl usky ptpc'
    }),
  });
  
  if (!response.ok) {
    throw new Error('Falha ao enviar email');
  }
  */
};

// Enviar notificação de nova solicitação para todos os admins
export const sendRequestNotification = async (request: Request): Promise<void> => {
  try {
    // Get all admin emails
    const adminsQuery = query(
      collection(db, "users"),
      where("role", "==", "admin")
    );
    
    const querySnapshot = await getDocs(adminsQuery);
    const adminEmails = querySnapshot.docs.map(doc => doc.data().email as string);
    
    if (adminEmails.length === 0) return;
    
    const subject = `Nova solicitação de ${request.type} - ECCOS RequestHub`;
    
    let body = `
      <h1>Nova solicitação recebida</h1>
      <p><strong>Tipo:</strong> ${request.type}</p>
      <p><strong>Solicitante:</strong> ${request.userName} (${request.userEmail})</p>
    `;
    
    // Adicionar detalhes específicos por tipo
    if (request.type === "Compra") {
      body += `
        <p><strong>Finalidade:</strong> ${(request as any).purpose}</p>
        <p><strong>Valor Total:</strong> R$ ${(request as any).totalPrice.toFixed(2)}</p>
      `;
    } else if (request.type === "Suporte") {
      body += `
        <p><strong>Unidade:</strong> ${(request as any).unit}</p>
        <p><strong>Local:</strong> ${(request as any).location}</p>
        <p><strong>Categoria:</strong> ${(request as any).category}</p>
      `;
    } else if (request.type === "Reserva") {
      body += `
        <p><strong>Equipamento:</strong> ${(request as any).equipmentName} (${(request as any).equipmentType})</p>
        <p><strong>Data:</strong> ${(request as any).date.toLocaleDateString()}</p>
        <p><strong>Horário:</strong> ${(request as any).startTime} às ${(request as any).endTime}</p>
        <p><strong>Local:</strong> ${(request as any).location}</p>
      `;
    }
    
    body += `
      <p>Acesse a plataforma para visualizar mais detalhes e responder a solicitação.</p>
      <p>Atenciosamente,<br>ECCOS RequestHub</p>
    `;
    
    await sendEmail(adminEmails, subject, body);
  } catch (error) {
    console.error("Error sending request notification:", error);
  }
};

// Enviar notificação de mudança de status
export const sendStatusChangeNotification = async (
  request: Request,
  newStatus: RequestStatus,
  adminEmail: string
): Promise<void> => {
  try {
    const userEmail = request.userEmail;
    
    const subject = `Atualização na sua solicitação de ${request.type} - ECCOS RequestHub`;
    
    const statusText = newStatus === "Aprovado" 
      ? "aprovada" 
      : newStatus === "Reprovado" 
      ? "reprovada" 
      : "atualizada";
    
    const body = `
      <h1>Atualização de Solicitação</h1>
      <p>Olá ${request.userName},</p>
      <p>Sua solicitação de ${request.type.toLowerCase()} foi ${statusText} por um administrador.</p>
      <p><strong>Status atual:</strong> ${newStatus}</p>
      <p>Acesse a plataforma para mais detalhes.</p>
      <p>Atenciosamente,<br>ECCOS RequestHub</p>
    `;
    
    await sendEmail([userEmail], subject, body);
  } catch (error) {
    console.error("Error sending status change notification:", error);
  }
};

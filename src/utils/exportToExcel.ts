import * as XLSX from 'xlsx';

interface TicketExport {
  ID: number;
  Título: string;
  Descripción: string;
  Estado: string;
  Prioridad: string;
  Categoría: string;
  Creado_Por: string;
  Email_Creador: string;
  Asignado_A: string;
  Fecha_Creación: string;
  Fecha_Actualización: string;
}

export function exportTicketsToExcel(tickets: any[], filename: string = 'tickets') {
  // Preparar datos para exportar
  const exportData: TicketExport[] = tickets.map((ticket) => ({
    ID: ticket.id || '',
    Título: ticket.title || '',
    Descripción: ticket.description || '',
    Estado: ticket.status === 'open' ? 'Abierto' : 
            ticket.status === 'pending' ? 'Pendiente' : 
            ticket.status === 'closed' ? 'Cerrado' : ticket.status || '',
    Prioridad: ticket.priority === 'high' ? 'Alta' : 
               ticket.priority === 'medium' ? 'Media' : 
               ticket.priority === 'low' ? 'Baja' : ticket.priority || '',
    Categoría: ticket.categories?.name || ticket.categories?.type || 'Sin categoría',
    Creado_Por: ticket.profiles?.full_name || ticket.profiles?.email || 'Usuario desconocido',
    Email_Creador: ticket.profiles?.email || '',
    Asignado_A: ticket.assigned_to ? 'Asignado' : 'Sin asignar',
    Fecha_Creación: ticket.created_at 
      ? new Date(ticket.created_at).toLocaleString('es-ES', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })
      : '',
    Fecha_Actualización: ticket.updated_at 
      ? new Date(ticket.updated_at).toLocaleString('es-ES', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })
      : '',
  }));

  // Crear workbook y worksheet
  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Tickets');

  // Ajustar ancho de columnas
  const columnWidths = [
    { wch: 8 },   // ID
    { wch: 30 },  // Título
    { wch: 50 },  // Descripción
    { wch: 12 },  // Estado
    { wch: 12 },  // Prioridad
    { wch: 20 },  // Categoría
    { wch: 25 },  // Creado Por
    { wch: 30 },  // Email Creador
    { wch: 15 },  // Asignado A
    { wch: 20 },  // Fecha Creación
    { wch: 20 },  // Fecha Actualización
  ];
  worksheet['!cols'] = columnWidths;

  // Generar nombre de archivo con fecha
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0];
  const finalFilename = `${filename}_${dateStr}.xlsx`;

  // Descargar archivo
  XLSX.writeFile(workbook, finalFilename);
}

// Exportar un solo ticket a Excel
export function exportSingleTicketToExcel(ticket: any) {
  const createdDate = ticket.created_at ? new Date(ticket.created_at) : new Date();
  const dateStr = createdDate.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const timeStr = createdDate.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const priorityText = ticket.priority === 'high' ? 'Urgente' : 
                       ticket.priority === 'medium' ? 'Medio' : 
                       ticket.priority === 'low' ? 'Bajo' : ticket.priority || 'Medio';

  const exportData = [{
    'Nombre': ticket.profiles?.full_name || ticket.profiles?.email || 'Usuario desconocido',
    'Fecha': dateStr,
    'Hora': timeStr,
    'Título del Ticket': ticket.title || '',
    'Categoría': ticket.categories?.name || ticket.categories?.type || 'Sin categoría',
    'Descripción': ticket.description || '',
    'Prioridad': priorityText
  }];

  // Crear workbook y worksheet
  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Ticket');

  // Ajustar ancho de columnas
  const columnWidths = [
    { wch: 25 },  // Nombre
    { wch: 12 },  // Fecha
    { wch: 10 },  // Hora
    { wch: 40 },  // Título
    { wch: 20 },  // Categoría
    { wch: 60 },  // Descripción
    { wch: 12 },  // Prioridad
  ];
  worksheet['!cols'] = columnWidths;

  // Generar nombre de archivo
  const filename = `ticket_${ticket.id}_${dateStr.replace(/\//g, '-')}.xlsx`;

  // Descargar archivo
  XLSX.writeFile(workbook, filename);
}


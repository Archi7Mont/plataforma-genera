import jsPDF from 'jspdf';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export interface ExportData {
  configuracion: any;
  respuestas: Record<string, string>;
  fecha: string;
  resultados: any;
}

export const exportToPDF = (data: ExportData) => {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 48;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const addPageIfNeeded = (needed: number) => {
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };
  const writeWrapped = (text: string, x: number, maxWidth: number, lineHeight = 14, color = '#4B5563', fontSize = 11) => {
    doc.setTextColor(color);
    doc.setFontSize(fontSize);
    const lines = doc.splitTextToSize(text, maxWidth);
    lines.forEach((line: string) => { addPageIfNeeded(lineHeight); doc.text(line, x, y); y += lineHeight; });
  };

  // Título
  doc.setFontSize(20); doc.setTextColor('#0F766E');
  doc.text('IMPGPP', pageWidth/2, y, { align: 'center' }); y += 20;
  doc.setFontSize(12); doc.setTextColor('#6B7280');
  doc.text('Índice Multidimensional de Políticas Públicas con Perspectiva de Género', pageWidth/2, y, { align: 'center' }); y += 24;

  // Caja configuración (2 columnas)
  const boxH = 160;
  doc.setDrawColor('#D1FAE5'); doc.setFillColor('#F0FDFA');
  doc.roundedRect(margin, y, contentWidth, boxH, 6, 6, 'FD');
  doc.setTextColor('#134E4A'); doc.setFontSize(13);
  doc.text('Información de Configuración', margin + 16, y + 22);
  doc.setFontSize(11); doc.setTextColor('#0F766E');
  const leftX = margin + 16, rightX = margin + contentWidth/2 + 8; const colW = contentWidth/2 - 24; let yL = y + 40, yR = y + 40;
  const left = [
    `Organismo Auditado: ${data.configuracion.institucionAuditada}`,
    `Política Pública: ${data.configuracion.politicaPublicaAuditada}`,
  ];
  const right = [
    `Período Auditado: ${data.configuracion.anoPeriodoAuditado}`,
    `Fecha de Evaluación: ${data.fecha}`,
  ];
  left.forEach(t => { doc.text(doc.splitTextToSize(t, colW) as any, leftX, yL); yL += 24; });
  right.forEach(t => { doc.text(doc.splitTextToSize(t, colW) as any, rightX, yR); yR += 24; });
  y = Math.max(yL, yR) + 12;

  // Caja resultados globales
  doc.setFillColor('#E6FFFA'); doc.setDrawColor('#99F6E4');
  doc.roundedRect(margin, y, contentWidth, 90, 6, 6, 'FD');
  doc.setTextColor('#115E59'); doc.setFontSize(13);
  doc.text('Resultados Globales', margin + 16, y + 22);
  doc.setTextColor('#0F766E'); doc.setFontSize(18); doc.text(`${data.resultados.totalPuntos.toFixed(0)}`, margin + 16, y + 50);
  doc.setTextColor('#6B7280'); doc.setFontSize(11); doc.text(`de ${data.resultados.maxPuntos.toFixed(0)} puntos`, margin + 70, y + 50);
  doc.setTextColor('#0F766E'); doc.setFontSize(16); doc.text(`${data.resultados.porcentajeGlobal.toFixed(1)}%`, margin + contentWidth - 80, y + 50, { align: 'right' });
  doc.setTextColor('#0F766E'); doc.setFontSize(12); doc.text(`Nivel: ${data.resultados.categoriaGlobal}`, margin + 16, y + 72);
  y += 110;

  // Dimensiones → subdimensiones → indicadores
  doc.setTextColor('#111827'); doc.setFontSize(13); doc.text('Resultados por Dimensión', margin, y); y += 16;
  data.resultados.dimensiones.forEach((dim: any) => {
    addPageIfNeeded(40);
    doc.setFillColor('#14B8A6'); doc.rect(margin, y + 10, contentWidth, 6, 'F');
    doc.setTextColor('#0F172A'); doc.setFontSize(12); doc.text(`${dim.id}. ${dim.nombre}`, margin, y + 8);
    doc.setTextColor('#334155'); doc.text(`${dim.puntaje.toFixed(0)} / ${dim.maxPuntaje.toFixed(0)}`, margin + contentWidth, y + 8, { align: 'right' });
    y += 30;

    (dim.subdimensiones || []).forEach((sd: any) => {
      addPageIfNeeded(28); doc.setTextColor('#0F172A'); doc.setFontSize(12); doc.text(`${sd.id}. ${sd.nombre}`, margin, y); y += 6;
      doc.setDrawColor('#E5E7EB'); doc.line(margin, y + 6, margin + contentWidth, y + 6); y += 18;
      (sd.indicadores || []).forEach((ind: any) => {
        const r = data.respuestas[ind.id]; const op = ind.opciones.find((o: any) => o.valor === r);
        const max = Math.max(...ind.opciones.filter((o: any) => o.valor !== 'No aplica').map((o: any) => o.puntaje || 0));
        addPageIfNeeded(28);
        writeWrapped(`${ind.id}. ${ind.texto}`, margin + 8, contentWidth - 16, 14, '#374151', 11);
        writeWrapped(`Respuesta: ${r || '—'}   Puntos: ${(op?.puntaje || 0)} / ${max}`, margin + 20, contentWidth - 32, 13, '#6B7280', 10);
        y += 8; addPageIfNeeded(16);
      });
      y += 8;
    });
    y += 8;
  });

  // Caja No Aplica
  const noAplica: Array<{d:string; dn:string; sd:string; sdn:string; id:string; t:string;}> = [];
  data.resultados.dimensiones.forEach((d: any) => d.subdimensiones.forEach((sd: any) => sd.indicadores.forEach((ind: any) => { const r = data.respuestas[ind.id]; if (r === 'No aplica') noAplica.push({ d: d.id, dn: d.nombre, sd: sd.id, sdn: sd.nombre, id: ind.id, t: ind.texto }); })));
  if (noAplica.length) {
    doc.addPage(); y = margin;
    doc.setTextColor('#374151'); doc.setFontSize(13); doc.text('Indicadores No Aplica', margin, y); y += 14;
    noAplica.forEach(it => { writeWrapped(`${it.d} ${it.dn} > ${it.sd} ${it.sdn} > ${it.id}: ${it.t}`, margin, contentWidth, 12, '#4B5563', 10); y += 4; });
  }

  // Footer
  const foot1 = 'Informe generado en el Sistema Informático Géner.A';
  const foot2 = 'Desarrollado por EFSUR Argentina, Version 1.0';
  const footerY = pageHeight - 24; const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) { doc.setPage(i); doc.setFontSize(9); doc.setTextColor('#6B7280'); doc.text(foot1, pageWidth/2, footerY - 12, { align: 'center' }); doc.text(foot2, pageWidth/2, footerY, { align: 'center' }); }

  doc.save(`IMPGPP_Resultados_${data.configuracion.institucionAuditada.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0,10)}.pdf`);
};

export const exportToExcel = async (data: ExportData) => {
  // Consolidated single sheet mirroring the page
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Resultados');

  worksheet.addRow(['Géner.A.']);
  worksheet.addRow(['IMPGPP - Índice Multidimensional de Políticas Públicas con Perspectiva de Género']);
  worksheet.addRow(['']);
  worksheet.addRow(['INFORMACIÓN DE CONFIGURACIÓN']);
  worksheet.addRow(['Organismo Auditado', data.configuracion.institucionAuditada]);
  worksheet.addRow(['Política Pública Auditada', data.configuracion.politicaPublicaAuditada]);
  worksheet.addRow(['Período Auditado', data.configuracion.anoPeriodoAuditado]);
  worksheet.addRow(['Fecha de Evaluación', data.fecha]);
  worksheet.addRow(['']);
  worksheet.addRow(['RESULTADOS GLOBALES']);
  worksheet.addRow(['Puntaje Global', data.resultados.totalPuntos.toFixed(0)]);
  worksheet.addRow(['Puntos Máximos', data.resultados.maxPuntos.toFixed(0)]);
  worksheet.addRow(['Porcentaje Global', `${data.resultados.porcentajeGlobal.toFixed(1)}%`]);
  worksheet.addRow(['Nivel Global', data.resultados.categoriaGlobal]);
  worksheet.addRow(['']);
  worksheet.addRow(['RESULTADOS POR DIMENSIÓN']);
  worksheet.addRow(['Dimensión', 'Subdimensión', 'Indicador', 'Pregunta', 'Respuesta', 'Puntos', 'Máximo', 'Nivel']);

  data.resultados.dimensiones.forEach((dim: any) => {
    worksheet.addRow([`${dim.id}. ${dim.nombre}`, '', '', '', '', '', '', `${dim.categoria}`]);
    (dim.subdimensiones || []).forEach((sd: any) => {
      // compute sub scores
      let subTotal = 0, subMax = 0;
      (sd.indicadores || []).forEach((ind: any) => {
        const resp = data.respuestas[ind.id]; const op = ind.opciones.find((o: any) => o.valor === resp);
        const max = Math.max(...ind.opciones.filter((o: any) => o.valor !== 'No aplica').map((o: any) => o.puntaje || 0));
        if (resp !== 'No aplica' && op) subTotal += op.puntaje; subMax += max;
      });
      worksheet.addRow(['', `${sd.id}. ${sd.nombre}`, '', '', '', subTotal, subMax, ``]);
      (sd.indicadores || []).forEach((ind: any) => {
        const resp = data.respuestas[ind.id]; const op = ind.opciones.find((o: any) => o.valor === resp);
        const max = Math.max(...ind.opciones.filter((o: any) => o.valor !== 'No aplica').map((o: any) => o.puntaje || 0));
        worksheet.addRow(['', '', ind.id, ind.texto, resp || '—', op?.puntaje || 0, max, '']);
      });
    });
  });
  
  // No aplica
  const noAplica: Array<{d:string; dn:string; sd:string; sdn:string; id:string; t:string;}> = [];
  data.resultados.dimensiones.forEach((d: any) => d.subdimensiones.forEach((sd: any) => sd.indicadores.forEach((ind: any) => { const r = data.respuestas[ind.id]; if (r === 'No aplica') noAplica.push({ d: d.id, dn: d.nombre, sd: sd.id, sdn: sd.nombre, id: ind.id, t: ind.texto }); })));
  worksheet.addRow(['']); worksheet.addRow(['INDICADORES NO APLICA']); worksheet.addRow(['Dimensión', 'Subdimensión', 'Indicador', 'Pregunta']);
  noAplica.forEach(i => worksheet.addRow([`${i.d}. ${i.dn}`, `${i.sd}. ${i.sdn}`, i.id, i.t]));

  // Save the file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `IMPGPP_Resultados_${data.configuracion.institucionAuditada.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0,10)}.xlsx`);
};

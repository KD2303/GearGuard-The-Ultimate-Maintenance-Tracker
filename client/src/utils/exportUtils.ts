import Papa from 'papaparse';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export type ExportValue = string | number | boolean | null | undefined | Date;

export type ExportColumn<T> = {
  header: string;
  value: (row: T) => ExportValue;
};

type CsvOptions = {
  filename?: string;
};

type PdfOptions = {
  filename?: string;
  title?: string;
};

function toYYYYMMDD(date = new Date()): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function defaultFilename(ext: 'csv' | 'pdf'): string {
  return `data_export_${toYYYYMMDD()}.${ext}`;
}

function formatValue(value: ExportValue): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  const str = String(value);
  // Prevent CSV/Excel formula injection for values that start with special chars.
  if (/^[=\-+@]/.test(str)) return `'${str}`;
  return str;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function exportCSV<T>(rows: readonly T[], columns: readonly ExportColumn<T>[], options: CsvOptions = {}) {
  if (!rows || rows.length === 0) return;
  if (!columns || columns.length === 0) return;

  const data = rows.map((row) => {
    const record: Record<string, string> = {};
    for (const col of columns) {
      record[col.header] = formatValue(col.value(row));
    }
    return record;
  });

  const csv = Papa.unparse(data, {
    quotes: true,
    skipEmptyLines: true,
    delimiter: ',',
    newline: '\r\n',
  });

  // UTF-8 BOM for Excel compatibility + special characters.
  const withBom = `\uFEFF${csv}`;
  const blob = new Blob([withBom], { type: 'text/csv;charset=utf-8' });
  triggerDownload(blob, options.filename ?? defaultFilename('csv'));
}

function buildOffscreenTable<T>(rows: readonly T[], columns: readonly ExportColumn<T>[], title?: string) {
  const wrapper = document.createElement('div');
  wrapper.style.position = 'fixed';
  wrapper.style.left = '-10000px';
  wrapper.style.top = '0';
  wrapper.style.width = '794px'; // ~A4 width at 96dpi
  wrapper.style.background = '#ffffff';
  wrapper.style.color = '#111827';
  wrapper.style.padding = '16px';
  wrapper.style.fontFamily =
    'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"';

  if (title) {
    const h = document.createElement('div');
    h.textContent = title;
    h.style.fontSize = '16px';
    h.style.fontWeight = '600';
    h.style.marginBottom = '12px';
    wrapper.appendChild(h);
  }

  const table = document.createElement('table');
  table.style.width = '100%';
  table.style.borderCollapse = 'collapse';
  table.style.fontSize = '10px';

  const thead = document.createElement('thead');
  const trh = document.createElement('tr');
  for (const col of columns) {
    const th = document.createElement('th');
    th.textContent = col.header;
    th.style.textAlign = 'left';
    th.style.padding = '8px';
    th.style.border = '1px solid #E5E7EB';
    th.style.background = '#F3F4F6';
    th.style.fontWeight = '600';
    trh.appendChild(th);
  }
  thead.appendChild(trh);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  for (const row of rows) {
    const tr = document.createElement('tr');
    for (const col of columns) {
      const td = document.createElement('td');
      td.textContent = formatValue(col.value(row));
      td.style.padding = '8px';
      td.style.border = '1px solid #E5E7EB';
      td.style.verticalAlign = 'top';
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  wrapper.appendChild(table);

  return wrapper;
}

export async function exportPDF<T>(
  rows: readonly T[],
  columns: readonly ExportColumn<T>[],
  options: PdfOptions = {}
) {
  if (!rows || rows.length === 0) return;
  if (!columns || columns.length === 0) return;

  const filename = options.filename ?? defaultFilename('pdf');
  const node = buildOffscreenTable(rows, columns, options.title);
  document.body.appendChild(node);

  try {
    const scale = rows.length > 300 ? 1.25 : 2;
    const canvas = await html2canvas(node, {
      backgroundColor: '#ffffff',
      scale,
      useCORS: true,
      logging: false,
      windowWidth: node.scrollWidth,
      windowHeight: node.scrollHeight,
    });

    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const margin = 24;
    const usableWidth = pageWidth - margin * 2;
    const usableHeight = pageHeight - margin * 2;

    const imgWidth = usableWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let y = margin;
    let remaining = imgHeight;
    let position = 0;

    while (remaining > 0) {
      pdf.addImage(imgData, 'PNG', margin, y - position, imgWidth, imgHeight, undefined, 'FAST');
      remaining -= usableHeight;
      position += usableHeight;
      if (remaining > 0) pdf.addPage();
    }

    pdf.save(filename);
  } finally {
    node.remove();
  }
}


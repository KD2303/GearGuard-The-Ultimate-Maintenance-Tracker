import API from './api';

// Helper: triggers file download from a blob response
const downloadFile = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

const getDateStamp = () => new Date().toISOString().split('T')[0];

export const exportEquipmentExcel = async () => {
  const response = await API.get('/export/equipment', {
    responseType: 'blob',
  });
  downloadFile(
    new Blob([response.data]),
    `equipment-report-${getDateStamp()}.xlsx`
  );
};

export const exportRequestsExcel = async (params?: Record<string, string>) => {
  const query = params
    ? '?' + new URLSearchParams(params).toString()
    : '';
  const response = await API.get(`/export/requests${query}`, {
    responseType: 'blob',
  });
  downloadFile(
    new Blob([response.data]),
    `maintenance-requests-${getDateStamp()}.xlsx`
  );
};

export const exportEquipmentPDF = async (
  equipmentId: string,
  equipmentName: string
) => {
  const response = await API.get(`/export/equipment/${equipmentId}/pdf`, {
    responseType: 'blob',
  });
  const safeName = equipmentName.replace(/\s+/g, '-');
  downloadFile(
    new Blob([response.data], { type: 'application/pdf' }),
    `${safeName}-report-${getDateStamp()}.pdf`
  );
};

import api from './api';

export const uploadService = {
  uploadAttachments: async (
    files: File[]
  ) => {
    const formData =
      new FormData();

    files.forEach((file) => {
      formData.append(
        'attachments',
        file
      );
    });

    const response =
      await api.post(
        '/upload/attachments',
        formData,
        {
          headers: {
            'Content-Type':
              'multipart/form-data',
          },
        }
      );

    return response.data;
  },
};
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/predictive';

export const getHighRiskEquipment = async () => {

  const response = await axios.get(
    `${API_URL}/high-risk`
  );

  return response.data;
};
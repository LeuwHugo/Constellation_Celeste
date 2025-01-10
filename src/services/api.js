import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

// Fonction pour récupérer les données des étoiles
export const fetchStars = async () => {
  try {
    const response = await axios.get(`${API_URL}/stars`);
    return response.data;
  } catch (error) {
    console.error("Erreur lors de la récupération des étoiles :", error);
    throw error;
  }
};
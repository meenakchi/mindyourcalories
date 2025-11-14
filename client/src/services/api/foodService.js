import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Analyze meal image
export const analyzeMealImage = async (imageFile) => {
  try {
    const formData = new FormData();
    
    // Convert base64 to blob if needed
    if (typeof imageFile === 'string' && imageFile.startsWith('data:image')) {
      const blob = await fetch(imageFile).then(r => r.blob());
      formData.append('image', blob, 'meal.jpg');
    } else {
      formData.append('image', imageFile);
    }

    const response = await axios.post(`${API_URL}/food/analyze-meal`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    return response.data;

  } catch (error) {
    console.error('Meal analysis error:', error);
    throw new Error(error.response?.data?.message || 'Failed to analyze meal');
  }
};

// Search food manually
export const searchFood = async (query) => {
  try {
    const response = await axios.get(`${API_URL}/food/search`, {
      params: { q: query, limit: 10 }
    });

    return response.data.results;

  } catch (error) {
    console.error('Food search error:', error);
    throw new Error('Failed to search food');
  }
};

// Test APIs
export const testAPIs = async () => {
  try {
    const [clarifai, usda] = await Promise.all([
      axios.get(`${API_URL}/food/test-clarifai`),
      axios.get(`${API_URL}/food/test-usda`)
    ]);

    return {
      clarifai: clarifai.data.success,
      usda: usda.data.success
    };
  } catch (error) {
    return { clarifai: false, usda: false };
  }
};
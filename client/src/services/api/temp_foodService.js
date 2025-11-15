import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Import local database
let localFoodDatabase = [];
let mealSuggestions = {};

// Load local data
const loadLocalData = async () => {
  try {
    const [foodDb, suggestions] = await Promise.all([
      import('../../data/foodDatabase.json'),
      import('../../data/mealSuggestions.json')
    ]);
    localFoodDatabase = foodDb.default;
    mealSuggestions = suggestions.default;
    console.log('✅ Loaded local database:', localFoodDatabase.length, 'foods');
  } catch (error) {
    console.error('❌ Error loading local data:', error);
  }
};

loadLocalData();

// Analyze meal image
export const analyzeMealImage = async (imageFile) => {
  try {
    const formData = new FormData();
    
    if (typeof imageFile === 'string' && imageFile.startsWith('data:image')) {
      const blob = await fetch(imageFile).then(r => r.blob());
      formData.append('image', blob, 'meal.jpg');
    } else {
      formData.append('image', imageFile);
    }

    const response = await axios.post(`${API_URL}/food/analyze-meal`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000
    });

    return response.data;

  } catch (error) {
    console.error('Meal analysis error:', error);
    throw new Error(error.response?.data?.message || 'Failed to analyze meal');
  }
};

// Search food (API + Local)
export const searchFood = async (query) => {
  try {
    // First try API
    const response = await axios.get(`${API_URL}/food/search`, {
      params: { q: query, limit: 5 },
      timeout: 5000
    });

    let results = response.data.results || [];
    
    // Also search local database
    const localResults = searchLocalDatabase(query);
    
    // Combine and deduplicate
    const combined = [...results, ...localResults];
    const unique = combined.filter((item, index, self) =>
      index === self.findIndex((t) => t.name.toLowerCase() === item.name.toLowerCase())
    );

    return unique.slice(0, 10);

  } catch (error) {
    console.error('API search failed, using local only:', error.message);
    // Fallback to local database only
    return searchLocalDatabase(query);
  }
};

// Search local database
export const searchLocalDatabase = (query) => {
  if (!query || localFoodDatabase.length === 0) return [];
  
  const searchTerm = query.toLowerCase();
  
  return localFoodDatabase
    .filter(food => 
      food.name.toLowerCase().includes(searchTerm) ||
      food.category?.toLowerCase().includes(searchTerm)
    )
    .slice(0, 10);
};

// Get food by ID from local database
export const getFoodById = (foodId) => {
  return localFoodDatabase.find(food => food.id === foodId);
};

// Get meal suggestions
export const getMealSuggestions = (mealType, remainingCalories) => {
  const suggestions = mealSuggestions[mealType] || [];
  
  // Filter by remaining calories if provided
  if (remainingCalories) {
    return suggestions.filter(meal => meal.calories <= remainingCalories);
  }
  
  return suggestions;
};

// Get popular foods
export const getPopularFoods = (category = null) => {
  if (category) {
    return localFoodDatabase.filter(food => food.category === category).slice(0, 10);
  }
  return localFoodDatabase.slice(0, 20);
};

// Get food categories
export const getFoodCategories = () => {
  const categories = [...new Set(localFoodDatabase.map(food => food.category))];
  return categories.filter(cat => cat && cat !== 'general');
};

// Calculate nutrition for multiple foods
export const calculateTotalNutrition = (foods) => {
  return foods.reduce(
    (acc, food) => ({
      calories: acc.calories + (food.calories || 0),
      protein: acc.protein + (food.protein || 0),
      carbs: acc.carbs + (food.carbs || 0),
      fats: acc.fats + (food.fats || 0)
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );
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
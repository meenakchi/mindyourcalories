import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Search, Plus, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import CameraCapture from '../components/camera/CameraCapture';
import FoodCard from '../components/food/FoodCard';
import Button from '../components/common/Button';
import { analyzeMealImage, searchFood } from '../services/api/temp_foodService';
import { saveMealToFirestore } from '../services/firebase/firestore';

const LogMeal = () => {
  const navigate = useNavigate();
  const [showCamera, setShowCamera] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recognizedFoods, setRecognizedFoods] = useState([]);
  const [selectedFoods, setSelectedFoods] = useState([]);
  const [mealType, setMealType] = useState('breakfast');
  const [searchQuery, setSearchQuery] = useState('');

  const handlePhotoCapture = async (imageData) => {
    setIsProcessing(true);
    try {
      const blob = await fetch(imageData).then(r => r.blob());
      const response = await analyzeMealImage(blob);
      
      if (response.success && response.foods.length > 0) {
        setRecognizedFoods(response.foods);
        toast.success(`Found ${response.foods.length} food items!`);
      } else {
        toast.error('No food detected. Try manual search.');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to recognize food. Try manual search.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a food name');
      return;
    }
    
    setIsProcessing(true);
    try {
      console.log('🔍 Searching for:', searchQuery);
      const results = await searchFood(searchQuery);
      
      console.log('📊 Search results:', results);
      
      if (results && results.length > 0) {
        setRecognizedFoods(results);
        toast.success(`Found ${results.length} results!`);
      } else {
        toast.error('No results found. Try a different search.');
        setRecognizedFoods([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed. Please try again.');
      setRecognizedFoods([]);
    } finally {
      setIsProcessing(false);
    }
  };

  const addFoodToMeal = (food, portion = 1) => {
    const foodWithPortion = {
      ...food,
      portion,
      calories: Math.round(food.calories * portion),
      protein: Math.round(food.protein * portion),
      carbs: Math.round(food.carbs * portion),
      fats: Math.round(food.fats * portion)
    };
    
    setSelectedFoods([...selectedFoods, foodWithPortion]);
    toast.success(`Added ${food.name}`);
    
    // Clear search after adding
    setSearchQuery('');
    setRecognizedFoods([]);
  };

  const removeFoodFromMeal = (index) => {
    const newFoods = selectedFoods.filter((_, i) => i !== index);
    setSelectedFoods(newFoods);
    toast.success('Food removed');
  };

  const updatePortion = (index, newPortion) => {
    const newFoods = [...selectedFoods];
    const food = newFoods[index];
    const originalPortion = food.portion || 1;
    const baseCals = food.calories / originalPortion;
    
    food.portion = newPortion;
    food.calories = Math.round(baseCals * newPortion);
    food.protein = Math.round((food.protein / originalPortion) * newPortion);
    food.carbs = Math.round((food.carbs / originalPortion) * newPortion);
    food.fats = Math.round((food.fats / originalPortion) * newPortion);
    
    setSelectedFoods(newFoods);
  };

  const totals = selectedFoods.reduce(
    (acc, food) => ({
      calories: acc.calories + food.calories,
      protein: acc.protein + food.protein,
      carbs: acc.carbs + food.carbs,
      fats: acc.fats + food.fats
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );

  const saveMeal = async () => {
    if (selectedFoods.length === 0) {
      toast.error('Add at least one food item');
      return;
    }

    setIsProcessing(true);
    try {
      await saveMealToFirestore({
        foods: selectedFoods,
        mealType,
        totals,
        timestamp: new Date()
      });
      
      toast.success('Meal logged successfully!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to save meal');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-6">
      {showCamera && (
        <CameraCapture
          onCapture={handlePhotoCapture}
          onClose={() => setShowCamera(false)}
        />
      )}

      <div className="bg-gradient-primary shadow-sm">
        <div className="container-custom py-4">
          <h1 className="text-2xl font-bold text-gray-800">Log Meal</h1>
          <p className="text-gray-600 mt-1">Snap a photo or search manually</p>
        </div>
      </div>

      <div className="container-custom py-6 space-y-6">
        {/* Meal Type */}
        <div className="card">
          <label className="block text-black font-semibold text-gray-700 mb-3">
            Meal Type
          </label>
          <div className="grid grid-cols-4 gap-2">
            {['breakfast', 'lunch', 'dinner', 'snack'].map((type) => (
              <button
                key={type}
                onClick={() => setMealType(type)}
                className={`py-2 px-4 rounded-lg font-medium capitalize transition ${
                  mealType === type
                    ? 'bg-primary text-black'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Input Methods */}
        <div className="grid md:grid-cols-2 gap-4">
          <button
            onClick={() => setShowCamera(true)}
            className="card hover:shadow-lg transition flex flex-col items-center justify-center py-8 bg-gradient-secondary text-black cursor-pointer"
          >
            <Camera size={48} className="mb-3" />
            <span className="text-lg font-semibold">Take Photo</span>
          </button>

          <div className="card bg-gradient-secondary text-black">
            <div className="flex flex-col h-full justify-center">
              <Search size={48} className="mb-3 mx-auto" />
              <span className="text-lg font-semibold text-center mb-4">
                Search Food
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g., chicken breast"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1 px-4 py-2 rounded-lg text-gray-800 placeholder-gray-400"
                />
           <Button 
  onClick={handleSearch} 
  isLoading={isProcessing}
  disabled={!searchQuery.trim()}
  className="!bg-gray-200 hover:!bg-gray-300 !text-black border border-gray-400 transition-colors duration-200"
>
  Go
</Button>

              </div>
            </div>
          </div>
        </div>

        {/* Processing */}
        {isProcessing && (
          <div className="card text-center py-8">
            <div className="spinner mx-auto mb-4"></div>
            <p className="text-gray-600">Processing...</p>
          </div>
        )}

        {/* Recognized Foods */}
        {recognizedFoods.length > 0 && !isProcessing && (
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">
              Found {recognizedFoods.length} Food{recognizedFoods.length !== 1 ? 's' : ''}
            </h3>
            <div className="space-y-3">
              {recognizedFoods.map((food, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-lg">{food.name}</p>
                    <div className="flex gap-4 mt-2 text-sm text-gray-600">
                      <span className="font-medium text-primary">{food.calories} cal</span>
                      <span>{food.protein}g protein</span>
                      <span>{food.carbs}g carbs</span>
                      <span>{food.fats}g fats</span>
                    </div>
                    {food.serving && (
                      <p className="text-xs text-gray-500 mt-1">Serving: {food.serving}</p>
                    )}
                    {food.confidence && (
                      <span className="inline-block mt-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                        {food.confidence}% match
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => addFoodToMeal(food)}
                    className="p-3 bg-primary text-white rounded-full hover:bg-red-600 transition ml-4 flex-shrink-0"
                    title="Add to meal"
                  >
                    <Plus size={24} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Results Message */}
        {recognizedFoods.length === 0 && searchQuery && !isProcessing && (
          <div className="card text-center py-8 bg-gray-50">
            <span className="text-4xl mb-3 block">🔍</span>
            <p className="text-gray-600">No results for "{searchQuery}"</p>
            <p className="text-sm text-gray-500 mt-2">Try a different search term</p>
          </div>
        )}

        {/* Selected Foods */}
        {selectedFoods.length > 0 && (
          <div className="card border-2 border-primary">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span>🍽️</span>
              Your Meal ({selectedFoods.length} item{selectedFoods.length !== 1 ? 's' : ''})
            </h3>
            <div className="space-y-4">
              {selectedFoods.map((food, index) => (
                <FoodCard
                  key={index}
                  food={food}
                  onRemove={() => removeFoodFromMeal(index)}
                  onPortionChange={(newPortion) => updatePortion(index, newPortion)}
                />
              ))}
            </div>

            {/* Totals */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="font-semibold mb-4">Meal Totals</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-3xl font-bold text-primary">{totals.calories}</p>
                  <p className="text-sm text-gray-600">Calories</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-3xl font-bold text-blue-600">{totals.protein}g</p>
                  <p className="text-sm text-gray-600">Protein</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <p className="text-3xl font-bold text-yellow-600">{totals.carbs}g</p>
                  <p className="text-sm text-gray-600">Carbs</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-3xl font-bold text-green-600">{totals.fats}g</p>
                  <p className="text-sm text-gray-600">Fats</p>
                </div>
              </div>

              <Button
                onClick={saveMeal}
                isLoading={isProcessing}
                className="w-full py-4 text-lg"
              >
                {isProcessing ? 'Saving...' : `Save ${mealType.charAt(0).toUpperCase() + mealType.slice(1)}`}
              </Button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {selectedFoods.length === 0 && recognizedFoods.length === 0 && !isProcessing && (
          <div className="card text-center py-12 bg-gradient-to-br from-gray-50 to-white">
            <span className="text-6xl mb-4 block">🍴</span>
            <h3 className="text-xl font-semibold mb-2">Ready to Log Your Meal?</h3>
            <p className="text-gray-600 mb-4">
              Take a photo or search for foods to get started
            </p>
            <div className="flex gap-3 justify-center text-sm text-gray-500">
              <span>📸 Photo recognition</span>
              <span>•</span>
              <span>🔍 Manual search</span>
              <span>•</span>
              <span>📊 Instant nutrition data</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LogMeal;
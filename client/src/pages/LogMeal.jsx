import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Search, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import CameraCapture from '../components/camera/CameraCapture';
import FoodCard from '../components/food/FoodCard';
import Button from '../components/common/Button';
import { analyzeMealImage, searchFood } from '../services/api/temp_foodService';
import { saveMealToFirestore } from '../services/firebase/firestore';
import Navbar from '../components/common/Navbar';

const LogMeal = () => {
  const navigate = useNavigate();
  const [showCamera, setShowCamera] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recognizedFoods, setRecognizedFoods] = useState([]);
  const [selectedFoods, setSelectedFoods] = useState([]);
  const [mealType, setMealType] = useState('breakfast');
  const [searchQuery, setSearchQuery] = useState('');

  // Handle photo capture
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

  // Handle manual search
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

  // Add food to meal
  const addFoodToMeal = (food) => {
    const foodWithMetadata = {
      ...food,
      portion: 1,
      // Store original values for portion calculations
      _originalCalories: food.calories,
      _originalProtein: food.protein,
      _originalCarbs: food.carbs,
      _originalFats: food.fats,
    };
    
    setSelectedFoods([...selectedFoods, foodWithMetadata]);
    toast.success(`Added ${food.name}`);
    
    // Clear search results after adding
    setSearchQuery('');
    setRecognizedFoods([]);
  };

  // Remove food from meal
  const removeFoodFromMeal = (index) => {
    const removedFood = selectedFoods[index];
    const newFoods = selectedFoods.filter((_, i) => i !== index);
    setSelectedFoods(newFoods);
    toast.success(`Removed ${removedFood.name}`);
  };

  // Update portion size
  const updatePortion = (index, newPortion) => {
    const newFoods = [...selectedFoods];
    const food = newFoods[index];
    
    // Calculate new values based on original values
    food.portion = newPortion;
    food.calories = Math.round(food._originalCalories * newPortion);
    food.protein = Math.round(food._originalProtein * newPortion);
    food.carbs = Math.round(food._originalCarbs * newPortion);
    food.fats = Math.round(food._originalFats * newPortion);
    
    setSelectedFoods(newFoods);
  };

  // Calculate totals
  const totals = selectedFoods.reduce(
    (acc, food) => ({
      calories: acc.calories + (food.calories || 0),
      protein: acc.protein + (food.protein || 0),
      carbs: acc.carbs + (food.carbs || 0),
      fats: acc.fats + (food.fats || 0)
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );

  // Save meal
  const saveMeal = async () => {
    if (selectedFoods.length === 0) {
      toast.error('Add at least one food item');
      return;
    }

    setIsProcessing(true);
    try {
      // Clean up the foods before saving (remove metadata)
      const cleanedFoods = selectedFoods.map(food => ({
        name: food.name,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fats: food.fats,
        portion: food.portion,
        serving: food.serving
      }));

      await saveMealToFirestore({
        foods: cleanedFoods,
        mealType,
        totals,
        timestamp: new Date(),
        hasPhoto: false // TODO: track if photo was used
      });
      
      toast.success('Meal logged successfully! 🎉');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving meal:', error);
      toast.error('Failed to save meal');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-6">
      {/* Add Navbar at the top */}
    <Navbar totals={totals} mealType={mealType} />
      {/* Camera Modal */}
      {showCamera && (
        <CameraCapture
          onCapture={handlePhotoCapture}
          onClose={() => setShowCamera(false)}
        />
      )}

      {/* Header */}
      <div className="bg-gradient-primary shadow-sm">
        <div className="container-custom py-4">
          <h1 className="text-2xl font-bold text-gray-800">Log Meal</h1>
          <p className="text-gray-600 mt-1">Snap a photo or search manually</p>
        </div>
      </div>

      <div className="container-custom py-6 space-y-6">
        {/* Meal Type Selection */}
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
          {/* Camera Button */}
          <button
            onClick={() => setShowCamera(true)}
            disabled={isProcessing}
            className="card hover:shadow-lg transition flex flex-col items-center justify-center py-8 bg-gradient-secondary text-white cursor-pointer disabled:opacity-50"
          >
            <Camera size={48} className="mb-3" />
            <span className="text-lg font-semibold">Take Photo</span>
            <span className="text-sm opacity-90 mt-1">AI Recognition</span>
          </button>

          {/* Manual Search */}
          <div className="card bg-gradient-secondary text-white">
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
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                  disabled={isProcessing}
                  className="flex-1 px-4 py-2 rounded-lg text-gray-800 placeholder-gray-400 disabled:opacity-50"
                />
                <Button 
                  onClick={handleSearch} 
                  isLoading={isProcessing}
                  disabled={!searchQuery.trim() || isProcessing}
                  className="bg-white text-secondary hover:bg-gray-100"
                >
                  Go
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="card text-center py-8">
            <div className="spinner mx-auto mb-4"></div>
            <p className="text-gray-600">Processing your request...</p>
          </div>
        )}

        {/* Search Results / Recognized Foods */}
        {recognizedFoods.length > 0 && !isProcessing && (
          <div className="card animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Found {recognizedFoods.length} Food{recognizedFoods.length !== 1 ? 's' : ''}
              </h3>
              <button
                onClick={() => setRecognizedFoods([])}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear
              </button>
            </div>
            <div className="space-y-3">
              {recognizedFoods.map((food, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition group"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-lg text-gray-900">{food.name}</p>
                    <div className="flex flex-wrap gap-3 mt-2 text-sm">
                      <span className="font-medium text-primary">{food.calories} cal</span>
                      <span className="text-blue-600">{food.protein}g protein</span>
                      <span className="text-yellow-600">{food.carbs}g carbs</span>
                      <span className="text-green-600">{food.fats}g fats</span>
                    </div>
                    {food.serving && (
                      <p className="text-xs text-gray-500 mt-1">
                        Per {food.serving}
                      </p>
                    )}
                    {food.confidence && (
                      <span className="inline-block mt-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                        {food.confidence}% confidence
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => addFoodToMeal(food)}
                    className="p-3 bg-primary text-black rounded-full hover:bg-red-600 hover:scale-110 transition ml-4 flex-shrink-0 group-hover:shadow-lg"
                    title={`Add ${food.name}`}
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
            <p className="text-sm text-gray-500 mt-2">
              Try searching for: chicken, rice, apple, etc.
            </p>
          </div>
        )}

        {/* Selected Foods - Your Meal */}
        {selectedFoods.length > 0 && (
          <div className="card border-2 border-primary animate-fade-in">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="text-2xl">🍽️</span>
              Your {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({selectedFoods.length} item{selectedFoods.length !== 1 ? 's' : ''})
              </span>
            </h3>
            
            <div className="space-y-4 mb-6">
              {selectedFoods.map((food, index) => (
                <FoodCard
                  key={index}
                  food={food}
                  onRemove={() => removeFoodFromMeal(index)}
                  onPortionChange={(newPortion) => updatePortion(index, newPortion)}
                />
              ))}
            </div>

            {/* Meal Totals */}
            <div className="pt-6 border-t-2 border-gray-200">
              <h4 className="font-semibold mb-4 text-lg">Meal Totals</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-red-50 rounded-lg border border-red-100">
                  <p className="text-3xl font-bold text-primary">{totals.calories}</p>
                  <p className="text-sm text-gray-600 mt-1">Calories</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-3xl font-bold text-blue-600">{totals.protein}g</p>
                  <p className="text-sm text-gray-600 mt-1">Protein</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                  <p className="text-3xl font-bold text-yellow-600">{totals.carbs}g</p>
                  <p className="text-sm text-gray-600 mt-1">Carbs</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg border border-green-100">
                  <p className="text-3xl font-bold text-green-600">{totals.fats}g</p>
                  <p className="text-sm text-gray-600 mt-1">Fats</p>
                </div>
              </div>

<Button
  onClick={saveMeal}
  isLoading={isProcessing}
  className="w-full py-4 text-lg font-semibold bg-blue-500 text-white hover:bg-blue-600"
>
  {isProcessing ? (
    'Saving...'
  ) : (
    <>
      Save {mealType.charAt(0).toUpperCase() + mealType.slice(1)} ({totals.calories} cal)
    </>
  )}
</Button>

            </div>
          </div>
        )}

        {/* Empty State - When Nothing Added */}
        {selectedFoods.length === 0 && recognizedFoods.length === 0 && !isProcessing && !searchQuery && (
          <div className="card text-center py-12 bg-gradient-to-br from-gray-50 to-white">
            <span className="text-6xl mb-4 block">🍴</span>
            <h3 className="text-xl font-semibold mb-2 text-gray-800">
              Ready to Log Your Meals ?
            </h3>
            <p className="text-gray-600 mb-6">
              Choose a method above to get started
            </p>
            <div className="flex flex-wrap gap-4 justify-center text-sm text-gray-500">
              <span className="flex items-center gap-2">
                <Camera size={16} />
                Photo Recognition
              </span>
              <span>•</span>
              <span className="flex items-center gap-2">
                <Search size={16} />
                Manual Search
              </span>
              <span>•</span>
              <span>📊 Instant Nutrition</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LogMeal;
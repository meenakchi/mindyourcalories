import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Search, Plus } from 'lucide-react';
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

  // ----------------------------------------------------------
  // PHOTO CAPTURE + ANALYSIS
  // ----------------------------------------------------------
  const handlePhotoCapture = async (imageData) => {
    setIsProcessing(true);

    try {
      const blob = await fetch(imageData).then((r) => r.blob());
      const response = await analyzeMealImage(blob);

      if (response.success && response.foods.length > 0) {
        setRecognizedFoods(response.foods);

        const autoAdded = response.foods.map(f => ({
          ...f,
          portion: 1,
          calories: Math.round(f.calories),
          protein: Math.round(f.protein),
          carbs: Math.round(f.carbs),
          fats: Math.round(f.fats),
        }));

        setSelectedFoods(autoAdded);

        toast.success(`Found ${response.foods.length} food items!`);
      } else {
        toast.error('No food detected. Try manual search.');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to recognize food.');
    } finally {
      setIsProcessing(false);
      setShowCamera(false);
    }
  };

  // ----------------------------------------------------------
  // SEARCH
  // ----------------------------------------------------------
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsProcessing(true);
    try {
      const { results } = await searchFood(searchQuery);
      setRecognizedFoods(results || []);
      toast.success('Food found!');
    } catch (error) {
      console.error(error);
      toast.error('Food not found');
    } finally {
      setIsProcessing(false);
    }
  };

  // ----------------------------------------------------------
  // ADD FOOD
  // ----------------------------------------------------------
  const addFoodToMeal = (food, portion = 1) => {
    const newItem = {
      ...food,
      portion,
      calories: Math.round(food.calories * portion),
      protein: Math.round(food.protein * portion),
      carbs: Math.round(food.carbs * portion),
      fats: Math.round(food.fats * portion),
    };

    setSelectedFoods((prev) => [...prev, newItem]);
    toast.success(`Added ${food.name}`);
  };

  // ----------------------------------------------------------
  // REMOVE FOOD
  // ----------------------------------------------------------
  const removeFoodFromMeal = (index) => {
    setSelectedFoods((prev) => prev.filter((_, i) => i !== index));
  };

  // ----------------------------------------------------------
  // UPDATE PORTION
  // ----------------------------------------------------------
  const updatePortion = (index, newPortion) => {
    const foods = [...selectedFoods];
    const item = foods[index];

    const base = {
      calories: item.calories / item.portion,
      protein: item.protein / item.portion,
      carbs: item.carbs / item.portion,
      fats: item.fats / item.portion,
    };

    item.portion = newPortion;
    item.calories = Math.round(base.calories * newPortion);
    item.protein = Math.round(base.protein * newPortion);
    item.carbs = Math.round(base.carbs * newPortion);
    item.fats = Math.round(base.fats * newPortion);

    setSelectedFoods(foods);
  };

  // ----------------------------------------------------------
  // TOTALS
  // ----------------------------------------------------------
  const totals = selectedFoods.reduce(
    (sum, f) => ({
      calories: sum.calories + f.calories,
      protein: sum.protein + f.protein,
      carbs: sum.carbs + f.carbs,
      fats: sum.fats + f.fats,
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );

  // ----------------------------------------------------------
  // SAVE MEAL
  // ----------------------------------------------------------
  const saveMeal = async () => {
    if (selectedFoods.length === 0) return toast.error('Add at least one food item');

    setIsProcessing(true);

    try {
      await saveMealToFirestore({
        foods: selectedFoods,
        mealType,
        totals,
        timestamp: new Date(),
        hasPhoto: recognizedFoods.length > 0,
      });

      toast.success('Meal logged!');
      navigate('/dashboard');
    } catch (error) {
      console.error(error);
      toast.error('Failed to save meal');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-6">

      {/* CAMERA */}
      {showCamera && (
        <CameraCapture
          onCapture={handlePhotoCapture}
          onClose={() => setShowCamera(false)}
        />
      )}

      {/* HEADER */}
      <div className="bg-white shadow-sm">
        <div className="container-custom py-4">
          <h1 className="text-2xl font-bold">Log Meal</h1>
          <p className="text-gray-600">Snap a photo or search manually</p>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="container-custom mt-6 space-y-6">

        {/* MEAL TYPE */}
        <div className="card">
          <label className="font-semibold mb-3 block">Meal Type</label>
          <div className="grid grid-cols-4 gap-2">
            {['breakfast', 'lunch', 'dinner', 'snack'].map((type) => (
              <button
                key={type}
                onClick={() => setMealType(type)}
                className={`py-2 px-4 rounded-lg font-medium capitalize ${
                  mealType === type
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* INPUT METHODS */}
        <div className="grid md:grid-cols-2 gap-4">

          {/* CAMERA BUTTON */}
          <button
            onClick={() => setShowCamera(true)}
            className="card flex flex-col items-center py-8 bg-gradient-primary text-white hover:shadow-lg"
          >
            <Camera size={48} />
            <span className="text-lg font-semibold mt-3">Take Photo</span>
          </button>

          {/* SEARCH */}
          <div className="card bg-gradient-secondary text-white">
            <div className="flex flex-col justify-center h-full">
              <Search size={48} className="mx-auto mb-3" />
              <span className="text-lg font-semibold text-center mb-4">
                Search Food
              </span>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="e.g., chicken breast"
                  className="flex-1 px-4 py-2 rounded-lg text-gray-800"
                />
                <Button onClick={handleSearch} isLoading={isProcessing} variant="secondary">
                  Go
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* LOADING */}
        {isProcessing && (
          <div className="card text-center py-8">
            <div className="spinner mx-auto mb-4" />
            <p className="text-gray-600">Processing…</p>
          </div>
        )}

        {/* FOUND FOODS */}
        {!isProcessing && recognizedFoods.length > 0 && (
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Found Foods</h3>
            <div className="space-y-3">
              {recognizedFoods.map((food, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{food.name}</p>
                    <p className="text-sm text-gray-600">
                      {food.calories} cal • {food.protein}g protein
                    </p>
                  </div>
                  <button
                    onClick={() => addFoodToMeal(food)}
                    className="p-2 bg-primary text-white rounded-full hover:bg-red-600"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SELECTED FOODS */}
        {selectedFoods.length > 0 && (
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Your Meal</h3>
            {selectedFoods.map((food, i) => (
              <FoodCard
                key={i}
                food={food}
                onRemove={() => removeFoodFromMeal(i)}
                onPortionChange={(p) => updatePortion(i, p)}
              />
            ))}

            <div className="mt-4 p-3 bg-gray-100 rounded-lg">
              <p className="font-semibold">Totals</p>
              <p>{totals.calories} cal • {totals.protein}g protein</p>
            </div>

            <Button className="mt-4 w-full" onClick={saveMeal} isLoading={isProcessing}>
              Save Meal
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LogMeal;

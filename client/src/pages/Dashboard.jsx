import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Camera, TrendingUp, Flame, Award } from 'lucide-react';
import { getTodaysMeals, calculateDailyTotals } from '../services/firebase/firestore';
import Loading from '../components/common/Loading';
import Button from '../components/common/Button';

const Dashboard = () => {
  const [meals, setMeals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [calorieGoal] = useState(2000); // TODO: Make this user-configurable

  useEffect(() => {
    loadTodaysMeals();
  }, []);

  const loadTodaysMeals = async () => {
    setIsLoading(true);
    try {
      const todaysMeals = await getTodaysMeals();
      setMeals(todaysMeals);
    } catch (error) {
      console.error('Error loading meals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const totals = calculateDailyTotals(meals);
  const caloriePercentage = Math.min((totals.calories / calorieGoal) * 100, 100);
  const remaining = Math.max(calorieGoal - totals.calories, 0);

  if (isLoading) {
    return <Loading message="Loading your dashboard..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-6">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container-custom py-4">
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-600 mt-1">Track your daily progress</p>
        </div>
      </div>

      <div className="container-custom py-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          <div className="card text-center">
            <Flame className="mx-auto mb-2 text-primary" size={32} />
            <p className="text-3xl font-bold text-gray-900">{totals.calories}</p>
            <p className="text-sm text-gray-600">Calories Today</p>
          </div>
          <div className="card text-center">
            <TrendingUp className="mx-auto mb-2 text-blue-600" size={32} />
            <p className="text-3xl font-bold text-gray-900">{totals.protein}g</p>
            <p className="text-sm text-gray-600">Protein</p>
          </div>
          <div className="card text-center">
            <div className="mx-auto mb-2 text-yellow-600 text-3xl">🍞</div>
            <p className="text-3xl font-bold text-gray-900">{totals.carbs}g</p>
            <p className="text-sm text-gray-600">Carbs</p>
          </div>
          <div className="card text-center">
            <div className="mx-auto mb-2 text-green-600 text-3xl">🥑</div>
            <p className="text-3xl font-bold text-gray-900">{totals.fats}g</p>
            <p className="text-sm text-gray-600">Fats</p>
          </div>
        </div>

        {/* Calorie Progress */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Daily Calorie Goal</h2>
            <span className="text-sm text-gray-600">{calorieGoal} cal goal</span>
          </div>
          
          <div className="relative">
            <div className="progress-bar mb-2">
              <div 
                className="progress-fill"
                style={{ width: `${caloriePercentage}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{totals.calories} consumed</span>
              <span className="text-green-600 font-semibold">{remaining} remaining</span>
            </div>
          </div>

          {totals.calories > calorieGoal && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              ⚠️ You've exceeded your daily goal by {totals.calories - calorieGoal} calories
            </div>
          )}
        </div>

        {/* Today's Meals */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Today's Meals</h2>
            <Link to="/log-meal">
              <Button>
                <Camera size={18} />
                Log Meal
              </Button>
            </Link>
          </div>

          {meals.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-6xl mb-4 block">🍽️</span>
              <p className="text-gray-600 mb-4">No meals logged yet today</p>
              <Link to="/log-meal">
                <Button>Log Your First Meal</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {meals.map((meal, index) => (
                <div 
                  key={index}
                  className="p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold capitalize text-lg">
                      {meal.mealType}
                    </span>
                    <span className="text-sm text-gray-600">
                      {new Date(meal.timestamp).toLocaleTimeString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-2 text-center text-sm">
                    <div>
                      <p className="font-bold text-primary">{meal.totals.calories}</p>
                      <p className="text-gray-600">cal</p>
                    </div>
                    <div>
                      <p className="font-bold text-blue-600">{meal.totals.protein}g</p>
                      <p className="text-gray-600">protein</p>
                    </div>
                    <div>
                      <p className="font-bold text-yellow-600">{meal.totals.carbs}g</p>
                      <p className="text-gray-600">carbs</p>
                    </div>
                    <div>
                      <p className="font-bold text-green-600">{meal.totals.fats}g</p>
                      <p className="text-gray-600">fats</p>
                    </div>
                  </div>

                  <div className="mt-2 text-sm text-gray-600">
                    {meal.foods?.map(f => f.name).join(', ')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
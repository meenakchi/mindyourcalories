import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Camera, TrendingUp, Flame, Award, Calendar, Target } from 'lucide-react';
import { 
  getTodaysMeals, 
  calculateDailyTotals,
  getUserProfile,
  calculateStreak,
  checkAndAwardBadges,
  getMealsByDateRange
} from '../services/firebase/firestore';
import { getMealSuggestions } from '../services/api/temp_foodService';
import { getAuth } from 'firebase/auth';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/common/Loading';
import Button from '../components/common/Button';
import toast from 'react-hot-toast';
import CalorieChart from '../components/dashboard/CalorieChart';
import MacrosPieChart from '../components/dashboard/MacrosPieChart';
import WeeklyProgress from '../components/dashboard/WeeklyProgress';

const Dashboard = () => {
  const { user } = useAuth();
  const [meals, setMeals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [newBadges, setNewBadges] = useState([]);
  const [chartData, setChartData] = useState([]); // ← MOVED HERE (state variable)

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Load meals
      const todaysMeals = await getTodaysMeals();
      setMeals(todaysMeals);

      // Load user profile
      const auth = getAuth();
      const user = auth.currentUser;
      
      let calorieGoal = 2000;
      
      if (user) {
        const profile = await getUserProfile(user.uid);
        setUserProfile(profile);
        calorieGoal = profile?.calorieGoal || 2000;

        // Check for new badges
        const badges = await checkAndAwardBadges(user.uid);
        if (badges.length > 0) {
          setNewBadges(badges);
          toast.success(`🎉 You earned ${badges.length} new badge(s)!`);
        }
      } else {
        // Default profile for non-logged in users
        setUserProfile({ calorieGoal: 2000 });
      }

      // Load last 7 days for charts
      const last7Days = new Date();
      last7Days.setDate(last7Days.getDate() - 7);
      const weekMeals = await getMealsByDateRange(last7Days, new Date());

      // Group by date for chart
      const dailyData = {};
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateKey = date.toISOString().split('T')[0];
        dailyData[dateKey] = { 
          date: dateKey, 
          calories: 0, 
          protein: 0, 
          carbs: 0, 
          fats: 0, 
          goal: calorieGoal 
        };
      }

      weekMeals.forEach(meal => {
        const dateKey = new Date(meal.timestamp).toISOString().split('T')[0];
        if (dailyData[dateKey]) {
          dailyData[dateKey].calories += meal.totals?.calories || 0;
          dailyData[dateKey].protein += meal.totals?.protein || 0;
          dailyData[dateKey].carbs += meal.totals?.carbs || 0;
          dailyData[dateKey].fats += meal.totals?.fats || 0;
        }
      });

      const formattedChartData = Object.values(dailyData);
      setChartData(formattedChartData); // ← SET STATE HERE

      // Load meal suggestions based on remaining calories
      if (todaysMeals.length > 0) {
        const totals = calculateDailyTotals(todaysMeals);
        const remaining = calorieGoal - totals.calories;
        
        if (remaining > 0) {
          const mealSuggestions = getMealSuggestions('dinner', remaining);
          setSuggestions(mealSuggestions.slice(0, 3));
        }
      }

    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast.error('Failed to load dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const calorieGoal = userProfile?.calorieGoal || 2000;
  const totals = calculateDailyTotals(meals);
  const caloriePercentage = Math.min((totals.calories / calorieGoal) * 100, 100);
  const remaining = Math.max(calorieGoal - totals.calories, 0);
  const streak = calculateStreak(meals);

  if (isLoading) {
    return <Loading message="Loading your dashboard..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-6">
      {/* Header */}
      <div className="bg-gradient-primary text-white">
        <div className="container-custom py-6">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="opacity-90">
            {meals.length > 0 
              ? `You've logged ${meals.length} meal${meals.length > 1 ? 's' : ''} today!`
              : 'Ready to log your first meal?'
            }
          </p>
        </div>
      </div>

      {/* Guest Mode Warning */}
      {!user && (
        <div className="container-custom py-4">
          <div className="card bg-yellow-50 border-2 border-yellow-300">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div className="flex-1">
                <p className="font-semibold text-yellow-800 mb-2">
                  You're in Guest Mode
                </p>
                <p className="text-sm text-yellow-700 mb-4">
                  Your data is only saved locally on this device. 
                  <strong> Create an account</strong> to:
                </p>
                <ul className="text-sm text-yellow-700 mb-4 space-y-1 ml-4">
                  <li>✓ Access history and track progress over time</li>
                  <li>✓ Sync data across devices</li>
                  <li>✓ Earn badges and achievements</li>
                  <li>✓ Never lose your data</li>
                </ul>
                <div className="flex gap-2">
                  <Link to="/signup">
                    <Button variant="secondary" className="text-sm">
                      Create Account (Free)
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button variant="outline" className="text-sm">
                      Sign In
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container-custom py-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card text-center bg-gradient-to-br from-red-50 to-white hover:shadow-lg transition">
            <Flame className="mx-auto mb-2 text-primary" size={32} />
            <p className="text-3xl font-bold text-gray-900">{totals.calories}</p>
            <p className="text-sm text-gray-600">Calories</p>
          </div>
          <div className="card text-center bg-gradient-to-br from-blue-50 to-white hover:shadow-lg transition">
            <div className="mx-auto mb-2 text-blue-600 text-3xl">💪</div>
            <p className="text-3xl font-bold text-gray-900">{totals.protein}g</p>
            <p className="text-sm text-gray-600">Protein</p>
          </div>
          <div className="card text-center bg-gradient-to-br from-yellow-50 to-white hover:shadow-lg transition">
            <div className="mx-auto mb-2 text-yellow-600 text-3xl">🍞</div>
            <p className="text-3xl font-bold text-gray-900">{totals.carbs}g</p>
            <p className="text-sm text-gray-600">Carbs</p>
          </div>
          <div className="card text-center bg-gradient-to-br from-green-50 to-white hover:shadow-lg transition">
            <div className="mx-auto mb-2 text-green-600 text-3xl">🥑</div>
            <p className="text-3xl font-bold text-gray-900">{totals.fats}g</p>
            <p className="text-sm text-gray-600">Fats</p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid md:grid-cols-2 gap-6">
          <CalorieChart data={chartData} />
          <MacrosPieChart 
            protein={totals.protein} 
            carbs={totals.carbs} 
            fats={totals.fats} 
          />
        </div>

        {/* Weekly Progress */}
        <WeeklyProgress weekData={chartData} />

        {/* Streak Badge */}
        {streak.current > 0 && (
          <div className="card bg-gradient-to-r from-orange-500 to-red-500 text-black">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-5xl">🔥</div>
                <div>
                  <p className="text-3xl font-bold">{streak.current} Day Streak!</p>
                  <p className="opacity-90">Keep it up! You're doing amazing!</p>
                </div>
              </div>
              <Calendar size={48} className="opacity-50" />
            </div>
          </div>
        )}

        {/* Calorie Progress */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target className="text-primary" size={24} />
              <h2 className="text-xl font-bold">Daily Calorie Goal</h2>
            </div>
            <span className="text-sm text-gray-600 font-semibold">
              {calorieGoal} cal goal
            </span>
          </div>
          
          <div className="relative mb-4">
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${caloriePercentage}%` }}
              ></div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-primary">{totals.calories}</p>
              <p className="text-sm text-gray-600">Consumed</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{remaining}</p>
              <p className="text-sm text-gray-600">Remaining</p>
            </div>
          </div>

          {totals.calories > calorieGoal && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-start gap-2">
              <span>⚠️</span>
              <span>
                You've exceeded your daily goal by <strong>{totals.calories - calorieGoal} calories</strong>.
                Try lighter options for your next meal!
              </span>
            </div>
          )}
        </div>

        {/* Meal Suggestions */}
        {suggestions.length > 0 && remaining > 0 && (
          <div className="card bg-gradient-to-br from-teal-50 to-white">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span>💡</span>
              Suggested Meals ({remaining} cal remaining)
            </h3>
            <div className="grid md:grid-cols-3 gap-3">
              {suggestions.map((meal, index) => (
                <div 
                  key={index}
                  className="p-4 bg-white rounded-lg border-2 border-teal-100 hover:border-teal-300 transition"
                >
                  <p className="font-semibold mb-2">{meal.name}</p>
                  <p className="text-sm text-gray-600 mb-2">
                    {meal.calories} cal • {meal.protein}g protein
                  </p>
                  <p className="text-xs text-gray-500">
                    {meal.foods?.join(', ')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

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
              <p className="text-gray-600 mb-4 text-lg">No meals logged yet today</p>
              <p className="text-gray-500 mb-6">Start tracking your nutrition journey!</p>
              <Link to="/log-meal">
                <Button className="px-8 py-3">
                  <Camera size={20} />
                  Log Your First Meal
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {meals.map((meal, index) => (
                <div 
                  key={index}
                  className="p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200 hover:shadow-md transition"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {meal.mealType === 'breakfast' && '🍳'}
                        {meal.mealType === 'lunch' && '🍔'}
                        {meal.mealType === 'dinner' && '🍽️'}
                        {meal.mealType === 'snack' && '🍎'}
                      </span>
                      <div>
                        <span className="font-semibold capitalize text-lg">
                          {meal.mealType}
                        </span>
                        <p className="text-xs text-gray-500">
                          {new Date(meal.timestamp).toLocaleTimeString('en-US', { 
                            hour: 'numeric', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                    {meal.hasPhoto && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                        📸 Photo
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-4 gap-2 text-center text-sm mb-3">
                    <div className="p-2 bg-red-50 rounded">
                      <p className="font-bold text-primary">{meal.totals.calories}</p>
                      <p className="text-xs text-gray-600">cal</p>
                    </div>
                    <div className="p-2 bg-blue-50 rounded">
                      <p className="font-bold text-blue-600">{meal.totals.protein}g</p>
                      <p className="text-xs text-gray-600">protein</p>
                    </div>
                    <div className="p-2 bg-yellow-50 rounded">
                      <p className="font-bold text-yellow-600">{meal.totals.carbs}g</p>
                      <p className="text-xs text-gray-600">carbs</p>
                    </div>
                    <div className="p-2 bg-green-50 rounded">
                      <p className="font-bold text-green-600">{meal.totals.fats}g</p>
                      <p className="text-xs text-gray-600">fats</p>
                    </div>
                  </div>

                  <div className="text-sm text-gray-600 border-t pt-2">
                    <strong>Foods:</strong> {meal.foods?.map(f => f.name).join(', ')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        {user ? (
          <div className="grid md:grid-cols-3 gap-4">
            <Link to="/history" className="card hover:shadow-lg transition cursor-pointer text-center">
              <TrendingUp className="mx-auto mb-2 text-secondary" size={32} />
              <p className="font-semibold">View History</p>
              <p className="text-xs text-gray-500 mt-1">See past meals</p>
            </Link>
            <Link to="/profile" className="card hover:shadow-lg transition cursor-pointer text-center">
              <Target className="mx-auto mb-2 text-purple-600" size={32} />
              <p className="font-semibold">Set Goals</p>
              <p className="text-xs text-gray-500 mt-1">Customize targets</p>
            </Link>
            <div className="card hover:shadow-lg transition cursor-pointer text-center">
              <Award className="mx-auto mb-2 text-yellow-600" size={32} />
              <p className="font-semibold">Achievements</p>
              <p className="text-xs text-gray-500 mt-1">
                {userProfile?.stats?.badges?.length || 0} badges earned
              </p>
            </div>
          </div>
        ) : (
          <div className="card text-center py-8 bg-gradient-to-br from-blue-50 to-purple-50">
            <span className="text-6xl mb-4 block">🎯</span>
            <h3 className="text-xl font-bold mb-2">Unlock More Features</h3>
            <p className="text-gray-600 mb-6">
              Sign up to access history, achievements, and detailed analytics!
            </p>
            <div className="flex gap-3 justify-center">
              <Link to="/signup">
                <Button>Create Account</Button>
              </Link>
              <Link to="/login">
                <Button variant="outline">Sign In</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
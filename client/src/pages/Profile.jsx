import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { User, Target, TrendingUp, Award, LogOut, Settings } from 'lucide-react';
import { updateUserProfile } from '../services/firebase/firestore';
import Button from '../components/common/Button';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [calorieGoal, setCalorieGoal] = useState(2000);
  const [proteinGoal, setProteinGoal] = useState(150);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setCalorieGoal(userProfile.calorieGoal || 2000);
      setProteinGoal(userProfile.proteinGoal || 150);
    }
  }, [userProfile]);

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      await logout();
      navigate('/');
    }
  };

  const handleSaveGoals = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      await updateUserProfile(user.uid, {
        calorieGoal: parseInt(calorieGoal),
        proteinGoal: parseInt(proteinGoal)
      });
      toast.success('Goals updated!');
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to update goals');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-6">
      {/* Header */}
      <div className="bg-gradient-primary text-white">
        <div className="container-custom p-10">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-4xl">
              👤
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                {user ? userProfile?.name || user.email : 'Guest User'}
              </h1>
              <p className="opacity-90">
                {user ? user.email : 'Using app without account'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container-custom py-6 space-y-6">
        {/* Not Logged In Warning */}
        {!user && (
          <div className="card bg-yellow-50 border-2 border-yellow-200">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div className="flex-1">
                <p className="font-semibold text-yellow-800 mb-2">
                  You're using guest mode
                </p>
                <p className="text-sm text-yellow-700 mb-4">
                  Sign up to save your progress and access all features!
                </p>
                <div className="flex gap-2">
                  <Link to="/signup">
                    <Button variant="secondary" className="text-sm">
                      Create Account
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
        )}

        {/* Stats */}
        {user && userProfile && (
          <div className="card">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <TrendingUp size={24} />
              Your Stats
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gradient-to-br from-red-50 to-white rounded-lg">
                <p className="text-3xl font-bold text-primary">
                  {userProfile.stats?.totalMeals || 0}
                </p>
                <p className="text-sm text-gray-600">Meals Logged</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-white rounded-lg">
                <p className="text-3xl font-bold text-orange-600">
                  {userProfile.stats?.currentStreak || 0} 🔥
                </p>
                <p className="text-sm text-gray-600">Day Streak</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-white rounded-lg">
                <p className="text-3xl font-bold text-purple-600">
                  {userProfile.stats?.longestStreak || 0}
                </p>
                <p className="text-sm text-gray-600">Longest Streak</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-white rounded-lg">
                <p className="text-3xl font-bold text-yellow-600">
                  {userProfile.stats?.badges?.length || 0} 🏆
                </p>
                <p className="text-sm text-gray-600">Badges Earned</p>
              </div>
            </div>
          </div>
        )}

        {/* Goals */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Target size={24} />
              Daily Goals
            </h2>
            {user && !isEditing && (
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Settings size={18} />
                Edit
              </Button>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Calorie Goal (kcal)
                </label>
                <input
                  type="number"
                  value={calorieGoal}
                  onChange={(e) => setCalorieGoal(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Protein Goal (g)
                </label>
                <input
                  type="number"
                  value={proteinGoal}
                  onChange={(e) => setProteinGoal(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="flex gap-2 mt-4">
  <Button 
    onClick={handleSaveGoals} 
    isLoading={isSaving}
    className="bg-green-600 hover:bg-green-700 text-white"
  >
    Save Changes
  </Button>
  <Button variant="outline" onClick={() => setIsEditing(false)}>
    Cancel
  </Button>
</div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-red-50 rounded-lg text-center">
                <p className="text-3xl font-bold text-primary">{calorieGoal}</p>
                <p className="text-sm text-gray-600">Calories/day</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg text-center">
                <p className="text-3xl font-bold text-blue-600">{proteinGoal}g</p>
                <p className="text-sm text-gray-600">Protein/day</p>
              </div>
            </div>
          )}
        </div>

        {/* Account Actions */}
        {user ? (
          <div className="card">
            <h3 className="text-lg font-bold mb-4">Account</h3>
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                <span className="text-gray-700">Email</span>
                <span className="font-semibold">{user.email}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                <span className="text-gray-700">Member Since</span>
                <span className="font-semibold">
                  {new Date(user.metadata.creationTime).toLocaleDateString()}
                </span>
              </div>
              <Button 
                variant="outline" 
                onClick={handleLogout}
                className="w-full border-red-500 text-red-500 hover:bg-red-50"
              >
                <LogOut size={18} />
                Logout
              </Button>
            </div>
          </div>
        ) : (
          <div className="card text-center py-8">
            <span className="text-6xl mb-4 block">🔐</span>
            <h3 className="text-xl font-bold mb-2">Sign in to unlock</h3>
            <p className="text-gray-600 mb-6">
              Save your progress, earn badges, and track your streak!
            </p>
            <div className="flex gap-3 justify-center">
              <Link to="/login">
                <Button>Sign In</Button>
              </Link>
              <Link to="/signup">
                <Button variant="secondary">Create Account</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
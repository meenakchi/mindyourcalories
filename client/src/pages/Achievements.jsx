import { useState, useEffect } from 'react';
import { Award, Lock, Star, TrendingUp, Calendar, Camera, Target, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUserProfile } from '../services/firebase/firestore';
import { Link } from 'react-router-dom';
import Loading from '../components/common/Loading';
import Button from '../components/common/Button';

const Achievements = () => {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [allBadges, setAllBadges] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, earned, locked

  useEffect(() => {
    loadAchievements();
  }, [user]);

  const loadAchievements = async () => {
    setIsLoading(true);
    try {
      // Load user profile
      if (user) {
        const profile = await getUserProfile(user.uid);
        setUserProfile(profile);
      }

      // Load badges
      const badgesData = await import('../data/badges.json');
      setAllBadges(badgesData.default);
    } catch (error) {
      console.error('Error loading achievements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Check if not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24 md:pb-6 pt-4">
        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
          <div className="container-custom py-6">
            <h1 className="text-3xl font-bold">Achievements</h1>
          </div>
        </div>
        
        <div className="container-custom py-20">
          <div className="max-w-md mx-auto card text-center">
            <span className="text-6xl mb-4 block">🔒</span>
            <h2 className="text-2xl font-bold mb-4">Login Required</h2>
            <p className="text-gray-600 mb-6">
              Sign in to track your achievements and earn badges!
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
        </div>
      </div>
    );
  }

  const earnedBadges = userProfile?.stats?.badges || [];
  const earnedCount = earnedBadges.length;
  const totalCount = allBadges.length;
  const progressPercent = Math.round((earnedCount / totalCount) * 100);

  // Filter badges
  const filteredBadges = allBadges.filter(badge => {
    if (filter === 'earned') return earnedBadges.includes(badge.id);
    if (filter === 'locked') return !earnedBadges.includes(badge.id);
    return true;
  });

  // Get rarity color
  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'common': return 'from-gray-400 to-gray-600';
      case 'uncommon': return 'from-green-400 to-green-600';
      case 'rare': return 'from-blue-400 to-blue-600';
      case 'legendary': return 'from-purple-400 to-purple-600';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const getRarityBorder = (rarity) => {
    switch (rarity) {
      case 'common': return 'border-gray-300';
      case 'uncommon': return 'border-green-300';
      case 'rare': return 'border-blue-300';
      case 'legendary': return 'border-purple-300';
      default: return 'border-gray-300';
    }
  };

  // Calculate progress for each badge
  const getBadgeProgress = (badge) => {
    const stats = userProfile?.stats || {};
    
    switch (badge.requirement.type) {
      case 'meals_logged':
        return {
          current: stats.totalMeals || 0,
          required: badge.requirement.value,
          percent: Math.min(((stats.totalMeals || 0) / badge.requirement.value) * 100, 100)
        };
      case 'streak_days':
        return {
          current: stats.currentStreak || 0,
          required: badge.requirement.value,
          percent: Math.min(((stats.currentStreak || 0) / badge.requirement.value) * 100, 100)
        };
      case 'photo_logs':
        // TODO: Track this in stats
        return {
          current: 0,
          required: badge.requirement.value,
          percent: 0
        };
      case 'goal_days':
        // TODO: Track this in stats
        return {
          current: 0,
          required: badge.requirement.value,
          percent: 0
        };
      default:
        return { current: 0, required: badge.requirement.value, percent: 0 };
    }
  };

  if (isLoading) {
    return <Loading message="Loading achievements..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-6 pt-4">
      {/* Header */}
<div className="bg-gradient-primary text-white mb-6">
  <div className="container-custom py-8">
    <div className="flex items-center gap-3 mb-4">
     
      <div>
        <h1 className="text-3xl font-bold">Achievements</h1>
        <p className="opacity-90">
          {earnedCount} of {totalCount} badges earned
        </p>
      </div>
    </div>

    {/* Progress Bar */}
    <div className="bg-white/20 rounded-full h-4 overflow-hidden">
      <div 
        className="bg-white h-full transition-all duration-500"
        style={{ width: `${progressPercent}%` }}
      ></div>
    </div>
    <p className="text-sm opacity-90 mt-2 text-right">{progressPercent}% Complete</p>
  </div>
</div>


      <div className="container-custom py-6 space-y-6">
        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-4">
          <div className="card text-center bg-gradient-to-br from-yellow-50 to-orange-50">
            <div className="text-4xl mb-2">🏆</div>
            <p className="text-3xl font-bold text-yellow-600">{earnedCount}</p>
            <p className="text-sm text-gray-600">Badges Earned</p>
          </div>
          <div className="card text-center bg-gradient-to-br from-blue-50 to-indigo-50">
            <div className="text-4xl mb-2">🔒</div>
            <p className="text-3xl font-bold text-blue-600">{totalCount - earnedCount}</p>
            <p className="text-sm text-gray-600">Locked Badges</p>
          </div>
          <div className="card text-center bg-gradient-to-br from-green-50 to-teal-50">
            <div className="text-4xl mb-2">🔥</div>
            <p className="text-3xl font-bold text-green-600">{userProfile?.stats?.currentStreak || 0}</p>
            <p className="text-sm text-gray-600">Day Streak</p>
          </div>
          <div className="card text-center bg-gradient-to-br from-purple-50 to-pink-50">
            <div className="text-4xl mb-2">📊</div>
            <p className="text-3xl font-bold text-purple-600">{userProfile?.stats?.totalMeals || 0}</p>
            <p className="text-sm text-gray-600">Total Meals</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="card">
          <div className="flex gap-2">
            {[
              { key: 'all', label: 'All Badges', count: totalCount },
              { key: 'earned', label: 'Earned', count: earnedCount },
              { key: 'locked', label: 'Locked', count: totalCount - earnedCount }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`flex-1 py-3 px-4 rounded-lg font-semibold transition ${
                  filter === tab.key
                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        {/* Badges Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBadges.map((badge) => {
            const isEarned = earnedBadges.includes(badge.id);
            const progress = getBadgeProgress(badge);

            return (
              <div
                key={badge.id}
                className={`card relative overflow-hidden transition-all ${
                  isEarned 
                    ? `border-2 ${getRarityBorder(badge.rarity)} hover:shadow-xl hover:-translate-y-1` 
                    : 'opacity-75 hover:opacity-100'
                }`}
              >
                {/* Rarity Ribbon */}
                {isEarned && (
                  <div className={`absolute top-0 right-0 bg-gradient-to-br ${getRarityColor(badge.rarity)} text-white text-xs font-bold px-3 py-1 rounded-bl-lg`}>
                    {badge.rarity}
                  </div>
                )}

                {/* Badge Icon */}
                <div className="text-center mb-4">
                  <div className={`text-7xl mb-3 ${!isEarned && 'grayscale opacity-40'} transition-all`}>
                    {badge.icon}
                  </div>
                  {isEarned && (
                    <div className="inline-block bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">
                      ✓ UNLOCKED
                    </div>
                  )}
                  {!isEarned && (
                    <div className="inline-block bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                      <Lock size={12} />
                      LOCKED
                    </div>
                  )}
                </div>

                {/* Badge Info */}
                <h3 className="text-xl font-bold text-center mb-2">{badge.name}</h3>
                <p className="text-sm text-gray-600 text-center mb-4">{badge.description}</p>

                {/* Progress Bar (for locked badges) */}
                {!isEarned && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-semibold text-primary">
                        {progress.current} / {progress.required}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-yellow-500 to-orange-500 h-full transition-all duration-500"
                        style={{ width: `${progress.percent}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-center text-gray-500">
                      {Math.round(progress.percent)}% Complete
                    </p>
                  </div>
                )}

                {/* Earned Date (for earned badges) */}
                {isEarned && (
                  <div className="text-center text-xs text-gray-500 mt-4 pt-4 border-t">
                    Earned recently
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredBadges.length === 0 && (
          <div className="card text-center py-12">
            <span className="text-6xl mb-4 block">🎯</span>
            <h3 className="text-xl font-bold mb-2">No badges here yet!</h3>
            <p className="text-gray-600 mb-6">
              {filter === 'earned' 
                ? 'Keep logging meals to earn your first badge!'
                : 'All badges unlocked! You\'re amazing! 🎉'
              }
            </p>
            <Link to="/log-meal">
              <Button>Log a Meal</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Achievements;
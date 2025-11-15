import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  orderBy,
  Timestamp,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
  getDoc,
  limit
} from 'firebase/firestore';
import { db } from './config';
import { getAuth } from 'firebase/auth';

// ================== MEALS ==================

// Save meal
export const saveMealToFirestore = async (mealData) => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      // For testing without auth
      console.warn('⚠️ No user logged in, saving to localStorage');
      saveMealToLocalStorage(mealData);
      return 'local_' + Date.now();
    }

    const mealRef = collection(db, 'meals');
    
    const docData = {
      userId: user.uid,
      foods: mealData.foods,
      mealType: mealData.mealType,
      totals: mealData.totals,
      timestamp: Timestamp.fromDate(mealData.timestamp),
      createdAt: Timestamp.now(),
      hasPhoto: mealData.hasPhoto || false
    };

    const docRef = await addDoc(mealRef, docData);
    console.log('✅ Meal saved:', docRef.id);
    
    // Also update user stats
    await updateUserStats(user.uid);
    
    return docRef.id;
    
  } catch (error) {
    console.error('❌ Error saving meal:', error);
    throw error;
  }
};

// Get today's meals
export const getTodaysMeals = async () => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      console.warn('⚠️ No user logged in, loading from localStorage');
      return getMealsFromLocalStorage();
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const mealsRef = collection(db, 'meals');
    const q = query(
      mealsRef,
      where('userId', '==', user.uid),
      where('timestamp', '>=', Timestamp.fromDate(today)),
      orderBy('timestamp', 'desc')
    );

    const snapshot = await getDocs(q);
    const meals = [];

    snapshot.forEach(doc => {
      meals.push({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate()
      });
    });

    console.log('✅ Loaded', meals.length, 'meals');
    return meals;
    
  } catch (error) {
    console.error('❌ Error fetching meals:', error);
    return [];
  }
};

// Get meals by date range
export const getMealsByDateRange = async (startDate, endDate) => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) return [];

    const mealsRef = collection(db, 'meals');
    const q = query(
      mealsRef,
      where('userId', '==', user.uid),
      where('timestamp', '>=', Timestamp.fromDate(startDate)),
      where('timestamp', '<=', Timestamp.fromDate(endDate)),
      orderBy('timestamp', 'desc')
    );

    const snapshot = await getDocs(q);
    const meals = [];

    snapshot.forEach(doc => {
      meals.push({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate()
      });
    });

    return meals;
    
  } catch (error) {
    console.error('Error fetching meals:', error);
    return [];
  }
};

// Get all user meals (for history)
export const getAllUserMeals = async (limitCount = 100) => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) return [];

    const mealsRef = collection(db, 'meals');
    const q = query(
      mealsRef,
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    const meals = [];

    snapshot.forEach(doc => {
      meals.push({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate()
      });
    });

    return meals;
    
  } catch (error) {
    console.error('Error fetching all meals:', error);
    return [];
  }
};

// Delete meal
export const deleteMeal = async (mealId) => {
  try {
    const mealRef = doc(db, 'meals', mealId);
    await deleteDoc(mealRef);
    console.log('✅ Meal deleted');
  } catch (error) {
    console.error('Error deleting meal:', error);
    throw error;
  }
};

// ================== USER STATS ==================

// Get or create user profile
export const getUserProfile = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {return userDoc.data();
    } else {
      // Create default profile
      const defaultProfile = {
        userId,
        calorieGoal: 2000,
        proteinGoal: 150,
        carbsGoal: 250,
        fatsGoal: 65,
        weight: 70,
        height: 170,
        age: 25,
        gender: 'other',
        activityLevel: 'moderate',
        createdAt: Timestamp.now(),
        stats: {
          totalMeals: 0,
          currentStreak: 0,
          longestStreak: 0,
          totalCalories: 0,
          badges: []
        }
      };
      
      await setDoc(userRef, defaultProfile);
      return defaultProfile;
    }
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

// Update user profile
export const updateUserProfile = async (userId, updates) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
    console.log('✅ Profile updated');
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
};

// Update user stats after logging a meal
export const updateUserStats = async (userId) => {
  try {
    const profile = await getUserProfile(userId);
    if (!profile) return;

    // Get total meals count
    const mealsRef = collection(db, 'meals');
    const q = query(mealsRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);
    
    const totalMeals = snapshot.size;
    
    // Calculate streak
    const meals = [];
    snapshot.forEach(doc => {
      meals.push({
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate()
      });
    });
    
    const streak = calculateStreak(meals);
    
    // Update profile
    await updateDoc(doc(db, 'users', userId), {
      'stats.totalMeals': totalMeals,
      'stats.currentStreak': streak.current,
      'stats.longestStreak': Math.max(streak.current, profile.stats?.longestStreak || 0),
      updatedAt: Timestamp.now()
    });
    
  } catch (error) {
    console.error('Error updating stats:', error);
  }
};

// // ================== ACHIEVEMENTS ==================

// Check and award badges
export const checkAndAwardBadges = async (userId) => {
  try {
    const profile = await getUserProfile(userId);
    if (!profile) return [];

    const badges = await import('../../data/badges.json');
    const allBadges = badges.default;
    const currentBadges = profile.stats?.badges || [];
    const newBadges = [];

    for (const badge of allBadges) {
      // Skip if already earned
      if (currentBadges.includes(badge.id)) continue;

      let earned = false;

      switch (badge.requirement.type) {
        case 'meals_logged':
          earned = profile.stats.totalMeals >= badge.requirement.value;
          break;
        case 'streak_days':
          earned = profile.stats.currentStreak >= badge.requirement.value;
          break;
        case 'photo_logs':
          // Count meals with photos
          const mealsRef = collection(db, 'meals');
          const q = query(
            mealsRef,
            where('userId', '==', userId),
            where('hasPhoto', '==', true)
          );
          const snapshot = await getDocs(q);
          earned = snapshot.size >= badge.requirement.value;
          break;
      }

      if (earned) {
        newBadges.push(badge.id);
      }
    }

    if (newBadges.length > 0) {
      await updateDoc(doc(db, 'users', userId), {
        'stats.badges': [...currentBadges, ...newBadges]
      });
    }

    return newBadges;

  } catch (error) {
    console.error('Error checking badges:', error);
    return [];
  }
};

// ================== CALCULATIONS ==================

// Calculate daily totals
export const calculateDailyTotals = (meals) => {
  return meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + (meal.totals?.calories || 0),
      protein: acc.protein + (meal.totals?.protein || 0),
      carbs: acc.carbs + (meal.totals?.carbs || 0),
      fats: acc.fats + (meal.totals?.fats || 0)
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );
};

// Calculate streak
export const calculateStreak = (meals) => {
  if (meals.length === 0) return { current: 0, longest: 0 };

  // Sort by date (newest first)
  const sortedMeals = meals.sort((a, b) => b.timestamp - a.timestamp);
  
  // Get unique dates
  const dates = [...new Set(sortedMeals.map(meal => {
    const d = new Date(meal.timestamp);
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  }))];

  let currentStreak = 0;
  let longestStreak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check current streak
  for (let i = 0; i < dates.length; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    const checkDateStr = `${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`;

    if (dates.includes(checkDateStr)) {
      currentStreak++;
    } else {
      break;
    }
  }

  longestStreak = currentStreak;

  return { current: currentStreak, longest: longestStreak };
};

// Group meals by date
export const groupMealsByDate = (meals) => {
  const grouped = {};

  meals.forEach(meal => {
    const date = new Date(meal.timestamp);
    const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD

    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(meal);
  });

  return grouped;
};

// Calculate weekly average
export const calculateWeeklyAverage = (meals) => {
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);

  const weekMeals = meals.filter(meal => 
    new Date(meal.timestamp) >= lastWeek
  );

  if (weekMeals.length === 0) {
    return { calories: 0, protein: 0, carbs: 0, fats: 0 };
  }

  const totals = calculateDailyTotals(weekMeals);
  const days = 7;

  return {
    calories: Math.round(totals.calories / days),
    protein: Math.round(totals.protein / days),
    carbs: Math.round(totals.carbs / days),
    fats: Math.round(totals.fats / days)
  };
};

// ================== LOCAL STORAGE FALLBACK ==================

const MEALS_STORAGE_KEY = 'caloriesnap_meals';

const saveMealToLocalStorage = (mealData) => {
  try {
    const meals = getMealsFromLocalStorage();
    meals.push({
      id: 'local_' + Date.now(),
      ...mealData,
      timestamp: mealData.timestamp.toISOString(),
      createdAt: new Date().toISOString()
    });
    localStorage.setItem(MEALS_STORAGE_KEY, JSON.stringify(meals));
    console.log('✅ Meal saved to localStorage');
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

const getMealsFromLocalStorage = () => {
  try {
    const stored = localStorage.getItem(MEALS_STORAGE_KEY);
    if (!stored) return [];
    
    const meals = JSON.parse(stored);
    
    // Filter for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return meals
      .filter(meal => new Date(meal.timestamp) >= today)
      .map(meal => ({
        ...meal,
        timestamp: new Date(meal.timestamp)
      }));
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return [];
  }
};

export const clearLocalStorage = () => {
  localStorage.removeItem(MEALS_STORAGE_KEY);
};
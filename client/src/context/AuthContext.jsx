import { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '../services/firebase/config';
import { getUserProfile } from '../services/firebase/firestore';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        
        // Load user profile
        try {
          const profile = await getUserProfile(firebaseUser.uid);
          setUserProfile(profile);
          
          // Check if we need to migrate localStorage data
          const localMeals = localStorage.getItem('caloriesnap_meals');
          if (localMeals) {
            const meals = JSON.parse(localMeals);
            if (meals.length > 0) {
              console.log(`📦 Found ${meals.length} meals in localStorage`);

              // ✅ FIXED: replaced toast.info with toast()
              toast('Found local meals. Go to Profile to migrate to cloud!');
            }
          }
        } catch (error) {
          console.error('Error loading profile:', error);
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Sign Up
  const signup = async (email, password, name) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create user profile in Firestore
      const profileData = {
        userId: result.user.uid,
        email: email,
        name: name,
        calorieGoal: 2000,
        proteinGoal: 150,
        carbsGoal: 250,
        fatsGoal: 65,
        createdAt: Timestamp.now(),
        stats: {
          totalMeals: 0,
          currentStreak: 0,
          longestStreak: 0,
          badges: []
        }
      };
      
      await setDoc(doc(db, 'users', result.user.uid), profileData);
      
      toast.success('Account created successfully! 🎉');
      return result.user;
    } catch (error) {
      console.error('Signup error:', error);
      
      let message = 'Failed to create account';
      if (error.code === 'auth/email-already-in-use') {
        message = 'Email already in use';
      } else if (error.code === 'auth/weak-password') {
        message = 'Password should be at least 6 characters';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Invalid email address';
      }
      
      toast.error(message);
      throw error;
    }
  };

  // Sign In
  const login = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      toast.success('Welcome back! 👋');
      return result.user;
    } catch (error) {
      console.error('Login error:', error);
      
      let message = 'Failed to login';
      if (error.code === 'auth/user-not-found') {
        message = 'No account found with this email';
      } else if (error.code === 'auth/wrong-password') {
        message = 'Incorrect password';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Invalid email address';
      } else if (error.code === 'auth/too-many-requests') {
        message = 'Too many attempts. Try again later';
      } else if (error.code === 'auth/invalid-credential') {
        message = 'Invalid email or password';
      }
      
      toast.error(message);
      throw error;
    }
  };

  // Sign Out
  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
      throw error;
    }
  };

  const value = {
    user,
    userProfile,
    loading,
    signup,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;

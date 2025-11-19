import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/common/Navbar';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import LogMeal from './pages/LogMeal';
import History from './pages/History';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Achievements from './pages/Achievements';
import { useEffect, useState } from 'react';
import { getAllUserMeals, getUserProfile } from './services/firebase/firestore';
import { useAuth } from './context/AuthContext';

function AppContent() {
  const { user } = useAuth();
  const [meals, setMeals] = useState([]);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    if (!user) return;

    getAllUserMeals().then(fetchedMeals => setMeals(fetchedMeals));
    getUserProfile(user.uid).then(profile => setUserProfile(profile));
  }, [user]);

  return (
    <>
      <Navbar meals={meals} userProfile={userProfile} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/log-meal" element={<LogMeal />} />
        <Route path="/history" element={<History />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/achievements" element={<Achievements />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <AppContent />
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#333',
                color: '#fff',
              },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

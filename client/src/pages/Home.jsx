import { Link } from 'react-router-dom';
import { Camera, TrendingUp, Zap, Award } from 'lucide-react';
import Button from '../components/common/Button';

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-teal-50">
      {/* Hero Section */}
      <div className="container-custom py-20 text-center">
        <div className="animate-fade-in">
          <span className="text-6xl mb-6 block">🍽️</span>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Welcome to <span className="text-primary">CalorieSnap</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Track your calories effortlessly with AI-powered food recognition.
            Snap a photo, get instant nutrition data, and achieve your health goals.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/log-meal">
              <Button className="text-lg px-8 py-4">
                <Camera size={24} />
                Start Logging
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="outline" className="text-lg px-8 py-4">
                View Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="container-custom py-20">
        <h2 className="text-3xl font-bold text-center mb-12">
          Why Choose CalorieSnap?
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: Camera,
              title: 'Instant Recognition',
              description: 'Snap a photo and our AI identifies food items in seconds',
              color: 'text-primary'
            },
            {
              icon: TrendingUp,
              title: 'Track Progress',
              description: 'Monitor your daily intake with beautiful charts and insights',
              color: 'text-secondary'
            },
            {
              icon: Zap,
              title: 'Lightning Fast',
              description: 'Log meals in 10 seconds instead of 2 minutes of manual entry',
              color: 'text-accent'
            }
          ].map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="card text-center hover:shadow-xl transition-all hover:-translate-y-1"
              >
                <div className={`inline-block p-4 rounded-full bg-gray-100 mb-4 ${feature.color}`}>
                  <Icon size={32} />
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-gradient-primary text-white py-20">
        <div className="container-custom text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Start Your Journey?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of users achieving their health goals
          </p>
          <Link to="/log-meal">
            <Button variant="secondary" className="text-lg px-8 py-4">
              Get Started Free
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
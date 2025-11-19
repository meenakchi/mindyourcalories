import { Camera, TrendingUp, Zap } from 'lucide-react';


const Home = () => {
  return (
    <div className="flex flex-col min-h-screen overflow-hidden">
      <main className="flex-1 flex flex-col items-center justify-center w-full px-4">
        {/* Hero Section */}
        <section className="flex flex-col items-center justify-center text-center max-w-6xl w-full gap-8">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900">
            Welcome to <span className="text-[#FF6B6B]">CalorieSnap🍽️</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl">
            Track your calories effortlessly with AI-powered food recognition. Snap a photo, get instant nutrition data, and achieve your health goals.
          </p>
        </section>


        {/* Features Section */}
        <section className="w-full flex justify-center px-4 mt-20">
          <div className="max-w-6xl w-full grid md:grid-cols-3 gap-8">
            {[
              { icon: Camera, title: 'Instant Recognition', description: 'Snap a photo and our AI identifies food items in seconds.' },
              { icon: TrendingUp, title: 'Track Progress', description: 'Monitor your daily intake with beautiful charts and insights.' },
              { icon: Zap, title: 'Lightning Fast', description: 'Log meals in 10 seconds instead of 2 minutes of manual entry.' },
            ].map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div
                  key={i}
                  className="bg-white rounded-xl p-8 text-center hover:shadow-xl transition-all hover:-translate-y-1 shadow-md"
                >
                  <div className="inline-block p-4 rounded-full bg-gray-100 mb-4">
                    <Icon size={32} className="text-gray-700" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </section>
      </main>


      {/* Footer */}
      <footer className="w-full bg-gradient-primary text-white py-6 flex justify-center">
        <div className="max-w-5xl w-full text-center px-8 space-y-10">
          <h2 className="text-5xl font-bold mb-4">Ready to Start Your Journey?</h2>
        </div>
      </footer>
    </div>
  );
};


export default Home;

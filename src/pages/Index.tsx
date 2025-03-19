
import RegistrationForm from '@/components/RegistrationForm';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-white to-contest-lightGray p-6">
      <div className="absolute top-6 left-6 flex items-center animate-fade-in">
        <div className="h-8 w-8 bg-contest-red rounded-lg"></div>
        <span className="ml-2 font-bold text-lg">CodeArena</span>
      </div>
      
      <div className="w-full max-w-md glass-panel p-8 animate-slide-up">
        <RegistrationForm />
      </div>
      
      <div className="mt-6 text-contest-darkGray text-sm animate-fade-in">
        © {new Date().getFullYear()} CodeArena. All rights reserved.
      </div>
    </div>
  );
};

export default Index;

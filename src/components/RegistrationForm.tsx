
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";
import { fetchContestDetails, saveUserInfo } from '@/services/contestService';

type UserFormData = {
  fullName: string;
  email: string;
  prn: string;
  year: string;
  batch: string;
  contestCode: string;
};

const RegistrationForm = () => {
  const [formData, setFormData] = useState<UserFormData>({
    fullName: '',
    email: '',
    prn: '',
    year: '',
    batch: '',
    contestCode: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isCodeValid, setIsCodeValid] = useState<boolean | null>(null);

  const navigate = useNavigate();
  const { toast } = useToast();

  const validateContestCode = (code: string) => {
    return code.match(/^arenacnst-[a-z0-9]{4}$/i);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Validate contest code format as user types
    if (name === 'contestCode') {
      setIsCodeValid(value.length > 0 ? !!validateContestCode(value) : null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateContestCode(formData.contestCode)) {
      toast({
        title: "Invalid contest code",
        description: "Format should be arenacnst-xxxx where xxxx is a unique code",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // First save user info and get the user ID
      const userId = await saveUserInfo(formData);
      
      // Fetch contest details
      const contestDetails = await fetchContestDetails(formData.contestCode);
      
      // Store user info, user ID and contest details in sessionStorage
      sessionStorage.setItem('userInfo', JSON.stringify(formData));
      sessionStorage.setItem('userId', userId);
      sessionStorage.setItem('contestDetails', JSON.stringify(contestDetails));
      
      navigate('/contest-details');
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch contest details. Please check your contest code.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md animate-fade-in">
      <div className="mb-6 text-center">
        <div className="inline-block px-3 py-1 mb-2 text-sm font-medium text-contest-red bg-contest-red bg-opacity-10 rounded-full animate-slide-down">
          Coding Arena
        </div>
        <h1 className="text-3xl font-bold mb-1">Welcome, Coder</h1>
        <p className="text-contest-darkGray">Please register to continue</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1">
          <label htmlFor="fullName" className="block text-sm font-medium">Full Name</label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            required
            className="contest-input"
            value={formData.fullName}
            onChange={handleInputChange}
          />
        </div>
        
        <div className="space-y-1">
          <label htmlFor="email" className="block text-sm font-medium">Email ID</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="contest-input"
            value={formData.email}
            onChange={handleInputChange}
          />
        </div>
        
        <div className="space-y-1">
          <label htmlFor="prn" className="block text-sm font-medium">PRN</label>
          <input
            id="prn"
            name="prn"
            type="text"
            required
            className="contest-input"
            value={formData.prn}
            onChange={handleInputChange}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="year" className="block text-sm font-medium">Year</label>
            <select
              id="year"
              name="year"
              required
              className="contest-input"
              value={formData.year}
              onChange={handleInputChange}
            >
              <option value="" disabled>Select Year</option>
              <option value="1">First Year</option>
              <option value="2">Second Year</option>
              <option value="3">Third Year</option>
              <option value="4">Fourth Year</option>
            </select>
          </div>
          
          <div className="space-y-1">
            <label htmlFor="batch" className="block text-sm font-medium">Batch</label>
            <input
              id="batch"
              name="batch"
              type="text"
              required
              className="contest-input"
              value={formData.batch}
              onChange={handleInputChange}
            />
          </div>
        </div>
        
        <div className="space-y-1">
          <label htmlFor="contestCode" className="block text-sm font-medium">Contest Code</label>
          <input
            id="contestCode"
            name="contestCode"
            type="text"
            required
            placeholder="arenacnst-xxxx"
            className={`contest-input ${
              isCodeValid === true ? 'border-green-500' : 
              isCodeValid === false ? 'border-red-500' : ''
            }`}
            value={formData.contestCode}
            onChange={handleInputChange}
          />
          {isCodeValid === false && (
            <p className="text-xs text-red-500 mt-1">
              Format should be arenacnst-xxxx where xxxx is a unique code
            </p>
          )}
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className="contest-button w-full mt-6"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
          ) : (
            'Next'
          )}
        </button>
      </form>
    </div>
  );
};

export default RegistrationForm;

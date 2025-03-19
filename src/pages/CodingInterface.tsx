
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";
import CodeEditor from '@/components/CodeEditor';

type Question = {
  id: string;
  title: string;
  description: string;
  examples: {
    input: string;
    output: string;
    explanation?: string;
  }[];
  constraints: string[];
  testcases: {
    input: string;
    expected_output: string;
  }[];
  defaultCode: Record<string, string>;
};

const CodingInterface = () => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if contest is started
    const contestEndTime = sessionStorage.getItem('contestEndTime');
    if (!contestEndTime) {
      toast({
        title: "Contest not started",
        description: "Please start the contest properly",
        variant: "destructive",
      });
      navigate('/contest-details');
      return;
    }
    
    // Retrieve contest details and questions
    const contestDetails = JSON.parse(sessionStorage.getItem('contestDetails') || '{}');
    if (!contestDetails || !contestDetails.questions || contestDetails.questions.length === 0) {
      // In a real app, you would fetch questions from the API
      // For demo, we'll create a mock question
      const mockQuestion: Question = {
        id: "q1",
        title: "Two Sum",
        description: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.",
        examples: [
          {
            input: "nums = [2,7,11,15], target = 9",
            output: "[0,1]",
            explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]."
          },
          {
            input: "nums = [3,2,4], target = 6",
            output: "[1,2]"
          }
        ],
        constraints: [
          "2 <= nums.length <= 10^4",
          "-10^9 <= nums[i] <= 10^9",
          "-10^9 <= target <= 10^9",
          "Only one valid answer exists."
        ],
        testcases: [
          {
            input: "[2,7,11,15]\n9",
            expected_output: "[0,1]"
          }
        ],
        defaultCode: {
          cpp: `#include <vector>\n\nclass Solution {\npublic:\n    std::vector<int> twoSum(std::vector<int>& nums, int target) {\n        // Your code here\n        \n    }\n};`,
          java: `class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Your code here\n        \n    }\n}`,
          python: `class Solution:\n    def twoSum(self, nums, target):\n        # Your code here\n        pass`,
          javascript: `/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nvar twoSum = function(nums, target) {\n    // Your code here\n    \n};`
        }
      };
      
      setCurrentQuestion(mockQuestion);
    } else {
      setCurrentQuestion(contestDetails.questions[0]);
    }
    
    // Start the timer
    const endTimeMs = parseInt(contestEndTime);
    const updateTimer = () => {
      const now = new Date().getTime();
      const diff = Math.max(0, endTimeMs - now);
      const secondsLeft = Math.floor(diff / 1000);
      
      setTimeLeft(secondsLeft);
      
      if (secondsLeft <= 0) {
        // Contest ended
        clearInterval(timerInterval);
        toast({
          title: "Time's up!",
          description: "The contest has ended",
          variant: "destructive",
        });
        navigate('/');
      }
    };
    
    updateTimer();
    const timerInterval = setInterval(updateTimer, 1000);
    setIsLoading(false);
    
    return () => clearInterval(timerInterval);
  }, [navigate, toast]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-pulse-soft">Preparing coding environment...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="bg-white border-b border-contest-lightGray px-6 py-3 flex justify-between items-center shadow-sm z-10">
        <div className="flex items-center">
          <div className="h-8 w-8 bg-contest-red rounded-lg"></div>
          <span className="ml-2 font-bold text-lg">CodeArena</span>
        </div>
        
        <div className="text-contest-red font-mono font-bold text-xl">
          {formatTime(timeLeft)}
        </div>
      </header>
      
      <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
        {/* Question Panel */}
        <div className="border-r border-contest-lightGray overflow-y-auto p-6">
          {currentQuestion && (
            <div className="max-w-3xl mx-auto">
              <h1 className="text-2xl font-bold mb-4">{currentQuestion.title}</h1>
              
              <div className="mb-6">
                <p className="whitespace-pre-line">{currentQuestion.description}</p>
              </div>
              
              <div className="mb-6">
                <h2 className="text-lg font-bold mb-2">Examples:</h2>
                {currentQuestion.examples.map((example, idx) => (
                  <div key={idx} className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <div className="mb-2">
                      <div className="font-medium">Input:</div>
                      <div className="font-mono bg-white p-2 border border-contest-lightGray rounded mt-1">{example.input}</div>
                    </div>
                    <div className="mb-2">
                      <div className="font-medium">Output:</div>
                      <div className="font-mono bg-white p-2 border border-contest-lightGray rounded mt-1">{example.output}</div>
                    </div>
                    {example.explanation && (
                      <div>
                        <div className="font-medium">Explanation:</div>
                        <div className="mt-1">{example.explanation}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="mb-6">
                <h2 className="text-lg font-bold mb-2">Constraints:</h2>
                <ul className="list-disc pl-5 space-y-1">
                  {currentQuestion.constraints.map((constraint, idx) => (
                    <li key={idx} className="font-mono text-sm">{constraint}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
        
        {/* Code Editor Panel */}
        <div className="p-4 overflow-hidden">
          {currentQuestion && <CodeEditor question={currentQuestion} />}
        </div>
      </div>
    </div>
  );
};

export default CodingInterface;

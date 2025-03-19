
// Mock data for demo purposes
// In a real app, this would be fetched from a backend API

type ContestDetails = {
  id: string;
  name: string;
  description: string;
  instructions: string[];
  duration: number; // in minutes
  questionCount: number;
  questions?: any[]; // In a real app, this would be properly typed
};

const mockContests: Record<string, ContestDetails> = {
  'arenacnst-1234': {
    id: 'arenacnst-1234',
    name: 'Winter Coding Challenge 2023',
    description: 'Test your coding skills with a series of algorithmic challenges designed to evaluate your problem-solving abilities and coding efficiency. This contest features questions of varying difficulty levels, from easy to hard.',
    instructions: [
      'You have 90 minutes to solve all questions.',
      'Each question is worth 100 points.',
      'You can attempt the questions in any order.',
      'Your code will be evaluated based on correctness and efficiency.',
      'Partial scores will be awarded for partially correct solutions.',
      'Do not refresh the page or navigate away during the contest.',
      'Any form of plagiarism or cheating will result in disqualification.'
    ],
    duration: 90,
    questionCount: 3
  },
  'arenacnst-5678': {
    id: 'arenacnst-5678',
    name: 'Data Structures Mastery',
    description: 'A specialized contest focused on data structure implementation and optimization. Show your expertise in handling complex data structures like trees, graphs, and hash tables.',
    instructions: [
      'You have 120 minutes to solve all questions.',
      'Questions focus on data structure implementation and operations.',
      'Each question is worth 100 points.',
      'Extra points for optimal solutions.',
      'Do not use built-in libraries for the data structures being tested.'
    ],
    duration: 120,
    questionCount: 4
  }
};

export const fetchContestDetails = async (contestCode: string): Promise<ContestDetails> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const contest = mockContests[contestCode.toLowerCase()];
  
  if (!contest) {
    throw new Error('Contest not found');
  }
  
  return contest;
};

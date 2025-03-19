
import { supabase } from "@/integrations/supabase/client";

type ContestDetails = {
  id: string;
  name: string;
  description: string;
  instructions: string[];
  duration: number; // in minutes
  questionCount: number;
  questions?: any[]; // In a real app, this would be properly typed
};

export const fetchContestDetails = async (contestCode: string): Promise<ContestDetails> => {
  try {
    // Fetch contest details
    const { data: contestData, error: contestError } = await supabase
      .from('contests')
      .select('*')
      .eq('id', contestCode)
      .single();
    
    if (contestError) throw new Error(contestError.message);
    if (!contestData) throw new Error('Contest not found');
    
    // Fetch contest instructions
    const { data: instructionsData, error: instructionsError } = await supabase
      .from('contest_instructions')
      .select('instruction, position')
      .eq('contest_id', contestCode)
      .order('position', { ascending: true });
    
    if (instructionsError) throw new Error(instructionsError.message);
    
    // Map instructions to string array
    const instructions = instructionsData?.map(item => item.instruction) || [];
    
    return {
      id: contestData.id,
      name: contestData.name,
      description: contestData.description,
      instructions: instructions,
      duration: contestData.duration,
      questionCount: contestData.question_count
    };
  } catch (error) {
    console.error('Error fetching contest details:', error);
    throw error;
  }
};

export const fetchContestQuestions = async (contestCode: string) => {
  try {
    // Fetch questions for this contest
    const { data: questionsData, error: questionsError } = await supabase
      .from('questions')
      .select(`
        id,
        title,
        description,
        difficulty,
        position,
        question_examples(id, input, output, explanation, position),
        question_constraints(id, constraint_text, position),
        test_cases(id, input, expected_output, position, is_sample)
      `)
      .eq('contest_id', contestCode)
      .order('position', { ascending: true });
    
    if (questionsError) throw new Error(questionsError.message);
    
    // Format questions with the expected structure
    const formattedQuestions = questionsData.map(question => {
      // Sort examples by position
      const examples = question.question_examples
        .sort((a: any, b: any) => a.position - b.position)
        .map((ex: any) => ({
          input: ex.input,
          output: ex.output,
          explanation: ex.explanation
        }));
      
      // Sort constraints by position
      const constraints = question.question_constraints
        .sort((a: any, b: any) => a.position - b.position)
        .map((c: any) => c.constraint_text);
      
      // Sort test cases by position and filter sample ones
      const testcases = question.test_cases
        .sort((a: any, b: any) => a.position - b.position)
        .map((tc: any) => ({
          input: tc.input,
          expected_output: tc.expected_output
        }));
      
      // Create default code templates
      const defaultCode = {
        cpp: `#include <vector>\n#include <iostream>\nusing namespace std;\n\n// Write your solution here\n\nint main() {\n  // Your code here\n  \n  return 0;\n}`,
        java: `class Solution {\n  public static void main(String[] args) {\n    // Your code here\n    \n  }\n}`,
        python: `# Write your solution here\n\ndef solve():\n    # Your code here\n    pass\n\nif __name__ == \"__main__\":\n    solve()`,
        javascript: `// Write your solution here\n\nfunction solve() {\n  // Your code here\n  \n}\n\nsolve();`
      };
      
      return {
        id: question.id,
        title: question.title,
        description: question.description,
        examples,
        constraints,
        testcases,
        defaultCode
      };
    });
    
    return formattedQuestions;
  } catch (error) {
    console.error('Error fetching contest questions:', error);
    throw error;
  }
};

export const saveUserInfo = async (userData: any) => {
  try {
    // Check if user with this email already exists
    const { data: existingUser, error: searchError } = await supabase
      .from('users')
      .select('id')
      .eq('email', userData.email)
      .maybeSingle();
    
    if (searchError) throw new Error(searchError.message);
    
    if (existingUser) {
      // User exists, return the id
      return existingUser.id;
    } else {
      // Insert new user
      const { data, error } = await supabase
        .from('users')
        .insert({
          full_name: userData.fullName,
          email: userData.email,
          prn: userData.prn,
          year: userData.year,
          batch: userData.batch
        })
        .select('id')
        .single();
      
      if (error) throw new Error(error.message);
      return data.id;
    }
  } catch (error) {
    console.error('Error saving user info:', error);
    throw error;
  }
};

export const startParticipation = async (userId: string, contestId: string) => {
  try {
    const startTime = new Date();
    const { data, error } = await supabase
      .from('participations')
      .insert({
        user_id: userId,
        contest_id: contestId,
        start_time: startTime.toISOString(),
        is_active: true
      })
      .select('id')
      .single();
    
    if (error) throw new Error(error.message);
    return data.id;
  } catch (error) {
    console.error('Error starting participation:', error);
    throw error;
  }
};

export const saveSubmission = async (submissionData: {
  userId: string,
  contestId: string,
  questionId: string,
  code: string,
  language: string,
  status: string,
  executionTime?: number,
  memoryUsed?: number
}) => {
  try {
    const { data, error } = await supabase
      .from('submissions')
      .insert({
        user_id: submissionData.userId,
        contest_id: submissionData.contestId,
        question_id: submissionData.questionId,
        code: submissionData.code,
        language: submissionData.language,
        status: submissionData.status,
        execution_time: submissionData.executionTime,
        memory_used: submissionData.memoryUsed
      })
      .select('id')
      .single();
    
    if (error) throw new Error(error.message);
    return data.id;
  } catch (error) {
    console.error('Error saving submission:', error);
    throw error;
  }
};

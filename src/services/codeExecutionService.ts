
// Define types for better code clarity
export interface CodeExecutionParams {
  language: string;
  code: string;
  input: string;
  expectedOutput?: string;
}

export interface CodeExecutionResult {
  output?: string;
  error?: string;
  status: string;
  executionTime?: number;
  memoryUsed?: number;
  token?: string;
}

const languageIds: Record<string, number> = {
  cpp: 54,       // C++ (GCC 9.2.0)
  java: 62,      // Java (OpenJDK 13.0.1)
  python: 71,    // Python (3.8.1)
  javascript: 63 // JavaScript (Node.js 12.14.0)
};

export const executeCode = async (params: CodeExecutionParams): Promise<CodeExecutionResult> => {
  try {
    const { language, code, input } = params;

    // Ensure language exists in languageIds
    const languageId = languageIds[language];
    if (!languageId) {
      throw new Error(`Unsupported language: ${language}`);
    }

    console.log('Preparing submission to Judge0 API...');
    console.log(`Language: ${language} (ID: ${languageId})`);
    console.log(`Code length: ${code.length} characters`);
    console.log(`Input: ${input}`);

    // Make sure code isn't empty
    if (!code || code.trim() === '') {
      throw new Error('Code cannot be empty');
    }

    // Create the request body - explicitly setting the fields without encoding
    const requestBody = {
      source_code: code,
      language_id: languageId,
      stdin: input
    };

    console.log('Request body:', JSON.stringify(requestBody, null, 2));

    // First request: Submit the code - explicitly set base64_encoded=false
    console.log('Submitting code to Judge0 API...');
    const submissionResponse = await fetch('http://82.25.104.175:2358/submissions?base64_encoded=false&wait=false', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody),
    });

    console.log('Submission response status:', submissionResponse.status);
    
    if (!submissionResponse.ok) {
      const errorText = await submissionResponse.text();
      console.error('Submission failed:', submissionResponse.status, errorText);
      throw new Error(`Submission failed: ${submissionResponse.status} ${errorText}`);
    }

    // Parse the submission response
    const responseText = await submissionResponse.text();
    console.log('Raw submission response:', responseText);
    
    let submissionData;
    try {
      submissionData = JSON.parse(responseText);
      console.log('Parsed submission data:', submissionData);
    } catch (error) {
      console.error('Failed to parse submission response:', error, 'Raw response:', responseText);
      throw new Error('Invalid response from Judge0 API');
    }

    // Extract the token
    const token = submissionData.token;
    if (!token) {
      console.error('No token in response:', submissionData);
      throw new Error('No token received from Judge0 API');
    }

    console.log(`Code submitted successfully. Token: ${token}`);

    // Polling for execution result
    let result: any = null;
    let attempt = 0;
    const maxAttempts = 60; // Increase timeout for slow servers
    const pollingInterval = 1000; // 1 second

    while (attempt < maxAttempts) {
      attempt++;
      console.log(`Polling for results, attempt ${attempt}/${maxAttempts}...`);
      
      await new Promise(resolve => setTimeout(resolve, pollingInterval));

      // Second request: Get the execution result - base64_encoded=false to get plain text
      const resultUrl = `http://82.25.104.175:2358/submissions/${token}?base64_encoded=false`;
      console.log(`Fetching result from: ${resultUrl}`);
      
      const resultResponse = await fetch(resultUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
      });

      console.log('Result response status:', resultResponse.status);
      
      if (!resultResponse.ok) {
        const errorText = await resultResponse.text();
        console.error(`Error fetching execution result: ${resultResponse.status} ${errorText}`);
        
        if (attempt >= maxAttempts) {
          throw new Error(`Error fetching execution result: ${resultResponse.status} ${errorText}`);
        }
        continue;
      }

      // Get the raw response text to debug
      let responseText = await resultResponse.text();
      console.log('Raw result response:', responseText);

      // Parse the result response
      try {
        result = JSON.parse(responseText);
        console.log('Parsed result data:', JSON.stringify(result, null, 2));
      } catch (error) {
        console.error('Failed to parse result response:', error);
        console.error('Response that failed to parse:', responseText);
        
        if (attempt >= maxAttempts) {
          throw new Error('Invalid response from Judge0 API when fetching result');
        }
        continue;
      }

      // Check if execution is completed
      // Status ID reference:
      // 1 - In Queue, 2 - Processing, 3 - Accepted, 4 - Wrong Answer, 5 - Time Limit Exceeded, 6 - Compilation Error, etc.
      if (result?.status?.id > 2) {
        console.log(`Execution completed with status: ${result.status.id} (${result.status.description})`);
        break;
      }
      
      console.log(`Execution still in progress, status: ${result?.status?.id} (${result?.status?.description})`);
    }

    if (!result || !result.status) {
      throw new Error('Execution timeout or invalid response');
    }

    // Output detailed execution information
    console.log('Final execution result:', {
      status: result.status,
      stdout: result.stdout || '(no stdout)',
      stderr: result.stderr || '(no stderr)',
      compile_output: result.compile_output || '(no compile output)',
      time: result.time,
      memory: result.memory
    });

    // Determine the appropriate output and error from the result
    const output = result.stdout || '';
    const error = result.stderr || result.compile_output || '';
    
    // Handle common status codes for better UX
    let status = mapStatus(result.status.id);
    
    if (result.status.id === 3) { // Accepted status
      if (params.expectedOutput !== undefined) {
        // Compare with expected output for challenges
        const normalizedOutput = output.trim();
        const normalizedExpected = params.expectedOutput.trim();
        
        if (normalizedOutput === normalizedExpected) {
          status = 'Accepted';
        } else {
          status = 'Wrong Answer';
          console.log(`Expected: "${normalizedExpected}", Got: "${normalizedOutput}"`);
        }
      }
    } else if (error) {
      // Enhance error messages
      console.error(`Execution error: ${error}`);
    }

    // Return the complete result
    return {
      output,
      error,
      status,
      executionTime: result.time || 0,
      memoryUsed: result.memory || 0,
      token
    };

  } catch (error) {
    console.error('Execution error:', error);
    return { 
      error: error instanceof Error ? error.message : 'Unknown error', 
      status: 'Error' 
    };
  }
};

// Helper function to map status codes to human-readable status
const mapStatus = (statusId: number): string => {
  const statusMap: Record<number, string> = {
    1: 'In Queue',
    2: 'Processing',
    3: 'Accepted',
    4: 'Wrong Answer',
    5: 'Time Limit Exceeded',
    6: 'Compilation Error',
    7: 'Runtime Error (SIGSEGV)',
    8: 'Runtime Error (SIGXFSZ)',
    9: 'Runtime Error (SIGFPE)',
    10: 'Runtime Error (SIGABRT)',
    11: 'Runtime Error (NZEC)',
    12: 'Runtime Error (Other)',
    13: 'Internal Error',
    14: 'Exec Format Error'
  };
  
  return statusMap[statusId] || `Unknown Status (${statusId})`;
};


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

    // Create the request body - without base64 encoding
    const requestBody = {
      source_code: code,
      language_id: languageId,
      stdin: input
    };

    console.log('Submitting code to Judge0 API...');

    // First request: Submit the code - explicitly set base64_encoded to false
    const submissionResponse = await fetch('http://82.25.104.175:2358/submissions?base64_encoded=false&wait=false', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
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
    let submissionData;
    try {
      submissionData = await submissionResponse.json();
      console.log('Submission response data:', JSON.stringify(submissionData, null, 2));
    } catch (error) {
      console.error('Failed to parse submission response:', error);
      throw new Error('Invalid response from Judge0 API');
    }

    // Extract the token
    const token = submissionData.token;
    if (!token) {
      console.error('No token in response:', submissionData);
      throw new Error('No token received from Judge0');
    }

    console.log(`Code submitted successfully. Token: ${token}`);

    // Polling for execution result
    let result: any = null;
    let attempt = 0;
    const maxAttempts = 30;
    const pollingInterval = 1000; // 1 second

    while (attempt < maxAttempts) {
      attempt++;
      console.log(`Polling for results, attempt ${attempt}/${maxAttempts}...`);
      
      await new Promise(resolve => setTimeout(resolve, pollingInterval));

      // Second request: Get the execution result - base64_encoded=false to get plain text
      const resultResponse = await fetch(`http://82.25.104.175:2358/submissions/${token}?base64_encoded=false`, {
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

      let responseText = await resultResponse.text();
      console.log('Raw response:', responseText.substring(0, 200) + (responseText.length > 200 ? '...' : ''));

      // Parse the result response
      try {
        result = JSON.parse(responseText);
        console.log('Result response data:', JSON.stringify({
          status: result.status,
          time: result.time,
          memory: result.memory,
          stdout_length: result.stdout ? result.stdout.length : 0,
          stderr_length: result.stderr ? result.stderr.length : 0,
          compile_output_length: result.compile_output ? result.compile_output.length : 0
        }, null, 2));
      } catch (error) {
        console.error('Failed to parse result response:', error);
        console.error('Response that failed to parse:', responseText);
        
        if (attempt >= maxAttempts) {
          throw new Error('Invalid response from Judge0 API when fetching result');
        }
        continue;
      }

      // Check if execution is completed
      if (result?.status?.id > 2) {
        console.log(`Execution completed with status: ${result.status.id} (${result.status.description})`);
        break;
      }
      
      console.log(`Execution still in progress, status: ${result?.status?.id} (${result?.status?.description})`);
    }

    if (!result || !result.status) {
      throw new Error('Execution timeout or invalid response');
    }

    // Log all the received data for debugging
    console.log('Final result data:', {
      status: result.status,
      stdout: result.stdout,
      stderr: result.stderr,
      compile_output: result.compile_output,
      time: result.time,
      memory: result.memory
    });

    // Construct and return the result
    return {
      output: result.stdout || '',
      error: result.stderr || result.compile_output || '',
      status: mapStatus(result.status.id),
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

// Helper function to map status codes
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

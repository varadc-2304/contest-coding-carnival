
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

    // Create the request body
    const requestBody = {
      source_code: btoa(code),  // Base64 encode the code
      language_id: languageId,
      stdin: btoa(input)        // Base64 encode the input
    };

    console.log('Submitting code to Judge0 API:', JSON.stringify({
      ...requestBody,
      source_code: `[BASE64 ENCODED: ${code.length} chars]`
    }, null, 2));

    // First request: Submit the code
    const submissionResponse = await fetch('http://82.25.104.175:2358/submissions?base64_encoded=true&wait=false', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
    });

    console.log('Submission response status:', submissionResponse.status);
    
    // Check for HTTP errors
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
    let result: any;
    let attempt = 0;
    const maxAttempts = 20;
    const pollingInterval = 1000; // 1 second

    while (attempt < maxAttempts) {
      attempt++;
      console.log(`Polling for results, attempt ${attempt}/${maxAttempts}...`);
      
      await new Promise(resolve => setTimeout(resolve, pollingInterval));

      // Second request: Get the execution result
      const resultResponse = await fetch(`http://82.25.104.175:2358/submissions/${token}?base64_encoded=true`, {
        method: 'GET',
        headers: { 
          'Accept': 'application/json' 
        },
      });

      console.log('Result response status:', resultResponse.status);
      
      if (!resultResponse.ok) {
        const errorText = await resultResponse.text();
        console.error(`Error fetching execution result: ${resultResponse.status} ${errorText}`);
        
        // Don't throw immediately, try again unless we've hit the max attempts
        if (attempt >= maxAttempts) {
          throw new Error(`Error fetching execution result: ${resultResponse.status} ${errorText}`);
        }
        continue;
      }

      // Parse the result response
      try {
        result = await resultResponse.json();
        console.log('Result response data:', JSON.stringify({
          ...result,
          stdout: result.stdout ? '[BASE64 ENCODED]' : null,
          stderr: result.stderr ? '[BASE64 ENCODED]' : null
        }, null, 2));
      } catch (error) {
        console.error('Failed to parse result response:', error);
        
        // Don't throw immediately, try again unless we've hit the max attempts
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

    // Decode the base64 encoded outputs
    let stdout = '';
    let stderr = '';
    let compileOutput = '';

    try {
      if (result.stdout) {
        stdout = atob(result.stdout);
      }
      if (result.stderr) {
        stderr = atob(result.stderr);
      }
      if (result.compile_output) {
        compileOutput = atob(result.compile_output);
      }
    } catch (error) {
      console.error('Error decoding base64 output:', error);
    }

    console.log('Decoded stdout:', stdout);
    console.log('Decoded stderr:', stderr);
    console.log('Decoded compile_output:', compileOutput);

    // Construct and return the result
    return {
      output: stdout || '',
      error: stderr || compileOutput || '',
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
  switch (statusId) {
    case 3: return 'Accepted';
    case 4: return 'Wrong Answer';
    case 5: return 'Time Limit Exceeded';
    case 6: return 'Compilation Error';
    case 7: return 'Runtime Error';
    case 8: return 'Memory Limit Exceeded';
    case 9: return 'Runtime Error';
    case 10: return 'Internal Error';
    case 11: return 'Exec Format Error';
    default: return `Unknown (${statusId})`;
  }
};

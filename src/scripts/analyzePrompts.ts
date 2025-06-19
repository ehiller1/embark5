import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase client
const supabaseUrl = 'https://jeezilcobzdayekigzvf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplZXppbGNvYnpkYXlla2lnenZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3OTY2ODMsImV4cCI6MjA1OTM3MjY4M30.mjyNOhoEumZQL9Wwd146xmXM1xXTV-dqrq1iYz6f2-w';

const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);

interface Prompt {
  id: string;
  prompt_type: string;
  prompt: string;
  description?: string;
}

interface ParameterAnalysis {
  prompt_type: string;
  parameters: string[];
  parameter_patterns: string[];
}

async function analyzePrompts() {
  try {
    // Fetch all prompts from the database
    const { data: prompts, error } = await supabase
      .from('prompts')
      .select('*');

    if (error) {
      console.error('Error fetching prompts:', error);
      return;
    }

    if (!prompts || prompts.length === 0) {
      console.log('No prompts found in the database');
      return;
    }

    // Analyze each prompt
    const analysis: ParameterAnalysis[] = prompts.map((prompt: Prompt) => {
      // Extract parameters using the $(parameter) pattern
      const parameterPattern = /\$\(([^)]+)\)/g;
      const matches = Array.from(prompt.prompt.matchAll(parameterPattern));
      
      const parameters = matches.map(match => (match as RegExpMatchArray)[1].trim());
      
      // Get unique parameters
      const uniqueParameters = [...new Set(parameters)];

      return {
        prompt_type: prompt.prompt_type,
        parameters: uniqueParameters,
        parameter_patterns: parameters
      };
    });

    // Generate TypeScript code for the parameter mapping
    const mappingCode = generateParameterMapping(analysis);

    // Write results to files
    const outputDir = path.join(__dirname, '../output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    fs.writeFileSync(
      path.join(outputDir, 'prompt_analysis.json'),
      JSON.stringify(analysis, null, 2)
    );

    fs.writeFileSync(
      path.join(outputDir, 'parameter_mapping.ts'),
      mappingCode
    );

    console.log('Analysis complete. Results written to:');
    console.log(`- ${path.join(outputDir, 'prompt_analysis.json')}`);
    console.log(`- ${path.join(outputDir, 'parameter_mapping.ts')}`);

  } catch (err) {
    console.error('Error analyzing prompts:', err);
  }
}

function generateParameterMapping(analysis: ParameterAnalysis[]): string {
  let code = 'export const PROMPT_PARAMETERS: Record<PromptType, PromptParameters> = {\n';

  analysis.forEach(item => {
    code += `  ${item.prompt_type}: {\n`;
    
    // Add each parameter with default required and description
    item.parameters.forEach(param => {
      const paramName = param.replace(/\s+/g, '_').toLowerCase();
      code += `    ${paramName}: { required: true, description: '${param}' },\n`;
    });

    code += '  },\n';
  });

  code += '};\n';
  return code;
}

// Run the analysis
analyzePrompts().catch(console.error); 
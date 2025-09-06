import { tool } from 'ai'

import { getQuestionSchemaForModel } from '@/lib/schema/question'

/**
 * Creates a question tool with the appropriate schema for the specified model.
 */
export function createQuestionTool(fullModel: string) {
  return tool({
    description:
      'Ask a clarifying question with multiple options when more information is needed',
    parameters: getQuestionSchemaForModel(fullModel),
    execute: async params => {
      return {
        question: params.question,
        options: params.options || [],
        allowsInput: params.allowsInput || false,
        inputLabel: params.inputLabel,
        inputPlaceholder: params.inputPlaceholder
      }
    }
  })
}

// Default export for backward compatibility, using a default model
export const askQuestionTool = createQuestionTool('openai:gpt-4o-mini')

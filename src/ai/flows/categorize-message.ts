'use server';

/**
 * @fileOverview AI-powered message categorization for the Indian Community Chat App.
 *
 * This file exports:
 * - `categorizeMessage`: An async function to categorize user messages.
 * - `CategorizeMessageInput`: The input type for `categorizeMessage`.
 * - `CategorizeMessageOutput`: The output type for `categorizeMessage`.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CategorizeMessageInputSchema = z.object({
  text: z.string().describe('The text of the message to categorize.'),
});
export type CategorizeMessageInput = z.infer<typeof CategorizeMessageInputSchema>;

const CategorySchema = z.enum([
  'job search',
  'event needs',
  'buy/sell requests',
  'general chat',
  'spam',
  'other',
]);

const CategorizeMessageOutputSchema = z.object({
  category: CategorySchema.describe('The category of the message.'),
  reason: z.string().optional().describe('The reason for the categorization.'),
});
export type CategorizeMessageOutput = z.infer<typeof CategorizeMessageOutputSchema>;

export async function categorizeMessage(input: CategorizeMessageInput): Promise<CategorizeMessageOutput> {
  return categorizeMessageFlow(input);
}

const categorizeMessagePrompt = ai.definePrompt({
  name: 'categorizeMessagePrompt',
  input: {schema: CategorizeMessageInputSchema},
  output: {schema: CategorizeMessageOutputSchema},
  prompt: `You are an AI assistant that categorizes messages in an Indian community chat app. 

  Given the following message, determine the appropriate category. If the message is not related to job search, event needs, or buy/sell requests, categorize it as \"general chat\".  If the message is spam, categorize it as \"spam\".

Message: {{{text}}}

Category:`,
});

const categorizeMessageFlow = ai.defineFlow(
  {
    name: 'categorizeMessageFlow',
    inputSchema: CategorizeMessageInputSchema,
    outputSchema: CategorizeMessageOutputSchema,
  },
  async input => {
    const {output} = await categorizeMessagePrompt(input);
    return output!;
  }
);

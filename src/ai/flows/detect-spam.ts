'use server';

/**
 * @fileOverview Detects spam messages based on configurable keywords.
 *
 * - detectSpam - A function that detects spam messages in the chat.
 * - DetectSpamInput - The input type for the detectSpam function.
 * - DetectSpamOutput - The return type for the detectSpam function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetectSpamInputSchema = z.object({
  message: z.string().describe('The message to check for spam.'),
  keywords: z.array(z.string()).describe('Configurable keywords to detect spam.'),
});

export type DetectSpamInput = z.infer<typeof DetectSpamInputSchema>;

const DetectSpamOutputSchema = z.object({
  isSpam: z.boolean().describe('Whether the message is spam or not.'),
  reason: z.string().optional().describe('The reason why the message is considered spam.'),
});

export type DetectSpamOutput = z.infer<typeof DetectSpamOutputSchema>;

export async function detectSpam(input: DetectSpamInput): Promise<DetectSpamOutput> {
  return detectSpamFlow(input);
}

const detectSpamPrompt = ai.definePrompt({
  name: 'detectSpamPrompt',
  input: {schema: DetectSpamInputSchema},
  output: {schema: DetectSpamOutputSchema},
  prompt: `You are a spam detection AI.

  You will receive a message and a list of keywords. Your task is to determine if the message is spam based on the keywords.
  If the message contains any of the keywords, it is considered spam. Return true for isSpam if the message is spam, otherwise return false.
  If the message is spam, provide a reason why it is considered spam. Otherwise, leave the reason field empty.

  Message: {{{message}}}
  Keywords: {{#each keywords}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
  \n  Ensure that the output is a valid JSON object that conforms to the following schema:
  ${JSON.stringify(DetectSpamOutputSchema.shape, null, 2)}`,
});

const detectSpamFlow = ai.defineFlow(
  {
    name: 'detectSpamFlow',
    inputSchema: DetectSpamInputSchema,
    outputSchema: DetectSpamOutputSchema,
  },
  async input => {
    const {output} = await detectSpamPrompt(input);
    return output!;
  }
);


'use server';

/**
 * @fileOverview Provides a daily summary of detected spam and AI classifications for admin monitoring.
 *
 * - summarizeDailyActivity - A function that generates the daily summary.
 * - SummarizeDailyActivityInput - The input type for the summarizeDailyActivity function (currently empty).
 * - SummarizeDailyActivityOutput - The return type for the summarizeDailyActivity function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeDailyActivityInputSchema = z.object({});
export type SummarizeDailyActivityInput = z.infer<typeof SummarizeDailyActivityInputSchema>;

const SummarizeDailyActivityOutputSchema = z.object({
  summary: z.string().describe('A summary of the daily spam detection and AI classifications.'),
});
export type SummarizeDailyActivityOutput = z.infer<typeof SummarizeDailyActivityOutputSchema>;

export async function summarizeDailyActivity(input: SummarizeDailyActivityInput): Promise<SummarizeDailyActivityOutput> {
  return summarizeDailyActivityFlow(input);
}

const summarizeDailyActivityPrompt = ai.definePrompt({
  name: 'summarizeDailyActivityPrompt',
  input: {schema: SummarizeDailyActivityInputSchema},
  output: {schema: SummarizeDailyActivityOutputSchema},
  prompt: `You are an assistant that summarizes daily spam detection and AI classifications.

  Provide a concise summary of the number of spam messages detected, and a summary of the different types of classifications that were detected for requirements (jobs, events, buy/sell requests).
  `,
});

const summarizeDailyActivityFlow = ai.defineFlow(
  {
    name: 'summarizeDailyActivityFlow',
    inputSchema: SummarizeDailyActivityInputSchema,
    outputSchema: SummarizeDailyActivityOutputSchema,
  },
  async input => {
    const {output} = await summarizeDailyActivityPrompt(input);
    return output!;
  }
);

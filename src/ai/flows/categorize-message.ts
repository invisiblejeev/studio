
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
  'Jobs',
  'Housing',
  'Marketplace',
  'Events',
  'Plumber',
  'Babysitter',
  'Pet Care',
  'Doctor',
  'Lawyer',
  'General Chat',
  'Other',
]);
export type Category = z.infer<typeof CategorySchema>;


const CategorizeMessageOutputSchema = z.object({
  category: CategorySchema.describe('The category of the message.'),
  title: z.string().describe('A concise, descriptive title for the requirement.'),
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
  prompt: `You are an AI assistant that categorizes messages in an Indian community chat app and generates a title for the post. 

  Given the following message, determine the appropriate category from: "Jobs", "Housing", "Marketplace", "Events", "Plumber", "Babysitter", "Pet Care", "Doctor", "Lawyer", "General Chat", or "Other".
  - "Jobs": For job postings or people looking for work.
  - "Housing": For roommate requests, apartments for rent, or sublets.
  - "Marketplace": For buying or selling items like cars, furniture, etc.
  - "Events": For community events, festivals, or gatherings like Diwali.
  - "Plumber": For requests for plumbing services.
  - "Babysitter": For requests for childcare or babysitting services.
  - "Pet Care": For requests for pet sitting, dog walking, or veterinary care.
  - "Doctor": For requests for medical advice or doctor recommendations.
  - "Lawyer": For requests for legal advice or lawyer recommendations.
  - "General Chat": If it does not fit any other category.

  Also, create a short, descriptive title for the message content (e.g., "Software Engineer Position", "Roommate Needed", "Leaky Faucet Help", "Diwali Celebration").

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

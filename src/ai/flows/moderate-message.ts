
'use server';

/**
 * @fileOverview An AI flow for content moderation.
 *
 * This file exports:
 * - `moderateMessage`: An async function to check if a message is inappropriate.
 * - `ModerateMessageInput`: The input type for `moderateMessage`.
 * - `ModerateMessageOutput`: The output type for `moderateMessage`.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ModerateMessageInputSchema = z.object({
  message: z.string().describe('The message to be moderated.'),
  examples: z.array(z.string()).describe('A list of examples of inappropriate content.'),
});
export type ModerateMessageInput = z.infer<typeof ModerateMessageInputSchema>;

const ModerateMessageOutputSchema = z.object({
  is_inappropriate: z.boolean().describe('Whether the message is considered inappropriate.'),
  reason: z.string().optional().describe('A brief reason why the message is inappropriate, if applicable.'),
});
export type ModerateMessageOutput = z.infer<typeof ModerateMessageOutputSchema>;

export async function moderateMessage(input: ModerateMessageInput): Promise<ModerateMessageOutput> {
  return moderateMessageFlow(input);
}

const moderateMessagePrompt = ai.definePrompt({
  name: 'moderateMessagePrompt',
  input: {schema: ModerateMessageInputSchema},
  output: {schema: ModerateMessageOutputSchema},
  prompt: `You are a content moderator for a community chat app. Your task is to determine if a given message is inappropriate based on a list of examples of previously flagged content.

Inappropriate content may include spam, harassment, hate speech, or explicit material.

Here are some examples of inappropriate content that have been flagged by administrators:
{{#each examples}}
- "{{{this}}}"
{{/each}}

Now, please analyze the following message:
Message: "{{{message}}}"

Based on the examples provided, is this message inappropriate? If it is, please provide a short reason.
`,
});

const moderateMessageFlow = ai.defineFlow(
  {
    name: 'moderateMessageFlow',
    inputSchema: ModerateMessageInputSchema,
    outputSchema: ModerateMessageOutputSchema,
  },
  async input => {
    // If there are no examples, the message is not inappropriate by this logic.
    if (input.examples.length === 0) {
      return { is_inappropriate: false };
    }
    const {output} = await moderateMessagePrompt(input);
    return output!;
  }
);

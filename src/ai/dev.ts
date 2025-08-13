
import { config } from 'dotenv';
config();

import '@/ai/flows/detect-spam.ts';
import '@/ai/flows/categorize-message.ts';
import '@/ai/flows/summarize-daily-activity.ts';
import '@/ai/flows/moderate-message.ts';


import { config } from 'dotenv';
config();

import '@/ai/flows/categorize-message.ts';

// We are now deploying the trigger, so we don't need to import it for local dev.
// The deployed function will listen for Firestore events directly.
// import '@/ai/triggers.ts';

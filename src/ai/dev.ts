
import { config } from 'dotenv';
config();

import '@/ai/flows/categorize-message.ts';

// We are now deploying the trigger, so we don't need to import it for local dev.
// The deployed function will listen for Firestore events directly.
// We import it here for local testing if needed, but it should be commented out for deployment.
// import '@/ai/triggers.ts';

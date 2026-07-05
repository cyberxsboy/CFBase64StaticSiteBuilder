import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cron from 'node-cron';
import { generateSite } from './generate.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Schedule to run every day at 00:00 (midnight)
cron.schedule('0 0 * * *', async () => {
    console.log('Running daily site generation...');
    try {
        await generateSite();
    } catch (error) {
        console.error('Error during scheduled generation:', error);
    }
});

// Run generation once on server startup
generateSite().then(() => {
    app.use(express.static(path.join(__dirname, 'dist')));

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server is running on port ${PORT}`);
        console.log('Daily cron job scheduled.');
    });
}).catch(console.error);

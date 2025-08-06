import puppeteer from "puppeteer";
import dotenv from "dotenv";
import fs from 'fs';
//Create controller file to handle browser login and scraping
// Load environment variables
dotenv.config();

async function getHighlights(){
    let browser;
    try {
        // Launch the browser and open a new blank page
        browser = await puppeteer.launch({
            userDataDir: './user-data',
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });
        const page = await browser.newPage();
      
        // Navigate the page to a URL
        const url = process.env.LINK_REDIRECTION || 'https://www.amazon.com/ap/signin?openid.pape.max_auth_age=3600&openid.return_to=https%3A%2F%2Fread.amazon.com%2Fnotebook%3Fref_%3Dk4w_ka_notebook&openid.identity=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.assoc_handle=amzn_kp_us&openid.mode=checkid_setup&language=en_US&openid.claimed_id=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.ns=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0';
        console.log('Navigating to:', url);
        await page.goto(url, { waitUntil: 'networkidle2' });
        
        // Log the current URL to see where we ended up
        const currentUrl = page.url();
        console.log('Current URL:', currentUrl);
        
        // Since we're using saved user data, we should be already logged in
        // Wait for the page to load and check if we're on the notebook page
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        console.log('Page title:', await page.title());
        
        // Check if we're on the notebook page by looking for book covers
        try {
            await page.waitForSelector('.kp-notebook-searchable.a-text-bold', { timeout: 10000 });
            console.log('Found notebook page with book titles');
        } catch (err) {
            console.log('Not on notebook page yet, current page:', await page.title());
            // If we're not on the notebook page, try navigating directly to it
            await page.goto('https://read.amazon.com/notebook', { waitUntil: 'networkidle2' });
            await page.waitForSelector('.kp-notebook-searchable.a-text-bold', { timeout: 10000 });
            console.log('Successfully navigated to notebook page');
        }

        let allHighlights = [];
        
        // Get all book titles from the library page
        const bookLinks = await page.$$('.kp-notebook-searchable.a-text-bold');
        console.log(`Found ${bookLinks.length} books`);
        
        // Extract book titles first
        const bookTitles = await page.$$eval('.kp-notebook-searchable.a-text-bold', elements => 
            elements.map(el => el.textContent.trim())
        );
        
        console.log('Book titles found:', bookTitles);
        
        // Process each book
        for (let i = 0; i < bookLinks.length; i++) {
            try {
                console.log(`Processing book ${i + 1}/${bookLinks.length}: ${bookTitles[i]}`);
                
                // Click on the book to open its details
                await bookLinks[i].click();
                await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for page to load
                
                // Wait for highlights to load
                const highlightLoaded = await page.waitForSelector('.kp-notebook-highlight', { timeout: 5000 }).catch(() => null);
                
                // Extract highlights for this book only if highlights loaded
                let highlights = [];
                if (highlightLoaded) {
                    highlights = await page.$$eval('.kp-notebook-highlight', elements => 
                        elements.map(el => el.textContent.trim())
                    );
                    console.log(`Found ${highlights.length} highlights for "${bookTitles[i]}"`);
                } else {
                    console.log(`No highlights found for "${bookTitles[i]}"`);
                }
                
                allHighlights.push({
                    bookTitle: bookTitles[i],
                    bookIndex: i,
                    highlights: highlights
                });
                
                // Go back to library page for next book
                if (i < bookLinks.length - 1) {
                    await page.goto('https://read.amazon.com/notebook', { waitUntil: 'networkidle2' });
                    await page.waitForSelector('.kp-notebook-searchable.a-text-bold', { timeout: 10000 });
                    // Re-get the book links since the page reloaded
                    bookLinks.splice(0, bookLinks.length, ...(await page.$$('.kp-notebook-searchable.a-text-bold')));
                }
                
            } catch (err) {
                console.error(`Error processing book "${bookTitles[i]}":`, err);
                continue;
            }
        }
        
        // Output results
        console.log('\n=== EXTRACTION COMPLETE ===');
        console.log(`Processed ${allHighlights.length} books:`);
        allHighlights.forEach((book, index) => {
            console.log(`${index + 1}. "${book.bookTitle}" - ${book.highlights.length} highlights`);
        });
        console.log(allHighlights);
        return allHighlights;

    } catch (error) {
        console.error('Error:', error);
        return [];
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

getHighlights();


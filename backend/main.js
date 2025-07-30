import puppeteer from "puppeteer";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

(async () => {
    // Launch the browser and open a new blank page
    const browser = await puppeteer.launch({
        headless: false
    });
    const page = await browser.newPage();
  
    // Navigate the page to a URL
    const url = process.env.LINK_REDIRECTION || 'https://www.amazon.com/ap/signin?openid.pape.max_auth_age=3600&openid.return_to=https%3A%2F%2Fread.amazon.com%2Fnotebook%3Fref_%3Dk4w_ka_notebook&openid.identity=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.assoc_handle=amzn_kp_us&openid.mode=checkid_setup&language=en_US&openid.claimed_id=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.ns=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0';
    await page.goto(url);
    
    //Handle Authentication

    //Fill out email
    await page.waitForSelector('#ap_email');
    await page.type('#ap_email', process.env.EMAIL);
    await page.click('#continue');

    //fill out password
    await page.waitForSelector('#ap_password');
    await page.type('#ap_password', process.env.PASSWORD);
    await page.click('#signInSubmit');


    await page.waitForSelector('.a-row');
    const bookLinks = await page.$$('.a-row');
    let allHighlights = [];
    for (let i = 0; i < bookLinks.length; i++) {
        // Click on the book to open its notebook
        await bookLinks[i].click();
        // Wait for highlights to load
        await page.waitForSelector('#highlight', { timeout: 5000 }).catch(() => {});

        // Extract highlights for this book
        const highlights = await page.$$eval('#highlight', elements => elements.map(el => el.textContent.trim()));
        allHighlights.push({
            bookIndex: i,
            highlights
        });

        // Optionally, go back to the library page if needed
        // This may require navigation or clicking a "back" button, depending on the site structure
        // Example (uncomment and adjust selector if needed):
        // await page.click('.back-to-library-selector');
        // await page.waitForSelector('.a-row.kp-notebook-library-each-book.a-color-base-background');
    }

    console.log('All Highlights:', allHighlights);

    //once done jump to a-row kp-notebook-library-each-book a-color-base-background (find all elements with that class, jump array and add 1 to index, map over elements and look for highlights


})();
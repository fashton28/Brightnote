import puppeteer from "puppeteer";
import dotenv from 'dotenv'

dotenv.config();

async function login(page,email,password){
    
    const emailInput = await page.waitForSelector('#ap_email', { timeout: 10000 });
    await emailInput.type(email);
    const continueButton = await page.waitForSelector('#continue', { timeout: 10000 });
    await continueButton.click();

    const passwordInput = await page.waitForSelector('#ap_password', { timeout: 10000 });
    await passwordInput.type(password);
    const signInButton = await page.waitForSelector('#signInSubmit', { timeout: 10000 });
    await signInButton.click()

}

export const getHighlights = async (req,res) => {
    let browser;

    // Accept credentials from request body (POST)
    const { email, password } = req.body 

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            error: 'Missing credentials. Provide email and password in JSON body.'
        });
    }

    try {
        browser = await puppeteer.launch({
            headless: true,
            // Avoid reusing a shared profile to prevent profile locks/crashes
            // userDataDir intentionally omitted
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
            protocolTimeout: 120000
        });

        const page = await browser.newPage();
        page.setDefaultTimeout(30000);
        page.setDefaultNavigationTimeout(60000);
        const url = process.env.LINK_REDIRECTION || 'https://www.amazon.com/ap/signin?openid.pape.max_auth_age=3600&openid.return_to=https%3A%2F%2Fread.amazon.com%2Fnotebook%3Fref_%3Dk4w_ka_notebook&openid.identity=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.assoc_handle=amzn_kp_us&openid.mode=checkid_setup&language=en_US&openid.claimed_id=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.ns=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0';
        console.log('Navigating to:', url);
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        const currentUrl = page.url();

        console.log('Current URL:', currentUrl);
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        console.log('Page title:', await page.title());
        
        const notebookSelector = '.kp-notebook-searchable.a-text-bold';

        let notebookFound = false;

        try {
            await page.waitForSelector(notebookSelector, { timeout: 10000 });
            console.log('Found notebook page with book titles');
            notebookFound = true;
        } catch (err) {
            console.log('Notebook class not found, attempting login. Current page:', await page.title());
            await login(page, email, password);
            try {
                await page.waitForSelector(notebookSelector, { timeout: 10000 });
                console.log('Successfully navigated to notebook page after login');
                notebookFound = true;
            } catch (err2) {
                console.log('Still could not find notebook page after login.');
            }
        }



        let allHighlights = [];
        
       
        const bookLinks = await page.$$('.kp-notebook-searchable.a-text-bold');
        console.log(`Found ${bookLinks.length} books`);
        const bookTitles = await page.$$eval('.kp-notebook-searchable.a-text-bold', elements => 
            elements.map(el => el.textContent.trim())
        );
        
        console.log('Book titles found:', bookTitles);
        console.log('Book links found:', bookLinks);
        
        for (let i = 0; i < bookLinks.length; i++) {
            try {
                console.log(`Processing book ${i + 1}/${bookLinks.length}: ${bookTitles[i]}`);
                
                await bookLinks[i].click();
                await new Promise(resolve => setTimeout(resolve, 2000)); 
                const highlightLoaded = await page.waitForSelector('.kp-notebook-highlight', { timeout: 5000 }).catch(() => null);
                
                
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
                
                
                if (i < bookLinks.length - 1) {
                    await page.goto('https://read.amazon.com/notebook', { waitUntil: 'networkidle2' });
                    await page.waitForSelector('.kp-notebook-searchable.a-text-bold', { timeout: 10000 });
                    bookLinks.splice(0, bookLinks.length, ...(await page.$$('.kp-notebook-searchable.a-text-bold')));
                }
                
            } catch (err) {
                console.error(`Error processing book "${bookTitles[i]}":`, err);
                continue;
            }
        }
        

        console.log('\n=== EXTRACTION COMPLETE ===');
        console.log(`Processed ${allHighlights.length} books:`);
        allHighlights.forEach((book, index) => {
            console.log(`${index + 1}. "${book.bookTitle}" - ${book.highlights.length} highlights`);
        });

        return res.status(200).json(allHighlights);


    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ success: false, error: 'Failed to extract highlights', message: error.message });
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}




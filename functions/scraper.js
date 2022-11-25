// const puppeteer = require("puppeteer");
const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const RecaptchaPlugin = require('puppeteer-extra-plugin-recaptcha')
const { htmlToText } = require('html-to-text');

puppeteer.use(StealthPlugin())
puppeteer.use(
    RecaptchaPlugin({
      provider: {
        id: '2captcha',
        token: '4362444778dd52bf11192031b9bfa5f8', // REPLACE THIS WITH YOUR OWN 2CAPTCHA API KEY ⚡
      },
      visualFeedback: true, // colorize reCAPTCHAs (violet = detected, green = solved)
    })
)


// var userAgent = require('user-agents');
const randomUseragent = require('random-useragent');

const path = require('path');
const TEMP_USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.75 Safari/537.36';



async function scrape(website,location,industry,domain,extra,pageNumber) 
{
    const userAgent = randomUseragent.getRandom();
    console.log("Random User Agent For Request: ",userAgent)
    let query = "";
    let first =  true;

    if(website)
    {
        query = website
        first = false;
    }

    if(location)
    {
        if(first)
        {
            first = false;
        }

        else query = query + " "
        query = query + '"' + location + '"'  
    }

    if(industry)
    {
        if(first)
        {
            first = false;
        }
        else query =  query + " "
        query = query + '"' + industry + '"'
    }

    if(domain)
    {
        if(first)
        {
            first = false;
        }
        else query =  query + " "
        query = query + '"@' + domain + '"'
    }

    if(extra)
    {
        if(first)
        {
            first = false;
        }
        else query =  query + " "
        query = query + '"' + extra + '"'
    }

    if(query==="")
    {
      return {code:400,error:'Malfunctioned Request'}
    }
  
    // let url = "https://www.google.com/search?q=" +query+`&start=${pageNumber}`;
    let url = "http://www.google.com/recaptcha/api2/demo"
    console.log(`url : ${url}`)

    // let args = ["--no-sandbox",'--disable-setuid-sandbox']

    const browser = await puppeteer.launch({ headless:false });
    console.log("--------- BROWSER LAUNCHED AND GOING TO NEW PAGE --------------");


    const page = await browser.newPage();
    console.log("------------ NEW PAGE OPENED AND GOING TO URL -----------------");

    await page.setViewport({
        width: 1920 + Math.floor(Math.random() * 100),
        height: 3000 + Math.floor(Math.random() * 100),
        deviceScaleFactor: 1,
        hasTouch: false,
        isLandscape: false,
        isMobile: false,
    });
    console.log("------------ RANDOM VIEWPORT SET -----------------");

    // const UA = userAgent || TEMP_USER_AGENT;
    const UA = TEMP_USER_AGENT;
    await page.setUserAgent(UA)
    console.log("------------ RANDOM USERAGENT SET -----------------");

    await page.setJavaScriptEnabled(true);
    await page.setDefaultNavigationTimeout(0);

    //  -------- CHECK PASS START -----------

    await page.evaluateOnNewDocument(() => {
        // Pass webdriver check
        Object.defineProperty(navigator, 'webdriver', {
            get: () => false,
        });
    });

    await page.evaluateOnNewDocument(() => {
        // Pass chrome check
        window.chrome = {
            runtime: {},
            // etc.
        };
    });

    await page.evaluateOnNewDocument(() => {
        //Pass notifications check
        const originalQuery = window.navigator.permissions.query;
        return window.navigator.permissions.query = (parameters) => (
            parameters.name === 'notifications' ?
                Promise.resolve({ state: Notification.permission }) :
                originalQuery(parameters)
        );
    });

    await page.evaluateOnNewDocument(() => {
        // Overwrite the `plugins` property to use a custom getter.
        Object.defineProperty(navigator, 'plugins', {
            // This just needs to have `length > 0` for the current test,
            // but we could mock the plugins too if necessary.
            get: () => [1, 2, 3, 4, 5],
        });
    });

    await page.evaluateOnNewDocument(() => {
        // Overwrite the `languages` property to use a custom getter.
        Object.defineProperty(navigator, 'languages', {
            get: () => ['en-US', 'en'],
        });
    });

    //  -------- CHECK PASS END -----------



    await page.goto(url, { waitUntil: "networkidle0" });
    await page.screenshot({ path: path.join(process.cwd() , '/public/LastPageSnap.png') });

    console.log("------------ URL OPENED, SEE EXAMPLE.PNG SNAP -----------------");

    let result=[],html,at,dotcom,str,strig,emailPattern,text;
    try
    {
        let checking = await page.evaluate(() => {

            //here i want to test if #idProductType exists do : 
            // let el = document.querySelector("#rc-anchor-container")
            let el = document.querySelector("#recaptcha")   
            return el ? {el:el,captcha:true} : {el:null,captcha:false,document:document.body.innerHTML}
        })

        await sleep(5000);


        if(checking.captcha)
        {
            console.log('before sleep')
            await sleep(1500);
            console.log('after sleep')

            console.log('captcha appeared')
            await page.screenshot({ path: path.join(process.cwd() , '/public/LastCaptchaSnap.png') });

            await page.solveRecaptchas()

            await Promise.all([
                page.waitForNavigation(),
                page.click(`#recaptcha-demo-submit`),
            ])

        }

        else
        {
            console.log('no captchas')
        }

        await page.screenshot({ path: path.join(process.cwd() , '/public/LastPageSnapAfter.png') });
        html = await page.content();
        text = htmlToText(html, {
            wordwrap: 130
        });
        // html = checking.document;

        emailPattern = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;

        // emailPattern = /[a-zA-Z0-9._-]+@[a-z]+\\.+[a-z]+/gi;

        //smaple_string = "Gmail Para Empresas · sheemrajput@gmail.com · Gmail Online Support · deep. bhandari12@gmail.com · Google · LinkedIn · dhruv sharma89@gmail com · Facebook."
        at = text.replace('@ ', '@');
        dotcom = at.replace('. com', '.com');
        str = dotcom.replace(/^\s+|\s+$|,|;|:|-|\|/g,''); 
        str = str.replace(/[/]/g,' ')

        

        strig = str.toLowerCase();
        result = strig.match(emailPattern);
    }
    catch(e)
    {
        error=true;
        errorMessage=e;
        console.log('error => ',e)
        await browser.close();
        return {code:400,error:e};
    }

    console.log('\n --------------     DocumentObject Start  ------------- \n ',result)
    console.log(' --------------     DocumentObject End    ------------- \n ')

    // await browser.close();
    return { code:200,result,document:text} 
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  

module.exports = { scrape }

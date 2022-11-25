const puppeteer = require('puppeteer-extra')
const request = require('request-promise-native');
const poll = require('promise-poller').default;


const config = {
    pageurl:'http://www.google.com/recaptcha/api2/demo',
    apiKey:'4362444778dd52bf11192031b9bfa5f8',
    apiSubmitUrl:'http://2captcha.com/in.php',
    apiRetrieveUrl:'http://2captcha.com/res.php'
}

async function initiateCaptchaRequest(apiKey,siteKey)
{
    const formData = {
        method:'userrecaptcha',
        googlekey: siteKey,
        key:apiKey,
        pageurl: config.pageurl,
        json:1
    };
    console.log(`Submitting solution request...`)
    const response = await request.post(config.apiSubmitUrl, {form: formData});
    return JSON.parse(response).request;
}

async function pollForRequestResults(key, id, retries = 30, interval = 1500, delay = 15000) {
    console.log(`Waiting for ${delay/1000} second...` )
    await sleep(delay);
    return poll({
      taskFn: requestCaptchaResults(key, id),
      interval,
      retries
    });
}

function requestCaptchaResults(apiKey, requestId) {
    const url = `http://2captcha.com/res.php?key=${apiKey}&action=get&id=${requestId}&json=1`;
    return async function() {
        try
        {
            return new Promise(async function(resolve, reject){
                const rawResponse = await request.get(url);
                const resp = JSON.parse(rawResponse);
                console.log(resp)
                if (resp.status === 0) return reject(resp.request);
                console.log("Response received.")
            
                resolve(resp.request);
            });
        }
        catch(e)
        {
            console.log('Error at retreiving captcha response => ',e)
        }
    }
}

async function scrape()
{
    // puppeteer usage as normal
    // const args = [ '--disable-web-security', '--disable-features=IsolateOrigins,site-per-process' ]
    const args = [  ]


    const browser = await puppeteer.launch({ headless: false,args,slowMo:10,defaultViewport:null })
    console.log("--------- BROWSER LAUNCHED AND GOING TO NEW PAGE --------------");

    const page = await browser.newPage();
    console.log("------------ NEW PAGE OPENED AND GOING TO URL -----------------");

    await page.goto(config.pageurl)

    console.log("------------ EVALUATING PAGE FOR DATA SITEKEY -----------------");
    let {siteKey,iframes,isIframe} = await page.evaluate(
        () => {
            let iframes=[]; 
            let isIframe=false;
            if(document.querySelectorAll('iframe[src]'))
            {
                isIframe = true;
                iframes.push(document.querySelectorAll('iframe[src]')[0].src)
            }
            let siteKey = document.querySelectorAll('div[data-sitekey]')[0].getAttribute('data-sitekey')
            return {siteKey,iframes,isIframe} 
        }
    );
    console.log(`------------ DATA SITEKEY: ${siteKey}  -----------------`);
    console.log('anonymous iframe found',isIframe)

    let isGoogleCaptcha = false;
    for(let i=0;i<iframes.length;i++)
    {
        if(iframes[i].includes('recaptcha'))
        {
            console.log('captcha iframe found with src => ',iframes[i])
            isGoogleCaptcha = true;
            break;
        }
    }

    if(isGoogleCaptcha)
    {

        const requestId = await initiateCaptchaRequest(config.apiKey,siteKey)
        console.log(`------------ REQUEST ID : ${requestId}  -----------------`);


        const response = await pollForRequestResults(config.apiKey,requestId)

        console.log(`Entering recaptcha response ${response}`)
        await page.evaluate(`document.getElementById("g-recaptcha-response").innerHTML="${response}";`);

        console.log("Submitting...")
    

        await Promise.all([
            page.waitForNavigation(),
            page.click(`#recaptcha-demo-submit`),
        ])
    }

    else
    {
        console.log('No Captcha Proceedings...');
    }


    return {code:200,result:[]}
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { scrape }

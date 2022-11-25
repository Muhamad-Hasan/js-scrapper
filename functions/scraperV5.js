// Puppeteer without Sock5 Different ports ( for proxy ) -- app used 
// tryCount multiple tabs (3 limit) --- with tryCoung multiple browsers --- no limit of failures

const puppeteer = require('puppeteer')
const request = require('request-promise-native');
const poll = require('promise-poller').default;
const { htmlToText } = require('html-to-text');
const path = require('path');

const TEMP_USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.75 Safari/537.36';


const config = {
    defaultpageurl:'http://www.google.com/recaptcha/api2/demo',
    apiKey:'4362444778dd52bf11192031b9bfa5f8',
    apiSubmitUrl:'http://2captcha.com/in.php',
    apiRetrieveUrl:'http://2captcha.com/res.php'
}

async function initiateCaptchaRequest(apiKey,siteKey,dataS,cookies,url)
{
    const formData = {
        method:'userrecaptcha',
        googlekey: siteKey,
        key:apiKey,
        pageurl: url,
        cookies:cookies,
        "data-s":dataS,
        // test:"v",
        json:1,
        // proxy:'175.107.212.90'
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
                
                if (resp.request === "ERROR_CAPTCHA_UNSOLVABLE") return resolve(null);
                else if (resp.request === "ERROR_WRONG_CAPTCHA_ID") return resolve(null);

                
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
function resolveQueries(website,location,industry,domain,extra,extraLoc)
{
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

    if(extraLoc)
    {
        if(first)
        {
            first = false;
        }
        else query =  query + " "
        query = query + '"' + extraLoc + '"'
    }

    return query;
}

function logRequest(interceptedRequest) {
    console.log('A request was made:', interceptedRequest.url());
    if(interceptedRequest.url()==="https://www.google.com/recaptcha/api.js")
    {
        console.log('here')
        interceptedRequest.abort();
        console.log('request aborted')
    }

    else interceptedRequest.continue();

}

async function navigation(browser,page,url,javascriptEnable=true,tryCount=0,app)
{
    
    await page.setJavaScriptEnabled(javascriptEnable);
    // await page.setRequestInterception(true);
    // page.on('request', logRequest);

    console.log("------------ NEW PAGE OPENED AND GOING TO URL -----------------");
    try{
        await page.goto(url)
        await page.waitForNavigation({'waitUntil': 'networkidle0'});

        // await sleep(1000)

    let {siteKey,cookies,dataS,iframes,isIframe,isGoogleSearch,continueValue} = await pageEvaluation(page,true);
    console.log(`------------ DATA SITEKEY: ${siteKey}  -----------------`);
    console.log(`------------ DATA S: ${dataS}  -----------------`);
    console.log(`------------ COOKIES: ${cookies}  -----------------`);
    console.log(`--------- ANONYMOUS IFRAME FOUND: ${isIframe}  ----------`);

        if(isGoogleSearch)
        {
            console.log('--------------- ON Direct Google Search ------------');
        }

        else
        {
            let isGoogleCaptcha = false;
            for(let i=0;i<iframes.length;i++)
            {
                if(iframes[i].includes('recaptcha'))
                {
                    // console.log('captcha iframe found with src => ',iframes[i])
                    console.log(`--------- GOOGLE CAPTCHA FOUND: ${iframes[i]}  ----------`);
                    isGoogleCaptcha = true;
                    break;
                }
            }

            if(isGoogleCaptcha)
            {
                
                try
                {
                    console.log('unable to resolve captcha, again navigating')
                    console.log('tryCount => ',tryCount + 1)
                    if(tryCount===3)  //at 4th iteration
                    {
                        console.log(` ---------- On Try Count  ${tryCount + 1} ------------------`)
                        console.log(` ---------- Avoiding New Tab ------------------`)

                        await browser.close();
                        console.log(` ---------- Current Browser Closed ------------------`)


                        // let currPort = parseInt(app.get('currPort'));
                        // console.log(` ---------- Curr Port: ${currPort} ------------------`)
                        // app.set('currPort',currPort+1)
                        // console.log(` ---------- New Port Set At: ${currPort+1} ------------------`)

                        const args = [ "--no-sandbox",'--disable-setuid-sandbox','--proxy-server=proxy.zyte.com:8011' ]
                        
                        const newBrowser = await puppeteer.launch({ ignoreHTTPSErrors: true,headless: true,args,slowMo:10,defaultViewport:null })
                        console.log("--------- NEW BROWSER LAUNCHED  --------------");
                        console.log("--------- GOING TO NEW PAGE --------------");
                        let newPage = await newBrowser.newPage();
                        await navigation(newBrowser,newPage,url,true,0,app)
                    }
                    else 
                    {
                        const Newpage = await browser.newPage();
                        await navigation(browser,Newpage,url,true,tryCount+1,app)
                    }
                }

                catch(e)
                {
                    console.log('unable to navigate')                        
                }

                console.log("Submitting...")
            }

            else
            {
                console.log('---------- Error ------- No Google Search and No Captcha Proceedings...');
            }
        }
    }

    catch(e)
    {
        console.log("Unable to Open page ", e)
    }
}

async function scrape(website,location,industry,domain,extra,extraLoc,pageNumber,app,browser,page)
{
    // console.log(app);
    let query = await resolveQueries(website,location,industry,domain,extra,extraLoc)
    let url = "http://www.google.com/search?q=" +query+`&start=${pageNumber}`;
    // let url = "https://www.google.com/recaptcha/api2/demo"

    if(query==="")
    {
      return {code:400,error:'Malfunctioned Request'}
    }
    // puppeteer usage as normal
    // const args = [ '--disable-web-security', '--disable-features=IsolateOrigins,site-per-process' ]
    const args = [ "--no-sandbox",'--disable-setuid-sandbox','--proxy-server=proxy.zyte.com:8011']
    // const args = [ "--no-sandbox",'--disable-setuid-sandbox' ]

    if(!browser || !page)
    {
        // puppeteer usage as normal
        // const args = [ '--disable-web-security', '--disable-features=IsolateOrigins,site-per-process' ]
        const args = [ "--no-sandbox",'--disable-setuid-sandbox','--proxy-server=proxy.zyte.com:8011']
        // const args = [ "--no-sandbox",'--disable-setuid-sandbox' ]

        browser = await puppeteer.launch({  ignoreHTTPSErrors: true,headless: true,args,slowMo:10,defaultViewport:null })
        console.log("--------- BROWSER LAUNCHED INSIDE FUNCTION --------------");
        console.log("--------- GOING TO NEW PAGE --------------");
        page = await browser.newPage();
        // await page.setExtraHTTPHeaders({
        //     'Proxy-Authorization': 'Basic ' + Buffer.from('d318e565c387427fbd4f1c40575c6c49:@').toString('base64'),
        // });
        await page.authenticate({username:'d318e565c387427fbd4f1c40575c6c49', password:''})
        console.log("--------- PAGE AUTHETICATED --------------");
    }

    await navigation(browser,page,url,false,0,app)
    console.log('after proper navigation');

    let {code,result,error,document} = await mainScraping(page,browser);
    // let code=0,result=[],error=null,document=null;

    return {code,result,error,document}
}


async function mainScraping(page,browser)
{     
    let result=[],html,at,dotcom,str,strig,emailPattern,text;
    try
    {
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

        console.log('\n --------------     DocumentObject Start  ------------- \n ',result)
        console.log(' --------------     DocumentObject End    ------------- \n ')
    
        // await browser.close();
        return { code:200,result,document:text} 
    }
    catch(e)
    {
        console.log('Error at Main Scraping =>',e)
        // await browser.close();
        return {code:400,error:e};
    }
}

async function pageEvaluation(paramPage,checkIframe)
{
    console.log("------------ EVALUATING PAGE FOR DATA -----------------");

    if(!checkIframe)
    {
        let {siteKey,cookies,dataS,iframes,isIframe,isGoogleSearch,continueValue} = await paramPage.evaluate(
            () => {
                let iframes=[]; 
                let isIframe=false;
                let siteKey="";
                let dataS=""
                let cookies="";
                let isGoogleSearch=false;
                let continueValue='';

                function getCookie(cname) {
                    var name = cname + "=";
                    var decodedCookie = decodeURIComponent(document.cookie);
                    var ca = decodedCookie.split(';');
                    for(var i = 0; i <ca.length; i++) {
                      var c = ca[i];
                      while (c.charAt(0) == ' ') {
                        c = c.substring(1);
                      }
                      if (c.indexOf(name) == 0) {
                        return c.substring(name.length, c.length);
                      }
                    }
                    return "";
                }
                if(document.querySelectorAll('title')[0].innerText.toLowerCase().includes('google search'))
                {
                    isGoogleSearch=true;
                }
                else
                {   
                    if(document.querySelectorAll('iframe[src]')[0])
                    {
                        isIframe = true;
                        iframesQuery = document.querySelectorAll('iframe[src]');
                        [].forEach.call(iframesQuery, function(iframe) {
                            // do whatever
                            iframes.push(iframe.src)
                        });
                    }
                    //if(iframes.length>0 || !paramCheckIframe)
                    //{
                        const urlParams = new URLSearchParams(window.location.search);
                        continueValue = urlParams.get('q');

                        if(document.querySelectorAll('div[data-sitekey]')[0])
                        {   siteKey = document.querySelectorAll('div[data-sitekey]')[0].getAttribute('data-sitekey') }
                        if(document.querySelectorAll('div[data-s]')[0])
                        {   dataS = document.querySelectorAll('div[data-s]')[0].getAttribute('data-s') }
                        let dv = getCookie('DV')
                        let oneP = getCookie('1P_JAR')
                        let NID = getCookie('1P_JAR')
                        if(dv)
                        {cookies = cookies + "DV:" +dv+";"}
                        if(oneP)
                        {cookies = cookies + "1P_JAR:" +oneP+";"}
                        if(NID)
                        {cookies = cookies + "NID:" +NID+";"}
                        // cookies = document.cookie;
                    // }
                }
                return {siteKey,cookies,dataS,iframes,isIframe,isGoogleSearch,continueValue} 
            }
        );
        return {siteKey,cookies,dataS,iframes,isIframe,isGoogleSearch,continueValue}
    }    

    else
    {
        let {siteKey,cookies,dataS,iframes,isIframe,isGoogleSearch,continueValue} = await paramPage.evaluate(
            () => {
                let iframes=[]; 
                let isIframe=false;
                let siteKey="";
                let dataS=""
                let cookies="";
                let isGoogleSearch=false;
                let continueValue='';

                function getCookie(cname) {
                    var name = cname + "=";
                    var decodedCookie = decodeURIComponent(document.cookie);
                    var ca = decodedCookie.split(';');
                    for(var i = 0; i <ca.length; i++) {
                    var c = ca[i];
                    while (c.charAt(0) == ' ') {
                        c = c.substring(1);
                    }
                    if (c.indexOf(name) == 0) {
                        return c.substring(name.length, c.length);
                    }
                    }
                    return "";
                }
                if(document.querySelectorAll('title')[0].innerText.toLowerCase().includes('google search'))
                {
                    isGoogleSearch=true;
                }
                else
                {   
                    if(document.querySelectorAll('iframe[src]')[0])
                    {
                        isIframe = true;
                        iframesQuery = document.querySelectorAll('iframe[src]');
                        [].forEach.call(iframesQuery, function(iframe) {
                            // do whatever
                            iframes.push(iframe.src)
                        });
                    }
                    if(iframes.length>0)
                    {
                        const urlParams = new URLSearchParams(window.location.search);
                        continueValue = urlParams.get('q');

                        if(document.querySelectorAll('div[data-sitekey]')[0])
                        {   siteKey = document.querySelectorAll('div[data-sitekey]')[0].getAttribute('data-sitekey') }
                        if(document.querySelectorAll('div[data-s]')[0])
                        {   dataS = document.querySelectorAll('div[data-s]')[0].getAttribute('data-s') }
                        let dv = getCookie('DV')
                        let oneP = getCookie('1P_JAR')
                        let NID = getCookie('1P_JAR')
                        if(dv)
                        {cookies = cookies + "DV:" +dv+";"}
                        if(oneP)
                        {cookies = cookies + "1P_JAR:" +oneP+";"}
                        if(NID)
                        {cookies = cookies + "NID:" +NID+";"}
                        // cookies = document.cookie;
                    }
                }
                return {siteKey,cookies,dataS,iframes,isIframe,isGoogleSearch,continueValue} 
            }
        );
        return {siteKey,cookies,dataS,iframes,isIframe,isGoogleSearch,continueValue}
    }
}



function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { scrape }

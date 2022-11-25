const express = require('express');
const router = express.Router();
const scraper = require('../functions/scraperV5');
const puppeteer = require('puppeteer')

let browser = null;
let page = null;

async function launchBrowser1() 
{
    // puppeteer usage as normal
    // const args = [ '--disable-web-security', '--disable-features=IsolateOrigins,site-per-process' ]
    const args = [ "--no-sandbox",'--disable-setuid-sandbox','--proxy-server=proxy.zyte.com:8011']
    // const args = [ "--no-sandbox",'--disable-setuid-sandbox' ]
    browser = await puppeteer.launch({  ignoreHTTPSErrors: true,headless: true,args,slowMo:10,defaultViewport:null })
    console.log("--------- BROWSER LAUNCHED ON AUTOMATIC SCRAPER--------------");
    console.log("--------- GOING TO NEW PAGE --------------");
    page = await browser.newPage();
    await page.authenticate({username:'d318e565c387427fbd4f1c40575c6c49', password:''})
    console.log("--------- PAGE AUTHETICATED --------------");
};

launchBrowser1();



router.get("/", async (req, res, next) => {


    let app = req.app;

    let website=req.query.website || null;
    let location=req.query.location || null;
    let domain=req.query.domain || null;
    let industry=req.query.industry || null;
    let extra=req.query.extra || null;
    let extraLoc=req.query.extraLoc || null;

    let curr_page=(parseInt(req.query.page)-1)*10 || 0;
    let err=false;
    let errMessage="";
    let result=[];

    while(result.length<100)
    {
        console.log(curr_page);
        let response =  await scraper.scrape(website,location,industry,domain,extra,extraLoc,curr_page,app,browser,page)

        if(response.code!=200)
        {
           err=true;
           errMessage= response.error
           console.log('in error')
           break;
        }

        else if(!response.result)
        {
            err=true;
            errMessage= "Nullify Result - Forced Page Break"
            console.log('in nullify result')
            break;
        }

        else{ 
            console.log(' -----------  concatenating result ----------  '); 

            if(response.result.includes("22@"+domain))
            {          
                response.result.splice(response.result.indexOf("22@"+domain), 1);  //deleting              
            }

            result = result.concat(response.result)
            result = [...new Set(result)];
        }

        if(curr_page>200)
        {
            err=true; 
            errMessage= "Automatic Page Break"
            console.log('forced page break')
            break; 
        }

        curr_page=curr_page+10;
        console.log(result);
    }

    if(err)
    {
        console.log('in err result, ',result)
        if(result.length>0)
        {
            let pageBreak = (curr_page/10)+1
            res.status(200).send({error:`Page Break At ${pageBreak}`,errorMessage:errMessage,result,page:((curr_page/10)+1)})
        }   
        
        else  res.status(400).send({error:'Malfunctioned Reuqest',errorMessage:errMessage,page:((curr_page/10)+1)})
    }

    else res.send({ok:'true',result,page:((curr_page/10)+1)})

    })



module.exports =router;

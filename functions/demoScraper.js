const puppeteer = require('puppeteer-extra')

// add recaptcha plugin and provide it your 2captcha token (= their apiKey)
// 2captcha is the builtin solution provider but others would work as well.
// Please note: You need to add funds to your 2captcha account for this to work
const RecaptchaPlugin = require('puppeteer-extra-plugin-recaptcha')
puppeteer.use(
  RecaptchaPlugin({
    provider: {
      id: '2captcha',
      token: '4362444778dd52bf11192031b9bfa5f8'
    },
    visualFeedback: true, // colorize reCAPTCHAs (violet = detected, green = solved)
  })
)

const config = {
    pageurl:'http://www.google.com/recaptcha/api2/demo',
    apiKey:'4362444778dd52bf11192031b9bfa5f8',
    apiSubmitUrl:'http://2captcha.com/in.php',
    apiRetrieveUrl:'http://2captcha.com/res.php'
}

async function initiateCaptchaRequest(apiKey)
{
    const formData = {
        method:'userrecaptcha',
        googlekey: config.sitekey,
        key:apiKey,
        pageurl: config.pageurl,
        json:1
    };
    console.log(`Submitting solution request`)
}

async function scrape()
{
// puppeteer usage as normal
const args = [ '--disable-web-security', '--disable-features=IsolateOrigins,site-per-process' ]


await puppeteer.launch({ headless: false,args,slowMo:10,defaultViewport:null }).then(async (browser) => {
  const page = await browser.newPage()
  await page.goto('http://www.google.com/recaptcha/api2/demo')

  let siteKey = await page.evaluate(
    () =>
    {
        return document.querySelectorAll('div[data-sitekey]')[0].getAttribute('data-sitekey');
    }
   );

   console.log(siteKey)

  // That's it, a single line of code to solve reCAPTCHAs 🎉
  await page.solveRecaptchas()

  await Promise.all([
    page.waitForNavigation(),
    page.click(`#recaptcha-demo-submit`),
  ])
  await page.screenshot({ path: 'response.png', fullPage: true })
})

return {code:200,result:[]}
}

module.exports = { scrape }

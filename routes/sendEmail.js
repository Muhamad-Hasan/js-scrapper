const express = require("express");
const router = express.Router();
const fs = require("fs");

const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(
  "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"
);

router.post("/", async (req, res, next) => {
  const { email, subject, content, attachment } = req.body;
  // pathToAttachment = `${__dirname}/../upload/3ba75afd6baa10b68b59a86f3dcabc49.xlsx`;
  // attachment = fs.readFileSync(pathToAttachment).toString("base64");
  const msg = {
    to: email, // Change to your recipient
    from: "opportunitydevdw@gmail.com", // Change to your verified sender
    subject: subject,
    text: content,
    attachments: [
      {
        content: attachment,
        filename: "attachment.csv",
        type: "application/csv",
        disposition: "attachment",
      },
    ],
    // html: "<strong>and easy to do anywhere, even with Node.js</strong>",
  };

  let response;
  try
  {
    response = await sgMail.send(msg);
  }

  catch(e)
  {
    console.log('error ',e)
    console.dir(e, { depth: null });
  }
  return res.send({ ...response });
  // return res.send({ message: "sdas" });
});

module.exports = router;


const express = require('express');
const router = express.Router();
const responses = require('../functions/responses')

var AWS = require("aws-sdk");

AWS.config.update({
    "accessKeyId": "AKIATPQBJSHU4PMKKARB",
    "secretAccessKey": "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",
});

const s3 = new AWS.S3();

var bucketParams = {
    Bucket : "opportunity-csv-bucket",
    Prefix: 'scraping-lists/',
};




router.get(["/"], async (req, res, next) => {

    try
    {
        s3.listObjects(bucketParams, function(err, data) {
            if (err) {
                console.log("Error", err);
                return responses.ServerError({label:'Unable to Fetch Data'},res)
            } else {
                console.log("Success", data);
                return responses.Success({data},res)
            }
        });
    }
    catch(err)
    {
        console.log("Error", err);
        return responses.ServerError({label:'Unable to Fetch Data'},res)
    }

})

module.exports =router;


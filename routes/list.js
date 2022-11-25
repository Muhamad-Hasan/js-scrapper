
const express = require('express');
const router = express.Router();
const responses = require('../functions/responses')
const upload = require('../functions/multer')
var fs = require('fs');


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


var type = upload.single('file');





router.get(["/:fileName","/"], async (req, res, next) => {

    const fileName = req.params.fileName || req.query.fileName;

    if(!fileName)
    {
        return responses.Malfunctioned_Request([{label:'fileName'}],res);
    }

    const GetParams = {
        Bucket : "opportunity-csv-bucket",
        Key:`scraping-lists/${fileName}`
    }

    try
    {
        s3.getObject(GetParams, function(err, data) {
            if (err) {
                console.log("Error", err);
                if( (err.statusCode==404) && (err.code==="NoSuchKey"))
                {
                    console.log('here in error')
                    return responses.requestError({statusCode:400,errors:[{label:'Invalid File Name'}]},res)
                }
            }   else {
                return responses.Success({data},res)
            }
        });
    }

    catch(e)
    {
        console.log('error =>',e);
        return responses.ServerError({label:'Unable to Fetch Data'},res)
    }

})



router.post("/", type, async (req, res, next) => {

    
    const fileName = req.body.fileName;
    const file = req.file;

    

    // var tmp_path = req.file.path;


    if(!fileName)
    {
        return responses.Malfunctioned_Request([{label:'fileName'}],res);
    }
    if(!file)
    {
        return responses.Malfunctioned_Request([{label:'file'}],res);
    }

    console.log('file =>',file)

    var filename = process.cwd()+"/"+file.path;

    const PostParams = {
        Bucket : "opportunity-csv-bucket",
        Key:`scraping-lists/${fileName}`,
        Body:  fs.createReadStream(filename)
    }

    try
    {
        s3.putObject(PostParams, function(err, data) {
            if (err) {
                console.log("Error", err);
                if( (err.statusCode==404) && (err.code==="NoSuchKey"))
                {
                    return responses.requestError({statusCode:400,errors:[{label:'Invalid File Name'}]},res)
                }
            }   else {
                return responses.Success(data,res)
            }
        });
    }

    catch(e)
    {
        console.log('error =>',e);
        return responses.ServerError({label:'Unable to Fetch Data'},res)
    }

})

module.exports =router;




// responseCode  : Success


async function Success(Content,res,next)
{   
    res.status(200).send({
        responseCode:"Success",
        Content,
    })
}



// responseCode  : Server Error



async function ServerError(errors,res,next)
{
    validationErrorList=[];
    errors.forEach(ele => {
        validationErrorList.push(ele.label)
    });
    res.status(400).send({
        responseCode:"Failed",
        validationErrorList,
    })
}





// responseCode  : Failed
async function Malfunctioned_Request(requiredFields,res,next)
{
    validationErrorList=[];
    requiredFields.forEach(ele => {
        validationErrorList.push(`Missing ${ele.label} Parameter`)
    });
    res.status(400).send({
        responseCode:"Failed",
        validationErrorList,
    })
}

async function requestError(block,res,next)
{
    validationErrorList=[];
    block.errors.forEach(ele => {
        validationErrorList.push(`${ele.label}`)
    });
    res.status(block.statusCode).send({
        responseCode:"Failed",
        validationErrorList,
    })
}



module.exports = { Success,Malfunctioned_Request,requestError,ServerError }
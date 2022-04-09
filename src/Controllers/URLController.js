const UrlModel = require('../Models/URLModel')
const validUrl = require('valid-url')
const shortid = require('shortid')
const redis = require("redis")
const { promisify } = require("util")
const { json } = require('body-parser')

// ********************************************************** Connect to redis ********************************************************** //

const redisClient = redis.createClient(
    18182,
    "redis-18182.c264.ap-south-1-1.ec2.cloud.redislabs.com",
    { no_ready_check: true }
  );
  redisClient.auth("7IX9vyy6Xo7sbQIHyHSkiNKesEGCkDsW", function (err) {
    if (err) throw err;
  });
  redisClient.on("connect", async function () {
    console.log("Connected to Redis..");
  });
  const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
  const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);
  

// *************************************************************** Validation ************************************************************* //
const isValidBody = function (body) {
    return Object.keys(body).length > 0;
}

const isValid = function (value) {
    if (typeof value === 'undefined' || value === null) return false; 
    if (typeof value === 'string' && value.trim().length === 0) return false;
    return true
}


// ********************************************************** POST /url/shorten ********************************************************** //

const createUrl = async function(req,res) {
    try {
        const body = req.body
        // Validate body(body must be present)
        if(!isValidBody(body)) {
            return res.status(400).send({status: false, msg: "Body must not be empty"})
        }

        // Validate query(it must not be present)
        const query = req.query;
        if(isValidBody(query)) {
            return res.status(400).send({ status: false, msg: "Invalid parameters. Query must not be present"});
        }

        // Validate params(it must not be present)
        const params = req.params;
        if(isValidBody(params)) {
            return res.status(400).send({ status: false, msg: "Invalid parameters. Params must not be present"})
        }

        // longUrl must be present in body
        const longUrl = body.longUrl
        if(!isValid(longUrl)) { 
            return res.status(400).send({status: false, msg:"Please provide longUrl"})
        }

        // //Validation of longUrl            
        // if(!/(:?^((https|http|HTTP|HTTPS){1}:\/\/)(([w]{3})[\.]{1}|)?([a-zA-Z0-9]{1,}[\.])[\w]((\/){1}([\w@?^=%&amp;~+#-_.]+)))$/.test(longUrl)) {
        //     return res.status(400).send({status: false, message: `logoLink is not a valid URL`})
        // }


        // Validation of longUrl
         if( (!/(http|https|HTTP|HTTPS?:\/\/.)?(([www]{3})[\.]{1})?[-a-zA-Z0-9@:%.\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%\+.~#?&//=]*)$/.test(longUrl)) && (!/(:?^((https|http|HTTP|HTTPS){1}:\/\/)(([w]{3})[\.]{1}|)?([a-zA-Z0-9]{1,}[\.])[\w]*((\/){1}([\w@?^=%&amp;~+#-_.]+))*)$/.test(longUrl)) ) { //TA
            return res.status(400).send({status: false, message: `longURL is not a valid URL`})
        }

        
       
         
        
        // if url is already present in db
        let url = await UrlModel.findOne({longUrl}).select({longUrl:1, shortUrl:1, urlCode:1, _id:0})
        if(url) {
            await SET_ASYNC(`${longUrl}`, JSON.stringify(url))
            console.log("data is from mongodb")
            return res.status(200).send({status: true, data: url})
        } 


        let check = await GET_ASYNC(`${longUrl}`)
        if(check) {
            let response = JSON.parse(check)
            console.log("data is from cache")
            return res.status(200).send({status: true, data: response})
        }
    

        const baseUrl = 'http://localhost:3000/'
        // Validation of baseUrl
        if(!validUrl.isUri(baseUrl)) {
            return res.status(401).send({ status: false, msg: "Invalid baseUrl"})
        }
        
        const urlCode = (Math.random() + 1).toString(36).substring(7);

        // To create shortUrl from longUrl. We have to combine baseUrl with the urlCode.
        const shortUrl = baseUrl +  urlCode.toLowerCase()


        let input = {longUrl, shortUrl, urlCode}
        
        const finalurl = await UrlModel.create(input)
        const createdUrl = {longUrl:finalurl.longUrl, shortUrl:finalurl.shortUrl, urlCode:finalurl.urlCode}
        
        await SET_ASYNC(`${input}`, JSON.stringify(finalurl)) //,"EX", 20)
        console.log("Data stored from DB")
        return res.status(201).send({status: true, data: createdUrl})
        
    }
    catch (err) {
        console.log("This is the error :", err.message)
        return res.status(500).send({status: false, msg:err.message })
    }
}

module.exports.createUrl = createUrl



// ************************************************************* GET /:urlCode ************************************************************* //

const getUrl = async function(req,res) {
    try {
        // Validate body(it must not be present)
        if(isValidBody(req.body)) {
            return res.status(400).send({status: false, msg: "Body should not be present"})
        }

        // Validate query(it must not be present)
        const query = req.query;
        if(isValidBody(query)) {
            return res.status(400).send({ status: false, msg: "Invalid parameters. Query must not be present"});
        }

        const urlCode = req.params.urlCode
        // Validate params(it must be present)
        if(!isValid(urlCode.trim().toLowerCase())) {
            return res.status(400).send({status: false, msg: "Please provide urlCode"})
        }

        else{
            let cache = await GET_ASYNC(`${urlCode}`);
            if(cache) {
                console.log("stored data pulled from cache.")
                return res.status(302).redirect(JSON.parse(cache))
            }
            else {
                const url = await UrlModel.findOne({urlCode: urlCode})
                if(url) {
                    console.log("stored data pulled from DB")
                    await SET_ASYNC(`${urlCode}`, JSON.stringify(url.longUrl))
                    return res.status(302).redirect(url.longUrl);
                } else{
                    return res.status(404).send({status: false, msg: "No urlCode matches"})
                }
            }
        }

        
    }
    catch (err) {
        console.log("This is the error :", err.message)
        return res.status(500).send({status: false, msg:err.message })
    }
}

module.exports.getUrl = getUrl

//////////////////////////////////////////////////////////// END OF URL CONTROLLER ///////////////////////////////////////////////////////////
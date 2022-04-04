const Urlmodel = require('../Models/URLModel')
const validUrl = require('valid-url')

const shortUrl = async function(req,res) {
    try {
        const longUrl = req.body.longUrl
        const baseUrl = 'http://localhost:3000'


    }
    catch (err) {
        console.log("This is the error :", err.message)
        res.status(500).send({ msg: "Error", error: err.message })
    }
}

module.exports.shortUrl = shortUrl
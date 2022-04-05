const mongoose = require('mongoose')

const UrlSchema = new mongoose.Schema({ 
    longUrl: {
        type: String,
        required: true,
        trim: true
    },

    shortUrl: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },

    urlCode: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    
    
}, 
// {versionKey: false} 
 { timestamps: true }
)

module.exports = mongoose.model('URL', UrlSchema)

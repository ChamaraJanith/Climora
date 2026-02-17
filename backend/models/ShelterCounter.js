const mongoose = require("mongoose");

const shelterCounterSchema = new mongoose.Schema(
    {
        key:
        {
            type:String,
            unique:true,
            required:true,
        },
        seq:{
            type:Number,
            default:0,
        },
    });

module.exports = mongoose.model("ShelterCounter", shelterCounterSchema);    

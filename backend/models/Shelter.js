//IN this Model we will create the Shelter model which will be used to store the shelter information in the database
const mongoose = require("mongoose");

//define reliefitem schema as a variable 
const reliefItemSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required:true,
            trim:true
        },
        category:{
            type:String,
            enum:["food","medicine","water","clothes","hygiene","battery","other"],
            default:"other",
        },
        quantity:{
            type:Number,
            default:0,
        },
        unit:{
            type:String,
            enum:["kg","liters","pieces","units"],
            default:"units",
        },
        expiryDate:{
            type:Date,
        },
        priorityLevel:{
            type:String,
            enum:["normal","urgent"],
            default:"normal",
        },
        lastUpdated:{
            type:Date,
            default:Date.now,
        }
    },
    {
        _id:false,
    }
    
);

//define shelter schema
const shelterSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        address: {
            type: String,
            required: true,
            trim: true,
        },
        district: {
            type: String,
            required: true,
            trim: true,
        },
        lat:
        {
            type:Number,
            required:true,
        },
        lng:
        {
            type:Number,
            required:true,
        },
        capacityTotal: {
            type: Number,
            required: true,
        },
        capacityCurrent: {
            type: Number,
            default: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        type: {
            type: String,
            enum: ["school", "temple","communityHall","other"],
            default: "other",
        },
        riskLevel: {
            type: String,
            enum: ["low", "medium", "high"],
            default: "low",
        },
        facilities: {
            type: [String],
        },
        contactPerson:
        {
            type:String,
        },
        contactPhone:
        {
            type:String,
        },
        contactEmail:
        {
            type:String,
        },
        currentOccupantsCount:{
            type:Number,
            default:0,
        },
        lastUpdatedBy: {
            type:String,
            trim:true,
        },
        reliefItems: [reliefItemSchema],
    },
    {
        timestamps: true,
    }
);
const Shelter = mongoose.model("Shelter", shelterSchema);

module.exports = Shelter;
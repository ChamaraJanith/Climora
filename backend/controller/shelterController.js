const Shelter=require("../models/Shelter");

//GET /api/shelters - Get all shelters
exports.getAllShelters=async(req,res)=>
{
    try{
        const shelters=await Shelter.find().lean();
        res.json(shelters);
    }
    catch(err)
    {
        console.error("Error fetching shelters:",err.message);
        res.status(500).json({error:"Failed to fetch shelters"});
    }
};

//GET /api/shelters/:id - Select One Shelter
exports.getShelterById=async(req,res)=>
{
    try{
        const shelter=await Shelter.findById(req.params.id).lean();
        if(!shelter)
        {
            return res.status(404).json({error:"Shelter not found"});
        }
        res.json(shelter);
    }
    catch(err)
    {
        res.status(400).json({error:"Invalid shelter ID"});
    }
};

//POST /api/shelters - Create a new shelter
exports.createShelter=async(req,res)=>
{
    try{
        const shelter=await Shelter.create(req.body);
        res.status(201).json(shelter);
    }
    catch(err)
    {
        console.error("Error creating shelter:",err.message);
        res.status(400).json({error:"Failed to create shelter",details:err.message});
    }
};

//PUT /api/shelters/:id - Update a shelter
exports.updateShelter=async(req,res)=>
{
    try{
        const shelter=await Shelter.findByIdAndUpdate(req.params.id,req.body,{new:true,runValidators:true}).lean();
        if(!shelter)
        {
            return res.status(404).json({error:"Shelter not found"});
        }
        res.json(shelter);
    }
    catch(err)
    {
        console.error("Error updating shelter:",err.message);
        res.status(400).json({error:"Failed to update shelter",details:err.message});
    }
};

//DELETE /api/shelters/:id - Delete a shelter
exports.deleteShelter=async(req,res)=>
{
    try{
        const shelter=await Shelter.findByIdAndDelete(req.params.id).lean();
        if(!shelter)
        {
            return res.status(404).json({error:"Shelter not found"});
        }
        res.json({message:"Shelter deleted successfully"});
    }
    catch(err)
    {
        console.error("Error deleting shelter:",err.message);
        res.status(400).json({error:"Failed to delete shelter",details:err.message});
    }
};
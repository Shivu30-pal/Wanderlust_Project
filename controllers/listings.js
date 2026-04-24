const Listing = require("../models/listing")
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAPBOX_TOKEN;
const geoCodingClient = mbxGeocoding({ accessToken: mapToken});


module.exports.index = (async(req,res)=>{
    const allListings = await Listing.find({});
    res.render("listings/index.ejs",{allListings});  
});

module.exports.renderNewForm =(req,res)=>{
    res.render("listings/new.ejs");
}


module.exports.showListing = async (req, res) => {
    let { id } = req.params;

    const listing = await Listing.findById(id)
        .populate({ path: "reviews", populate: { path: "author" } })
        .populate("owner");

    if (!listing) {
        req.flash("error", "Cannot find that listing");
        return res.redirect("/listings");
    }

    res.render("listings/show.ejs", {
        listing,
        mapToken: process.env.MAPBOX_TOKEN   // ✅ ADD THIS
    });
};


module.exports.createListing = async (req, res) => {

    console.log("INPUT:", req.body.listing.location);
    let response = await geoCodingClient
        .forwardGeocode({
            query: `${req.body.listing.location}, ${req.body.listing.country}`,
            limit: 1,
            countries: ["IN"],
            types: ["place"]
        })
        .send();

    let feature = response.body.features[0];

    let geometry = feature.geometry;

    let city = feature.text;

    let country = feature.context.find(c => c.id.includes("country"));
    country = country ? country.text : "";

    let url = req.file.path;
    let filename = req.file.filename;

    const newListing = new Listing(req.body.listing);

    newListing.owner = req.user._id;
    newListing.image = { url, filename };
    newListing.geometry = geometry;

    newListing.location = `${city}, ${country}`;

    await newListing.save();
        
    req.flash("Success", "Successfully made a new listing");

    res.redirect("/listings");


};


module.exports.editListing = async(req,res)=>{
    let{id} = req.params;
    const listing = await Listing.findById(id);
    if(!listing){
        req.flash("error","Cannot find that listing");
       return res.redirect("/listings");
    }
    let originalImageurl = listing.image.url;
    originalImageurl= originalImageurl.replace("/upload","/upload/w_250")
    res.render("listings/edit.ejs",{listing,originalImageurl})
}

module.exports.updateListing = async(req,res)=>{
    let{id} = req.params;
    let listing = await Listing.findByIdAndUpdate(id,{...req.body.listing});

    if (req.file) {
        let url = req.file.path;
        let filename = req.file.filename;
        listing.image = { url, filename };
        await listing.save();
    }


    req.flash("Success","Successfully updated the listing");
    res.redirect(`/listings/${id}`);
}

module.exports.deleteListing =async(req,res)=>{
    let{id} = req.params;
    await Listing.findByIdAndDelete(id);
    req.flash("Success","Successfully deleted the listing");
    res.redirect("/listings");
}

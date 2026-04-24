const Review = require("../models/Review")
const Listing = require("../models/listing")

module.exports.createReview = async (req, res) => {
    console.log(req.params.id);
    const listing = await Listing.findById(req.params.id);

    const newReview = new Review(req.body.review); 
    newReview.author = req.user._id;

    await newReview.save();
    listing.reviews.push(newReview._id); 
    await listing.save();
    req.flash("Success","Successfully added a new review");
    res.redirect(`/listings/${listing._id}`);

}

module.exports.destroyReview = async(req,res)=>{
    let{id,reviewId} = req.params;

    await Listing.findByIdAndUpdate(id,{$pull: {reviews:reviewId}});
    await Review.findByIdAndDelete(reviewId);
    req.flash("Success","Successfully deleted the review");
    res.redirect(`/listings/${id}`);
}
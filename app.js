if(process.env.NODE_ENV != "production"){
    require("dotenv").config();
}

// console.log(process.env.SECRET);


const express = require ("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
const isLoggedIn = require("./middleware.js")

const listingsRouter = require("./routes/listing.js")
const reviewsRouter = require("./routes/review.js")
const userRouter = require("./routes/user.js")

app.set("views", path.join(__dirname, "views"));

app.engine("ejs", ejsMate);   
app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

// const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";
const dbUrl = process.env.ATLASDB_URL;

main()
    .then(()=>{
        console.log("Connection successfull");
    })
    .catch((err)=>{
        console.log(err);
    });

async function main() {
    await mongoose.connect(dbUrl);
}

// app.get("/",(req,res)=>{
//     res.send("Hi!I'm root");
// });


const store = MongoStore.create({
    mongoUrl :dbUrl,
    crypto:{
        secret:process.env.SESSION_SECRET,
    },
    touchAfter:24*3600,
});

store.on("error",()=>{
    console.log("error in mongo session",err);
});

const SessionOption = {
    store,
    secret:process.env.SESSION_SECRET,
    resave:false,
    saveUninitialized:true,
    cookie :{
        expires: Date.now()+7*24*60*60*1000,
        maxAge: 7*24*60*60*1000,
        httpOnly:true,
    }
};



app.use(session(SessionOption));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//flash middleware
app.use((req,res,next)=>{
    res.locals.Success = req.flash("Success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});

// app.get("/demouser",async(req,res)=>{
//     let fakeUser = new User({
//         email:"Student@gmail.com",
//         username:"student123" ,
//     });
//     let registeredUser = await User.register(fakeUser,"helloworld");
//     res.send(registeredUser);
// })

app.use("/listings",listingsRouter);
app.use("/listings/:id/reviews",reviewsRouter);
app.use("/",userRouter);

app.use((req, res, next) => {
    next(new ExpressError(404, "Page Not Found!"));
});


// custom error handler or middleware
app.use((err,req,res,next)=>{
    let{statuscode=500, message="something went wrong"} = err;
    res.status(statuscode).render("Error.ejs",{message});
    // res.status(statuscode).send(message);
});

app.listen(8080, ()=>{
    console.log("server is listing to port");
});



// app.get("/testListing",async(req,res)=>{
//     let sampleListing = new Listing({
//         title : "Villa",
//         description : "By the Beach",
//         price : 1500,
//         location : "Panji , Goa",
//         country : "India",
//     });
//     await sampleListing.save();
//     console.log("sample was saved");
//     res.send("successfull test");
// });
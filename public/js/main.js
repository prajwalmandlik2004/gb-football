const express = require('express');
const app = express();
const path = require('path');
const hbs = require('hbs');
require('dotenv').config();
const { register } = require('module');
require('./database/connection');
const { json } = require('express');
const staticPath = path.join(__dirname, "./public/gbfootball");
const templatePath = path.join(__dirname, "./templates/views");
// const partialsPath = path.join(__dirname, "../templates/partials");
const Register = require('./models/register');
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');
const auth = require('./middleware/auth');
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(staticPath));
app.set("view engine", "hbs");
app.set("views", templatePath);
// hbs.registerPartials(partialsPath);


app.get('/', (req, res) => {
    res.render("index");
});

app.get('/secret', auth, (req, res) => {
    console.log(`Awesome cookie : ${req.cookies.jwt}`);
    res.render("secret");
});

app.get('/logout', auth, async (req, res) => {
    try {
        console.log(req.user);

        // Logout from only one device : 

        // req.user.tokens = req.user.tokens.filter((curElement) => {
        //     return curElement.token != req.token;
        // })


        // Logout from all device : 

        req.user.tokens = [];


        res.clearCookie("jwt");
        console.log("Logout Successfully !!");
        await req.user.save();
        res.render("login");
    } catch (error) {
        res.status(500).send(error);
    }
});

app.get('/register', (req, res) => {
    res.render("register");
});

app.get('/login', (req, res) => {
    res.render("login");
});

app.get('/contact', (req, res) => {
    res.render("contact");
});



app.post('/register', async (req, res) => {
    try {
        const password = req.body.password;
        const cpassword = req.body.confirmpassword;

        if (password === cpassword) {
            const registerEmplyoee = new Register({
                firstname: req.body.firstname,
                lastname: req.body.lastname,
                email: req.body.email,
                phone: req.body.phone,
                age: req.body.age,
                gender: req.body.gender,
                password: req.body.password,
                confirmpassword: req.body.confirmpassword
            });

            console.log("The success part : " + registerEmplyoee);

            const token = await registerEmplyoee.genAuthToken();
            console.log("The token part : " + token);

            // Get token and store into cookies : 

            // res.cookie() is used to set the cookie name to the value 
            // value parameter may be a string , object to JSON

            res.cookie("jwt", token, {
                expires: new Date(Date.now() + 600000),
                httpOnly: true
                // secure : true => works only in https
            });

            // console.log(cookie);

            const saveData = await registerEmplyoee.save();
            console.log("The page part is : " + saveData);
            res.status(201).render("index");
        }
        else {
            res.send("Password is not matching");
        }
    } catch (error) {
        res.status(400).send(error);
    }
});



app.post('/login', async (req, res) => {
    try {

        const email = req.body.email;
        const password = req.body.password;

        const userEmail = await Register.findOne({ email: email });

        const isMatch = await bcrypt.compare(password, userEmail.password);

        const token = await userEmail.genAuthToken();
        console.log("The token is : " + token);

        // Get token and store into cookies : 

        res.cookie("jwt", token, {
            expires: new Date(Date.now() + 600000),
            httpOnly: true
            // secure : true => works only in https
        });

        // console.log(cookie);

        // userEmail.password === password
        if (isMatch) {
            res.status(201).render("index");
        }
        else {
            res.send("Invalid Details");
        }

    } catch (error) {
        res.status(400).send(error);
    }
});



app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})




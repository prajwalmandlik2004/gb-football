const jwt = require('jsonwebtoken');
const Register = require('../models/register');

const auth = async (req, res, next) => {
    try {
        const token = req.cookies.jwt;
        if (!token) {
            throw new Error('No token found');
        }

        const verifyUser = jwt.verify(token, process.env.SECRET_KEY);
        const user = await Register.findOne({ _id: verifyUser._id, "tokens.token": token });

        if (!user) {
            throw new Error('User not found');
        }

        req.token = token;
        req.user = user;
        next();
    } catch (error) {
        res.status(401).send("Please authenticate.");
    }
};

module.exports = auth;





// const jwt = require('jsonwebtoken');
// const Register = require('../models/register');


// const auth = async (req, res, next) => {
//     try {
//         const token = req.cookies.jwt;
//         const verifyUser = jwt.verify(token, process.env.SECRET_KEY);
//         console.log(verifyUser);

//         const user = await Register.findOne({ _id: verifyUser._id });
//         console.log(`User name : ${user.firstname}`);

//         req.token = token;
//         req.user = user;

//         next();
//     } catch (error) {
//         res.status(401).send(error);
//     }
// }

// module.exports = auth;




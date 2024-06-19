// const jwt = require('jsonwebtoken');
// const Register = require('../models/register');

// const auth = async (req, res, next) => {
//     try {
//         const token = req.cookies.jwt;
//         console.log('Token from cookies:', token); // Debug log

//         if (!token) {
//             console.log('No token found');
//             throw new Error('No token found');
//         }

//         const verifyUser = jwt.verify(token, process.env.SECRET_KEY);
//         console.log('Verified user:', verifyUser); // Debug log

//         const user = await Register.findOne({ _id: verifyUser._id, "tokens.token": token });
//         console.log('User from database:', user); // Debug log

//         if (!user) {
//             console.log('User not found');
//             throw new Error('User not found');
//         }

//         req.token = token;
//         req.user = user;
//         next();
//     } catch (error) {
//         console.log('Authentication error:', error); // Debug log
//         res.status(401).send("Please authenticate.");
//     }
// };

// module.exports = auth;


const jwt = require('jsonwebtoken');
const Register = require('../models/register');

const auth = async (req, res, next) => {
    try {
        const token = req.cookies.jwt;
        console.log('Token from cookies:', token); // Debug log

        if (!token) {
            console.log('No token found');
            throw new Error('No token found');
        }

        let verifyUser;
        try {
            verifyUser = jwt.verify(token, process.env.SECRET_KEY);
            console.log('Verified user:', verifyUser); // Debug log
        } catch (err) {
            console.log('Token verification failed:', err.message);
            throw new Error('Invalid token');
        }

        const user = await Register.findOne({ _id: verifyUser._id, "tokens.token": token });
        console.log('User from database:', user); // Debug log

        if (!user) {
            console.log('User not found');
            throw new Error('User not found');
        }

        req.token = token;
        req.user = user;
        next();
    } catch (error) {
        console.log('Authentication error:', error.message); // Debug log
        res.status(401).send("Please authenticate.");
    }
};

module.exports = auth;



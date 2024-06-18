const express = require('express');
const app = express();
const path = require('path');
const hbs = require('hbs');
require('dotenv').config();
require('./database/connection');
const Register = require('./models/register');
const Deposit = require('./models/deposit');
const Withdrawal = require('./models/withdrawal');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');
const auth = require('./middleware/auth');
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());
// app.use(auth);
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "./public")));
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "./templates/views"));

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

app.get('/', (req, res) => {
    res.render("index", { user: req.user });
});



app.get('/', (req, res) => {
    res.render("index", { user: req.user });
});

app.get('/secret', auth, (req, res) => {
    console.log(`Awesome cookie : ${req.cookies.jwt}`);
    res.render("secret");
});

app.get('/logout', auth, async (req, res) => {
    try {
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

app.get('/dashboard', (req, res) => {
    res.render("dashboard", { user: req.user });
});

app.get('/withdrawal', auth, async (req, res) => {
    try {
        const user = await Register.findById(req.user._id);
        const deposits = await Deposit.find({ userId: req.user._id, status: 'Approved' }).sort({ createdAt: -1 });

        const totalBalance = deposits.reduce((total, deposit) => total + deposit.amount, 0);

        console.log('User:', user);
        console.log('Total Balance:', totalBalance);

        res.render('withdrawal', { user, totalBalance });
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).send('Error fetching user data.');
    }
});




// app.get('/userProfile', auth, (req, res) => {
//     res.render("userProfile", { user: req.user });
// });

// app.get('/userProfile', auth, async (req, res) => {
//     try {
//         const user = await Register.findById(req.user._id);
//         const deposits = await Deposit.find({ userId: req.user._id, status: 'Approved' }).sort({ createdAt: -1 });

//         res.render('userProfile', { user, deposits });
//     } catch (error) {
//         console.error('Error fetching user profile:', error);
//         res.status(500).send('Error fetching user profile.');
//     }
// });

// app.get('/userProfile', auth, async (req, res) => {
//     try {
//         const user = await Register.findById(req.user._id);
//         const deposits = await Deposit.find({ userId: req.user._id, status: 'Approved' }).sort({ createdAt: -1 });

//         // Calculate the total balance
//         const totalBalance = deposits.reduce((total, deposit) => total + deposit.amount, 0);

//         res.render('userProfile', { user, deposits, totalBalance });


//     } catch (error) {
//         console.error('Error fetching user profile:', error);
//         res.status(500).send('Error fetching user profile.');
//     }
// });

// app.get('/userProfile', auth, async (req, res) => {
//     try {
//         const user = await Register.findById(req.user._id);
//         const deposits = await Deposit.find({ userId: req.user._id, status: 'Approved' }).sort({ createdAt: -1 });
//         const withdrawals = await Withdrawal.find({ userId: req.user._id }).sort({ createdAt: -1 });

//         const totalBalance = deposits.reduce((total, deposit) => total + deposit.amount, 0);

//         res.render('userProfile', { user, deposits, totalBalance, withdrawals });
//     } catch (error) {
//         console.error('Error fetching user profile:', error);
//         res.status(500).send('Error fetching user profile.');
//     }
// });


app.get('/userProfile', auth, async (req, res) => {
    try {
        const user = await Register.findById(req.user._id);
        const deposits = await Deposit.find({ userId: req.user._id, status: 'Approved' }).sort({ createdAt: -1 });
        const withdrawals = await Withdrawal.find({ userId: req.user._id, status: 'Approved' }).sort({ createdAt: -1 });

        const totalDeposits = deposits.reduce((total, deposit) => total + deposit.amount, 0);
        const totalWithdrawals = withdrawals.reduce((total, withdrawal) => total + withdrawal.amount, 0);
        const totalBalance = totalDeposits - totalWithdrawals;

        res.render('userProfile', { user, deposits, totalBalance, withdrawals });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).send('Error fetching user profile.');
    }
});







// app.get('/teams', (req, res) => {
//     res.render("teams");
// });


app.post('/register', async (req, res) => {
    try {
        const password = req.body.password;
        const cpassword = req.body.confirmpassword;

        // let userID;
        // let existingUser;
        // do {
        //     userID = generateUserID();
        //     existingUser = await Register.findOne({ userid: userID });
        // } while (existingUser);

        // Generate referral link
        // const referralLink = `${req.protocol}://${req.get('host')}/referral/${userid}`;

        if (password === cpassword) {

            const referralLink = `${req.protocol}://${req.get('host')}/referral/${req.body.userid}`;

            const registerEmployee = new Register({
                firstname: req.body.firstname,
                lastname: req.body.lastname,
                email: req.body.email,
                userid: req.body.userid,
                referrallink: referralLink,
                city: req.body.city,
                state: req.body.state,
                bank_account_no: req.body.bank_account_no,
                bank_name: req.body.bank_name,
                ifsc_code: req.body.ifsc_code,
                phone: req.body.phone,
                age: req.body.age,
                gender: req.body.gender,
                password: req.body.password,
                confirmpassword: req.body.confirmpassword
            });

            const token = await registerEmployee.genAuthToken();

            res.cookie("jwt", token, {
                expires: new Date(Date.now() + 600000),
                httpOnly: true
            });

            const saveData = await registerEmployee.save();
            res.status(201).render("index", { user: registerEmployee });
        } else {
            res.send("Password is not matching");
        }
    } catch (error) {
        console.log("Error :", error);
        if (error.code === 11000 && error.keyPattern && error.keyPattern.phone) {
            res.status(400).send("Phone number is already registered");
        } else {
            res.status(400).send(error);
        }
    }
});

app.post('/login', async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;

        const userEmail = await Register.findOne({ email: email });

        if (!userEmail) {
            return res.status(400).send("Invalid Details");
        }

        const isMatch = await bcrypt.compare(password, userEmail.password);

        if (!isMatch) {
            return res.status(400).send("Invalid Details");
        }

        const token = await userEmail.genAuthToken();

        // Set the token as a cookie
        // res.cookie('token', token, { httpOnly: true });

        res.cookie("jwt", token, {
            expires: new Date(Date.now() + 600000),
            httpOnly: true
        });


        res.status(201).render("index", { user: userEmail });
    } catch (error) {
        res.status(400).send(error);
    }
});


// Handle deposit request
app.post('/deposit', auth, upload.single('screenshot'), async (req, res) => {
    try {
        const { amount, username, userid, userpassword } = req.body;
        const screenshot = req.file.path;

        // Validate or process the new fields as necessary
        console.log(`Username: ${username}`);
        console.log(`User ID: ${userid}`);
        console.log(`User Password: ${userpassword}`);

        const newDeposit = new Deposit({
            userId: req.user._id,
            username: username,
            userid: userid,
            userpassword: userpassword,
            amount: amount,
            screenshot: screenshot,
            status: 'Pending'
        });

        await newDeposit.save();
        res.status(201).send('Deposit request submitted successfully.');
    } catch (error) {
        console.error('Error during deposit:', error);
        res.status(500).send('Error processing deposit request.');
    }
});


const cron = require('node-cron');

// Function to update the user's deposit history
const updateDepositHistory = async (depositId) => {
    try {
        const deposit = await Deposit.findById(depositId);

        if (!deposit) {
            console.error('Deposit not found');
            return;
        }

        // Update deposit status to "Completed"
        deposit.status = 'Completed';
        await deposit.save();
        console.log('Deposit status updated to Completed');
    } catch (error) {
        console.error('Error updating deposit status:', error);
    }
};

app.post('/verify-deposit', auth, async (req, res) => {
    try {
        const { depositId } = req.body;
        const deposit = await Deposit.findById(depositId);

        if (!deposit) {
            return res.status(404).send('Deposit not found');
        }

        deposit.status = 'Verified';
        await deposit.save();

        // Schedule a job to update the deposit status after 15 minutes
        cron.schedule('*/15 * * * *', () => {
            updateDepositHistory(depositId);
        }, {
            scheduled: true,
            timezone: "YOUR_TIMEZONE" // Replace with your timezone
        });

        res.status(200).send('Deposit verified successfully.');
    } catch (error) {
        console.error('Error verifying deposit:', error);
        res.status(500).send('Error verifying deposit.');
    }
});

// Route to update deposit status
app.post('/updateDepositStatus', auth, async (req, res) => {
    try {
        const { depositId, status } = req.body;

        // Find the deposit by ID and update the status
        const deposit = await Deposit.findById(depositId);
        if (!deposit) {
            return res.status(404).send('Deposit not found');
        }

        deposit.status = status;
        await deposit.save();

        res.status(200).send('Deposit status updated successfully');
    } catch (error) {
        console.error('Error updating deposit status:', error);
        res.status(500).send('Error updating deposit status');
    }
});



// Handle withdrawal request
// app.get('/withdraw', auth, async (req, res) => {
//     try {
//         const user = await Register.findById(req.user._id);
//         const deposits = await Deposit.find({ userId: req.user._id, status: 'Approved' }).sort({ createdAt: -1 });

//         const totalBalance = deposits.reduce((total, deposit) => total + deposit.amount, 0);

//         console.log('User:', user);
//         console.log('Total Balance:', totalBalance);

//         res.render('withdrawal', { user, totalBalance });
//     } catch (error) {
//         console.error('Error fetching user data:', error);
//         res.status(500).send('Error fetching user data.');
//     }
// });


app.post('/api/withdraw', auth, async (req, res) => {
    try {
        const { amount, userid } = req.body;

        const newWithdrawal = new Withdrawal({
            userId: req.user._id,
            userid: userid,
            amount: amount
        });

        await newWithdrawal.save();
        res.status(201).send('Withdrawal request submitted successfully.');
    } catch (error) {
        console.error('Error during withdrawal:', error);
        res.status(500).send('Error processing withdrawal request.');
    }
});



app.post('/updateWithdrawalStatus', auth, async (req, res) => {
    try {
        const { withdrawalId, status } = req.body;

        const withdrawal = await Withdrawal.findById(withdrawalId);
        if (!withdrawal) {
            return res.status(404).send('Withdrawal not found');
        }

        withdrawal.status = status;
        await withdrawal.save();

        if (status === 'Approved') {
            const user = await Register.findById(withdrawal.userId);
            user.balance -= withdrawal.amount;
            await user.save();
        }

        res.status(200).send('Withdrawal status updated successfully');
    } catch (error) {
        console.error('Error updating withdrawal status:', error);
        res.status(500).send('Error updating withdrawal status');
    }
});




app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});




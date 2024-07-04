const express = require('express');
const app = express();
const path = require('path');
const hbs = require('hbs');
require('dotenv').config();
require('./database/connection');
const Register = require('./models/register');
const Deposit = require('./models/deposit');
const Withdrawal = require('./models/withdrawal');
const Bet = require('./models/bet');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cookieParser = require('cookie-parser');
const auth = require('./middleware/auth');
const fs = require('fs');
const PORT = process.env.PORT || 3000;


hbs.registerHelper('eq', function (a, b) {
    return a === b;
});


// Ensure the uploads directory exists
// const uploadsDir = path.join(__dirname, 'uploads');
// if (!fs.existsSync(uploadsDir)) {
//     fs.mkdirSync(uploadsDir, { recursive: true });
// }


app.use(express.json());
app.use(cookieParser());
// app.use(auth);
app.use(express.urlencoded({ extended: false }));
// console.log('Static files served from:', path.join(__dirname, './public'));
app.use(express.static(path.join(__dirname, "./public")));
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "./templates/views"));

// Multer configuration for file uploads
// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, 'uploads/');
//     },
//     filename: function (req, file, cb) {
//         cb(null, Date.now() + path.extname(file.originalname));
//     }
// });

// const upload = multer({ storage: storage });

// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, uploadsDir);
//     },
//     filename: function (req, file, cb) {
//         cb(null, Date.now() + path.extname(file.originalname));
//     }
// });

// const upload = multer({ storage: storage });

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'uploads',
        format: async (req, file) => 'jpg',
        public_id: (req, file) => Date.now() + path.extname(file.originalname)
    },
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

app.get('/error', (req, res) => {
    res.render("error");
});


app.get('/withdrawal', auth, async (req, res) => {
    try {
        const user = await Register.findById(req.user._id);
        const deposits = await Deposit.find({ userId: req.user._id, status: 'Approved' }).sort({ createdAt: -1 });
        const withdrawals = await Withdrawal.find({ userId: req.user._id, status: 'Approved' }).sort({ createdAt: -1 });
        const bets = await Bet.find({ userId: req.user._id }).sort({ createdAt: -1 });

        const totalDeposits = deposits.reduce((total, deposit) => total + deposit.amount + deposit.bonus, 0);
        const totalWithdrawals = withdrawals.reduce((total, withdrawal) => total + withdrawal.amount, 0);
        const totalBetsProfit = bets.reduce((total, bet) => bet.status === 'Approved' ? total + bet.profit : total, 0);


        // Fetch referred users
        const referredUsers = await Register.find({ referrer: req.user.userid });

        // Calculate total balance and referral income for each referred user
        const referredUsersWithBalance = await Promise.all(referredUsers.map(async (referredUser) => {
            const userDeposits = await Deposit.find({ userId: referredUser._id, status: 'Approved' });
            const userWithdrawals = await Withdrawal.find({ userId: referredUser._id, status: 'Approved' });
            const userBets = await Bet.find({ userId: referredUser._id });

            const userTotalDeposits = userDeposits.reduce((total, deposit) => total + deposit.amount + deposit.bonus, 0);
            const userTotalWithdrawals = userWithdrawals.reduce((total, withdrawal) => total + withdrawal.amount, 0);
            const userTotalBetsProfit = userBets.reduce((total, bet) => bet.status === 'Approved' ? total + bet.profit : total, 0);
            const userTotalBalance = userTotalDeposits - userTotalWithdrawals + userTotalBetsProfit;

            return {
                ...referredUser._doc,
                totalBalance: userTotalBalance,
                status: userTotalBalance > 0 ? 'Active' : 'Not Active'
            };
        }));

        const totalReferralIncome = referredUsersWithBalance.reduce((total, referredUser) => total + (referredUser.totalBalance * 0.1), 0);


        const totalBalance = parseFloat((totalDeposits - totalWithdrawals + totalBetsProfit + totalReferralIncome).toFixed(2));


        // const totalCoins = bets.reduce((total, bet) => total + bet.coins, 0);


        res.render('withdrawal', { user, totalBalance });
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).send('Error fetching user data.');
    }
});


app.get('/bet', auth, async (req, res) => {
    try {
        const user = await Register.findById(req.user._id);
        const deposits = await Deposit.find({ userId: req.user._id, status: 'Approved' }).sort({ createdAt: -1 });
        const withdrawals = await Withdrawal.find({ userId: req.user._id, status: 'Approved' }).sort({ createdAt: -1 });
        const bets = await Bet.find({ userId: req.user._id }).sort({ createdAt: -1 });

        const totalDeposits = deposits.reduce((total, deposit) => total + deposit.amount + deposit.bonus, 0);
        const totalWithdrawals = withdrawals.reduce((total, withdrawal) => total + withdrawal.amount, 0);
        const totalBetsProfit = bets.reduce((total, bet) => bet.status === 'Approved' ? total + bet.profit : total, 0);


        // Fetch referred users
        const referredUsers = await Register.find({ referrer: req.user.userid });

        // Calculate total balance and referral income for each referred user
        const referredUsersWithBalance = await Promise.all(referredUsers.map(async (referredUser) => {
            const userDeposits = await Deposit.find({ userId: referredUser._id, status: 'Approved' });
            const userWithdrawals = await Withdrawal.find({ userId: referredUser._id, status: 'Approved' });
            const userBets = await Bet.find({ userId: referredUser._id });

            const userTotalDeposits = userDeposits.reduce((total, deposit) => total + deposit.amount + deposit.bonus, 0);
            const userTotalWithdrawals = userWithdrawals.reduce((total, withdrawal) => total + withdrawal.amount, 0);
            const userTotalBetsProfit = userBets.reduce((total, bet) => bet.status === 'Approved' ? total + bet.profit : total, 0);
            const userTotalBalance = userTotalDeposits - userTotalWithdrawals + userTotalBetsProfit;

            return {
                ...referredUser._doc,
                totalBalance: userTotalBalance,
                status: userTotalBalance > 0 ? 'Active' : 'Not Active'
            };
        }));

        const totalReferralIncome = referredUsersWithBalance.reduce((total, referredUser) => total + (referredUser.totalBalance * 0.1), 0);


        const totalBalance = parseFloat((totalDeposits - totalWithdrawals + totalBetsProfit + totalReferralIncome).toFixed(2));


        // const totalCoins = bets.reduce((total, bet) => total + bet.coins, 0);


        res.render('bet', { user, totalBalance });
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).send('Error fetching user data.');
    }
});



app.get('/userProfile', auth, async (req, res) => {
    try {
        const user = await Register.findById(req.user._id);
        if (!user) {
            return res.status(404).send('User not found');
        }

        const deposits = await Deposit.find({ userId: req.user._id, status: 'Approved' }).sort({ createdAt: -1 });
        const withdrawals = await Withdrawal.find({ userId: req.user._id, status: 'Approved' }).sort({ createdAt: -1 });
        const bets = await Bet.find({ userId: req.user._id }).sort({ createdAt: -1 });

        const totalDeposits = deposits.reduce((total, deposit) => total + deposit.amount + deposit.bonus, 0);
        const totalWithdrawals = withdrawals.reduce((total, withdrawal) => total + withdrawal.amount, 0);
        const totalBetsProfit = bets.reduce((total, bet) => bet.status === 'Approved' ? total + bet.profit : total, 0);


        // Fetch referred users
        const referredUsers = await Register.find({ referrer: req.user.userid });

        // Calculate total balance and referral income for each referred user
        const referredUsersWithBalance = await Promise.all(referredUsers.map(async (referredUser) => {
            const userDeposits = await Deposit.find({ userId: referredUser._id, status: 'Approved' });
            const userWithdrawals = await Withdrawal.find({ userId: referredUser._id, status: 'Approved' });
            const userBets = await Bet.find({ userId: referredUser._id });

            const userTotalDeposits = userDeposits.reduce((total, deposit) => total + deposit.amount + deposit.bonus, 0);
            const userTotalWithdrawals = userWithdrawals.reduce((total, withdrawal) => total + withdrawal.amount, 0);
            const userTotalBetsProfit = userBets.reduce((total, bet) => bet.status === 'Approved' ? total + bet.profit : total, 0);
            const userTotalBalance = userTotalDeposits - userTotalWithdrawals + userTotalBetsProfit;

            return {
                ...referredUser._doc,
                totalBalance: userTotalBalance,
                status: userTotalBalance > 0 ? 'Active' : 'Not Active'
            };
        }));

        const totalReferralIncome = referredUsersWithBalance.reduce((total, referredUser) => total + (referredUser.totalBalance * 0.1), 0);


        const totalBalance = parseFloat((totalDeposits - totalWithdrawals + totalBetsProfit + totalReferralIncome).toFixed(2));

        // const totalCoins = bets.reduce((total, bet) => total + bet.coins, 0);

        res.render('userProfile', { user, deposits, totalBalance, withdrawals, bets });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).send('Error fetching user profile.');
    }
});


app.get('/transaction', auth, async (req, res) => {
    try {
        const user = await Register.findById(req.user._id);
        const deposits = await Deposit.find({ userId: req.user._id, status: 'Approved' }).sort({ createdAt: -1 });
        const withdrawals = await Withdrawal.find({ userId: req.user._id, status: 'Approved' }).sort({ createdAt: -1 });
        const bets = await Bet.find({ userId: req.user._id }).sort({ createdAt: -1 });

        const totalDeposits = deposits.reduce((total, deposit) => total + deposit.amount + deposit.bonus, 0);
        const totalWithdrawals = withdrawals.reduce((total, withdrawal) => total + withdrawal.amount, 0);
        const totalBetsProfit = bets.reduce((total, bet) => bet.status === 'Approved' ? total + bet.profit : total, 0);
        const totalBalance = totalDeposits - totalWithdrawals + totalBetsProfit;

        const totalTeamIncome = deposits.reduce((total, deposit) => total + deposit.teamIncome, 0);
        const totalLevelIncome = deposits.reduce((total, deposit) => total + deposit.levelIncome, 0);

        // Fetch referred users
        const referredUsers = await Register.find({ referrer: req.user.userid });

        // Calculate total balance and referral income for each referred user
        const referredUsersWithBalance = await Promise.all(referredUsers.map(async (referredUser) => {
            const userDeposits = await Deposit.find({ userId: referredUser._id, status: 'Approved' });
            const userWithdrawals = await Withdrawal.find({ userId: referredUser._id, status: 'Approved' });
            const userBets = await Bet.find({ userId: referredUser._id });

            const userTotalDeposits = userDeposits.reduce((total, deposit) => total + deposit.amount + deposit.bonus, 0);
            const userTotalWithdrawals = userWithdrawals.reduce((total, withdrawal) => total + withdrawal.amount, 0);
            const userTotalBetsProfit = userBets.reduce((total, bet) => bet.status === 'Approved' ? total + bet.profit : total, 0);
            const userTotalBalance = userTotalDeposits - userTotalWithdrawals + userTotalBetsProfit;

            return {
                ...referredUser._doc,
                totalBalance: userTotalBalance,
                status: userTotalBalance > 0 ? 'Active' : 'Not Active'
            };
        }));

        const totalReferralIncome = referredUsersWithBalance.reduce((total, referredUser) => total + (referredUser.totalBalance * 0.1), 0);
        const totalTeam = referredUsers.length;

        res.render('transaction', {
            user, deposits, totalBetsProfit, totalBalance, withdrawals, bets,
            totalReferralIncome, totalTeamIncome, totalLevelIncome, totalTeam,
            referredUsers: referredUsersWithBalance
        });
    } catch (error) {
        console.error('Error fetching history :', error);
        res.status(500).send('Error fetching history.');
    }
});




app.get('/history', auth, async (req, res) => {
    try {
        const user = await Register.findById(req.user._id);
        const deposits = await Deposit.find({ userId: req.user._id, status: 'Approved' }).sort({ createdAt: -1 });
        const withdrawals = await Withdrawal.find({ userId: req.user._id, status: 'Approved' }).sort({ createdAt: -1 });
        const bets = await Bet.find({ userId: req.user._id }).sort({ createdAt: -1 });

        const totalDeposits = deposits.reduce((total, deposit) => total + deposit.amount + deposit.bonus, 0);
        const totalWithdrawals = withdrawals.reduce((total, withdrawal) => total + withdrawal.amount, 0);
        const totalBetsProfit = bets.reduce((total, bet) => bet.status === 'Approved' ? total + bet.profit : total, 0);


        // Fetch referred users
        const referredUsers = await Register.find({ referrer: req.user.userid });

        // Calculate total balance and referral income for each referred user
        const referredUsersWithBalance = await Promise.all(referredUsers.map(async (referredUser) => {
            const userDeposits = await Deposit.find({ userId: referredUser._id, status: 'Approved' });
            const userWithdrawals = await Withdrawal.find({ userId: referredUser._id, status: 'Approved' });
            const userBets = await Bet.find({ userId: referredUser._id });

            const userTotalDeposits = userDeposits.reduce((total, deposit) => total + deposit.amount + deposit.bonus, 0);
            const userTotalWithdrawals = userWithdrawals.reduce((total, withdrawal) => total + withdrawal.amount, 0);
            const userTotalBetsProfit = userBets.reduce((total, bet) => bet.status === 'Approved' ? total + bet.profit : total, 0);
            const userTotalBalance = userTotalDeposits - userTotalWithdrawals + userTotalBetsProfit;

            return {
                ...referredUser._doc,
                totalBalance: userTotalBalance,
                status: userTotalBalance > 0 ? 'Active' : 'Not Active'
            };
        }));

        const totalReferralIncome = referredUsersWithBalance.reduce((total, referredUser) => total + (referredUser.totalBalance * 0.1), 0);

        const totalBalance = parseFloat((totalDeposits - totalWithdrawals + totalBetsProfit + totalReferralIncome).toFixed(2));


        res.render('history', { user, deposits, totalBalance, withdrawals, bets });
    } catch (error) {
        console.error('Error fetching history :', error);
        res.status(500).send('Error fetching history .');
    }
});


app.get('/referral/:userid', async (req, res) => {
    try {
        const referrerId = req.params.userid;
        const referrer = await Register.findOne({ userid: referrerId });

        if (!referrer) {
            return res.status(404).send('Referrer not found');
        }

        // Render the registration page with the referrer ID
        res.render('register', { referrerId: referrerId });
    } catch (error) {
        console.error('Error during referral registration:', error);
        res.status(500).send('Error processing referral link.');
    }
});



app.post('/register', async (req, res) => {
    try {

        // const { password, confirmpassword, referrerId } = req.body;
        const password = req.body.password;
        const cpassword = req.body.confirmpassword;
        const { referrerId } = req.body;


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
                referrer: referrerId,
                // city: req.body.city,
                // state: req.body.state,
                bank_account_no: req.body.bank_account_no,
                bank_name: req.body.bank_name,
                ifsc_code: req.body.ifsc_code,
                phone: req.body.phone,
                // age: req.body.age,
                gender: req.body.gender,
                password: req.body.password,
                confirmpassword: req.body.confirmpassword,
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
            res.status(400).render("error");
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



app.post('/updateBankDetails', auth, async (req, res) => {
    try {
        const userId = req.user._id; // Assuming user ID is stored in req.user
        const { bank_name, bank_account_no, ifsc_code, phone } = req.body;

        const user = await Register.findByIdAndUpdate(userId, {
            bank_name,
            bank_account_no,
            ifsc_code,
            phone
        });

        if (!user) {
            return res.status(404).send('User not found');
        }

        res.status(200).send('Bank details updated successfully');
    } catch (error) {
        console.log("Error updating bank details:", error);
        res.status(500).send('Failed to update bank details');
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

cron.schedule('0 0 * * *', async () => {
    try {
        const pendingDeposits = await Deposit.find({ status: 'Pending' });

        for (const deposit of pendingDeposits) {
            await updateDepositHistory(deposit._id);
        }
    } catch (error) {
        console.error('Error executing cron job:', error);
    }
});


const calculateBonus = (amount) => {
    let bonus = 0;
    if (amount >= 1000 && amount < 2000) {
        bonus = 50;
    } else if (amount >= 2000 && amount < 5000) {
        bonus = 100;
    } else if (amount >= 5000 && amount < 10000) {
        bonus = 250;
    } else if (amount >= 10000 && amount < 20000) {
        bonus = 500;
    } else if (amount >= 20000 && amount < 30000) {
        bonus = 1000;
    } else if (amount >= 30000 && amount <= 50000) {
        bonus = 2000;
    }
    return bonus;
};

app.post('/deposit', auth, upload.single('screenshot'), async (req, res) => {
    try {
        const { amount, username, userid, userpassword, referralIncome, teamIncome, levelIncome, yourTeam } = req.body;
        const screenshot = req.file.path; // This should reference the Cloudinary URL

        // Validate or process the new fields as necessary
        console.log(`Username: ${username}`);
        console.log(`User ID: ${userid}`);
        console.log(`User Password: ${userpassword}`);

        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount)) {
            return res.status(400).send('Invalid amount');
        }

        const bonus = calculateBonus(parsedAmount);

        const newDeposit = new Deposit({
            userId: req.user._id,
            username: username,
            userid: userid,
            userpassword: userpassword,
            amount: parsedAmount,
            bonus: bonus, // Store the calculated bonus
            screenshot: screenshot, // Save the Cloudinary URL here
            status: 'Pending',
            referralIncome: parseFloat(referralIncome) || 0,
            teamIncome: parseFloat(teamIncome) || 0,
            levelIncome: parseFloat(levelIncome) || 0,
            yourTeam: parseFloat(yourTeam) || 0
        });

        await newDeposit.save();
        res.status(201).send('Deposit request submitted successfully.');
    } catch (error) {
        console.error('Error during deposit:', error);
        res.status(500).send('Error processing deposit request.');
    }
});



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


app.post('/api/withdraw', auth, async (req, res) => {
    try {
        const { amount, userid, totalBalance } = req.body;

        if (!amount || !userid || totalBalance === undefined) {
            return res.status(400).send('Missing required fields');
        }

        const newWithdrawal = new Withdrawal({
            userId: req.user._id,
            userid: userid,
            totalBalance: totalBalance,
            // coins: totalCoins,
            amount: amount,
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
            if (user.balance < withdrawal.amount) {
                return res.status(400).send('Insufficient balance to approve withdrawal');
            }
            user.balance -= withdrawal.amount;
            await user.save();
        }

        res.status(200).send('Withdrawal status updated successfully');
    } catch (error) {
        console.error('Error updating withdrawal status:', error);
        res.status(500).send('Error updating withdrawal status');
    }
});



// app.post('/bet', auth, async (req, res) => {
//     try {
//         const { userId } = req.body;
//         const user = await Register.findById(req.user._id);

//         if (!user) {
//             return res.status(400).send('User not found');
//         }

//         const deposits = await Deposit.find({ userId: req.user._id, status: 'Approved' });
//         const withdrawals = await Withdrawal.find({ userId: req.user._id, status: 'Approved' });

//         const totalDeposits = deposits.reduce((total, deposit) => total + deposit.amount, 0);
//         const totalWithdrawals = withdrawals.reduce((total, withdrawal) => total + withdrawal.amount, 0);
//         const balance = totalDeposits - totalWithdrawals;

//         const today = new Date().getDay();
//         const profitRates = {
//             1: 2.20,
//             2: 2.05,
//             3: 2.20,
//             4: 1.27,
//             5: 1.90,
//             6: 2.05,
//             0: 0.00
//         };
//         const profitRate = profitRates[today];
//         const profit = balance * (profitRate / 100);

//         // Corrected totalCoins calculation
//         // const totalCoins = user.coins + 20; // Add 20 coins for each new bet
//         // user.coins = totalCoins;
//         await user.save();

//         const newBet = new Bet({
//             userId: req.user._id,
//             betUserId: userId,
//             balance: balance,
//             profit: profit,
//             status: 'Pending',
//             // coins: 20 // Each bet adds 20 coins
//         });

//         await newBet.save();
//         res.status(201).redirect('/bet');
//     } catch (error) {
//         console.error('Error during bet:', error);
//         res.status(500).send('Error processing bet.');
//     }
// });



app.post('/bet', auth, async (req, res) => {
    try {
        const { userId } = req.body;
        const user = await Register.findById(req.user._id);

        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        // Get the current date and time
        const now = new Date();
        const currentHour = now.getHours();

        // Define the time slots
        const morningStart = new Date(now.setHours(10, 0, 0, 0)); // 10 AM
        const morningEnd = new Date(now.setHours(13, 0, 0, 0)); // 1 PM
        const eveningStart = new Date(now.setHours(18, 0, 0, 0)); // 6 PM
        const eveningEnd = new Date(now.setHours(19, 0, 0, 0)); // 7 PM

        // Define the start of the day to check bets made today
        const startOfDay = new Date(now.setHours(0, 0, 0, 0));
        const endOfDay = new Date(now.setHours(23, 59, 59, 999));

        // Check if the user has already placed a bet in the current time slot
        const existingBets = await Bet.find({
            userId: req.user._id,
            createdAt: { $gte: startOfDay, $lte: endOfDay }
        });

        const hasMorningBet = existingBets.some(bet => bet.createdAt >= morningStart && bet.createdAt < morningEnd);
        const hasEveningBet = existingBets.some(bet => bet.createdAt >= eveningStart && bet.createdAt < eveningEnd);

        // Check if the current bet attempt falls within restricted time slots
        if ((currentHour >= 10 && currentHour < 13 && hasMorningBet) || (currentHour >= 18 && currentHour < 19 && hasEveningBet)) {
            return res.status(400).json({ message: 'You can only place one bet in each time slot.' });
        }

        const deposits = await Deposit.find({ userId: req.user._id, status: 'Approved' });
        const withdrawals = await Withdrawal.find({ userId: req.user._id, status: 'Approved' });

        const totalDeposits = deposits.reduce((total, deposit) => total + deposit.amount, 0);
        const totalWithdrawals = withdrawals.reduce((total, withdrawal) => total + withdrawal.amount, 0);
        const balance = totalDeposits - totalWithdrawals;

        const today = new Date().getDay();
        const profitRates = {
            1: 2.20,
            2: 2.05,
            3: 2.20,
            4: 1.27,
            5: 1.90,
            6: 2.05,
            0: 0.00
        };
        const profitRate = profitRates[today];
        const profit = balance * (profitRate / 100);

        const newBet = new Bet({
            userId: req.user._id,
            betUserId: userId,
            balance: balance,
            profit: profit,
            status: 'Pending'
        });

        await newBet.save();
        res.status(201).json({ message: 'success' });
    } catch (error) {
        console.error('Error during bet:', error);
        res.status(500).send('Error processing bet.');
    }
});



app.post('/updateBetStatus', auth, async (req, res) => {
    try {
        const { betId, status } = req.body;

        // Find the bet by ID and update the status
        const bet = await Bet.findById(betId);
        if (!bet) {
            return res.status(404).send('Bet not found');
        }

        bet.status = status;
        await bet.save();

        if (status === 'Approved') {
            // Update user's balance in Register model
            const user = await Register.findById(bet.userId);
            user.balance += bet.profit;
            await user.save();
        }

        res.status(200).send('Bet status updated successfully');
    } catch (error) {
        console.error('Error updating bet status:', error);
        res.status(500).send('Error updating bet status');
    }
});



app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});



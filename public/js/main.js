const express = require('express');
const app = express();
const path = require('path');
const hbs = require('hbs');
const moment = require('moment-timezone');
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


hbs.registerHelper('formatDecimal', function (number) {
    return number.toFixed(2);
});


hbs.registerHelper('eq', function (a, b) {
    return a === b;
});


const betsData = {
    bets: [
        { score: "0 - 0", profit: "2.20%" },
        { score: "0 - 1", profit: "4.79%" },
        { score: "0 - 2", profit: "2.05%" },
        { score: "0 - 3", profit: "1.41%" },
        { score: "1 - 0", profit: "6.52%" },
        { score: "1 - 1", profit: "10.97%" },
        { score: "Other", profit: "4.00%" },
        { score: "1 - 2", profit: "3.35%" },
        { score: "1 - 3", profit: "2.10%" }
    ]
};




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

app.get('/privacy', (req, res) => {
    res.render("privacy");
});

app.get('/disclaimer', (req, res) => {
    res.render("disclaimer");
});

app.get('/dashboard', (req, res) => {
    res.render("dashboard", { user: req.user });
});

app.get('/betting_dashboard', (req, res) => {
    res.render("betting_dashboard", betsData);
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


        const referredUsers = await Register.find({ referrer: req.user.userid });

        const getReferredUsers = async (users, level) => {
            return Promise.all(users.map(async (user) => {
                const userDeposits = await Deposit.find({ userId: user._id, status: 'Approved' });
                const userWithdrawals = await Withdrawal.find({ userId: user._id, status: 'Approved' });
                const userBets = await Bet.find({ userId: user._id });

                const userTotalDeposits = userDeposits.reduce((total, deposit) => total + deposit.amount + deposit.bonus, 0);
                const userTotalWithdrawals = userWithdrawals.reduce((total, withdrawal) => total + withdrawal.amount, 0);
                const userTotalBetsProfit = userBets.reduce((total, bet) => bet.status === 'Approved' ? total + bet.profit : total, 0);
                const userTotalBalance = parseFloat((userTotalDeposits - userTotalWithdrawals + userTotalBetsProfit).toFixed(2));

                const nextLevelReferredUsers = await Register.find({ referrer: user.userid });
                const nextLevelUsersWithBalance = await getReferredUsers(nextLevelReferredUsers, level + 1);

                return {
                    ...user._doc,
                    totalBalance: userTotalBalance,
                    status: userTotalBalance > 0 ? 'Active' : 'Not Active',
                    level,
                    referredUsers: nextLevelUsersWithBalance,
                    userTotalBetsProfit,
                    firstDepositAmount: userDeposits.length > 0 ? userDeposits[userDeposits.length - 1].amount : 0 // Get the first deposit amount
                };
            }));
        };

        const referredUsersWithBalance = await getReferredUsers(referredUsers, 1);

        const totalReferralIncome = parseFloat((referredUsersWithBalance.reduce((total, referredUser) => total + (referredUser.firstDepositAmount * 0.1), 0)).toFixed(2));

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


        const referredUsers = await Register.find({ referrer: req.user.userid });

        const getReferredUsers = async (users, level) => {
            return Promise.all(users.map(async (user) => {
                const userDeposits = await Deposit.find({ userId: user._id, status: 'Approved' });
                const userWithdrawals = await Withdrawal.find({ userId: user._id, status: 'Approved' });
                const userBets = await Bet.find({ userId: user._id });

                const userTotalDeposits = userDeposits.reduce((total, deposit) => total + deposit.amount + deposit.bonus, 0);
                const userTotalWithdrawals = userWithdrawals.reduce((total, withdrawal) => total + withdrawal.amount, 0);
                const userTotalBetsProfit = userBets.reduce((total, bet) => bet.status === 'Approved' ? total + bet.profit : total, 0);
                const userTotalBalance = parseFloat((userTotalDeposits - userTotalWithdrawals + userTotalBetsProfit).toFixed(2));

                const nextLevelReferredUsers = await Register.find({ referrer: user.userid });
                const nextLevelUsersWithBalance = await getReferredUsers(nextLevelReferredUsers, level + 1);

                return {
                    ...user._doc,
                    totalBalance: userTotalBalance,
                    status: userTotalBalance > 0 ? 'Active' : 'Not Active',
                    level,
                    referredUsers: nextLevelUsersWithBalance,
                    userTotalBetsProfit,
                    firstDepositAmount: userDeposits.length > 0 ? userDeposits[userDeposits.length - 1].amount : 0 // Get the first deposit amount
                };
            }));
        };

        const referredUsersWithBalance = await getReferredUsers(referredUsers, 1);

        const totalReferralIncome = parseFloat((referredUsersWithBalance.reduce((total, referredUser) => total + (referredUser.firstDepositAmount * 0.1), 0)).toFixed(2));

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



        const referredUsers = await Register.find({ referrer: req.user.userid });

        const getReferredUsers = async (users, level) => {
            return Promise.all(users.map(async (user) => {
                const userDeposits = await Deposit.find({ userId: user._id, status: 'Approved' });
                const userWithdrawals = await Withdrawal.find({ userId: user._id, status: 'Approved' });
                const userBets = await Bet.find({ userId: user._id });

                const userTotalDeposits = userDeposits.reduce((total, deposit) => total + deposit.amount + deposit.bonus, 0);
                const userTotalWithdrawals = userWithdrawals.reduce((total, withdrawal) => total + withdrawal.amount, 0);
                const userTotalBetsProfit = userBets.reduce((total, bet) => bet.status === 'Approved' ? total + bet.profit : total, 0);
                const userTotalBalance = parseFloat((userTotalDeposits - userTotalWithdrawals + userTotalBetsProfit).toFixed(2));

                const nextLevelReferredUsers = await Register.find({ referrer: user.userid });
                const nextLevelUsersWithBalance = await getReferredUsers(nextLevelReferredUsers, level + 1);

                return {
                    ...user._doc,
                    totalBalance: userTotalBalance,
                    status: userTotalBalance > 0 ? 'Active' : 'Not Active',
                    level,
                    referredUsers: nextLevelUsersWithBalance,
                    userTotalBetsProfit,
                    firstDepositAmount: userDeposits.length > 0 ? userDeposits[userDeposits.length - 1].amount : 0 // Get the first deposit amount
                };
            }));
        };

        const referredUsersWithBalance = await getReferredUsers(referredUsers, 1);


        const totalReferralIncome = parseFloat((referredUsersWithBalance.reduce((total, referredUser) => total + (referredUser.firstDepositAmount * 0.1), 0)).toFixed(2));


        const totalBalance = parseFloat((totalDeposits - totalWithdrawals + totalBetsProfit + totalReferralIncome).toFixed(2));

        // const totalCoins = bets.reduce((total, bet) => total + bet.coins, 0);

        res.render('userProfile', { user, deposits, totalBalance, withdrawals, bets });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).send('Error fetching user profile.');
    }
});



// app.get('/transaction', auth, async (req, res) => {
//     try {
//         const user = await Register.findById(req.user._id);
//         const deposits = await Deposit.find({ userId: req.user._id, status: 'Approved' }).sort({ createdAt: -1 });
//         const withdrawals = await Withdrawal.find({ userId: req.user._id, status: 'Approved' }).sort({ createdAt: -1 });
//         const bets = await Bet.find({ userId: req.user._id }).sort({ createdAt: -1 });

//         const totalDeposits = deposits.reduce((total, deposit) => total + deposit.amount + deposit.bonus, 0);
//         const totalWithdrawals = withdrawals.reduce((total, withdrawal) => total + withdrawal.amount, 0);
//         const totalBetsProfit = parseFloat((bets.reduce((total, bet) => bet.status === 'Approved' ? total + bet.profit : total, 0)).toFixed(2));

//         const totalBalance = totalDeposits - totalWithdrawals + totalBetsProfit;

//         const totalTeamIncome = parseFloat((deposits.reduce((total, deposit) => total + deposit.teamIncome, 0)).toFixed(2));

//         const referredUsers = await Register.find({ referrer: req.user.userid });

//         // New variable for Today's Profit
//         const today = new Date().toISOString().split('T')[0];
//         let todaysProfit = 0;

//         // New variable for My Profit
//         const myProfit = bets.reduce((total, bet) => {
//             const betDate = new Date(bet.createdAt).toISOString().split('T')[0];
//             return bet.status === 'Approved' && betDate === today ? total + bet.profit : total;
//         }, 0);


//         const getReferredUsers = async (users, level) => {
//             return Promise.all(users.map(async (user) => {
//                 const userDeposits = await Deposit.find({ userId: user._id, status: 'Approved' });
//                 const userWithdrawals = await Withdrawal.find({ userId: user._id, status: 'Approved' });
//                 const userBets = await Bet.find({ userId: user._id });

//                 const userTotalDeposits = userDeposits.reduce((total, deposit) => total + deposit.amount + deposit.bonus, 0);
//                 const userTotalWithdrawals = userWithdrawals.reduce((total, withdrawal) => total + withdrawal.amount, 0);
//                 const userTotalBetsProfit = userBets.reduce((total, bet) => bet.status === 'Approved' ? total + bet.profit : total, 0);
//                 const userTotalBalance = parseFloat((userTotalDeposits - userTotalWithdrawals + userTotalBetsProfit).toFixed(2));

//                 // Calculate Today's Profit
//                 const userTodaysProfit = userBets.reduce((total, bet) => {
//                     const betDate = new Date(bet.createdAt).toISOString().split('T')[0];
//                     return bet.status === 'Approved' && betDate === today ? total + bet.profit : total;
//                 }, 0);
//                 todaysProfit += userTodaysProfit;

//                 const nextLevelReferredUsers = await Register.find({ referrer: user.userid });
//                 const nextLevelUsersWithBalance = await getReferredUsers(nextLevelReferredUsers, level + 1);

//                 return {
//                     ...user._doc,
//                     totalBalance: userTotalBalance,
//                     status: userTotalBalance > 0 ? 'Active' : 'Not Active',
//                     level,
//                     referredUsers: nextLevelUsersWithBalance,
//                     userTotalBetsProfit,
//                     firstDepositAmount: userDeposits.length > 0 ? userDeposits[userDeposits.length - 1].amount : 0 // Get the first deposit amount
//                 };
//             }));
//         };

//         const referredUsersWithBalance = await getReferredUsers(referredUsers, 1);

//         const totalLevelIncome = parseFloat(referredUsersWithBalance.reduce((total, referredUser) => {
//             const level1BetsProfit = referredUser.userTotalBetsProfit * 0.05;
//             const level2BetsProfit = referredUser.referredUsers.reduce((subTotal, user) => subTotal + (user.userTotalBetsProfit * 0.05), 0);
//             return total + level1BetsProfit + level2BetsProfit;
//         }, 0).toFixed(2));


//         const totalReferralIncome = parseFloat((referredUsersWithBalance.reduce((total, referredUser) => total + (referredUser.firstDepositAmount * 0.1), 0)).toFixed(2));
//         const totalTeam = referredUsers.length;

//         // New variable for Team Business
//         const teamBusiness = parseFloat((referredUsersWithBalance.reduce((total, user) => total + user.totalBalance, 0)).toFixed(2));
//         const todaysTeamProfit = parseFloat((todaysProfit).toFixed(2));

//         res.render('transaction', {
//             user, deposits, totalBetsProfit, totalBalance, withdrawals, bets,
//             totalReferralIncome, totalTeamIncome, totalLevelIncome, totalTeam,
//             referredUsers: referredUsersWithBalance,
//             todaysTeamProfit, // Adding today's profit to the response
//             teamBusiness, // Adding team business to the response
//             myProfit: parseFloat(myProfit.toFixed(2))
//         });
//     } catch (error) {
//         console.error('Error fetching history:', error);
//         res.status(500).send('Error fetching history.');
//     }
// });


// app.get('/transaction', auth, async (req, res) => {
//     try {
//         const user = await Register.findById(req.user._id);
//         const deposits = await Deposit.find({ userId: req.user._id, status: 'Approved' }).sort({ createdAt: -1 });
//         const withdrawals = await Withdrawal.find({ userId: req.user._id, status: 'Approved' }).sort({ createdAt: -1 });
//         const bets = await Bet.find({ userId: req.user._id }).sort({ createdAt: -1 });

//         const totalDeposits = deposits.reduce((total, deposit) => total + deposit.amount + deposit.bonus, 0);
//         const totalWithdrawals = withdrawals.reduce((total, withdrawal) => total + withdrawal.amount, 0);
//         const totalBetsProfit = parseFloat((bets.reduce((total, bet) => bet.status === 'Approved' ? total + bet.profit : total, 0)).toFixed(2));

//         const totalBalance = totalDeposits - totalWithdrawals + totalBetsProfit;

//         const totalTeamIncome = parseFloat((deposits.reduce((total, deposit) => total + deposit.teamIncome, 0)).toFixed(2));

//         const referredUsers = await Register.find({ referrer: req.user.userid });

//         const today = new Date().toISOString().split('T')[0];
//         let todaysProfit = 0;

//         const myProfit = bets.reduce((total, bet) => {
//             const betDate = new Date(bet.createdAt).toISOString().split('T')[0];
//             return bet.status === 'Approved' && betDate === today ? total + bet.profit : total;
//         }, 0);

//         let todaysTopup = 0;
//         let totalReferredUsersCount = 0;

//         const getReferredUsers = async (users, level) => {
//             if (level > 5) return [];

//             return Promise.all(users.map(async (user) => {
//                 const userDeposits = await Deposit.find({ userId: user._id, status: 'Approved' });
//                 const userWithdrawals = await Withdrawal.find({ userId: user._id, status: 'Approved' });
//                 const userBets = await Bet.find({ userId: user._id });

//                 const userTotalDeposits = userDeposits.reduce((total, deposit) => total + deposit.amount + deposit.bonus, 0);
//                 const userTotalWithdrawals = userWithdrawals.reduce((total, withdrawal) => total + withdrawal.amount, 0);
//                 const userTotalBetsProfit = userBets.reduce((total, bet) => bet.status === 'Approved' ? total + bet.profit : total, 0);
//                 const userTotalBalance = parseFloat((userTotalDeposits - userTotalWithdrawals + userTotalBetsProfit).toFixed(2));


//                 const userTodaysDeposits = userDeposits.reduce((total, deposit) => {
//                     const depositDate = new Date(deposit.createdAt).toISOString().split('T')[0];
//                     return depositDate === today ? total + deposit.amount : total;
//                 }, 0);
//                 todaysTopup += userTodaysDeposits;


//                 const userTodaysProfit = userBets.reduce((total, bet) => {
//                     const betDate = new Date(bet.createdAt).toISOString().split('T')[0];
//                     return bet.status === 'Approved' && betDate === today ? total + bet.profit : total;
//                 }, 0);
//                 todaysProfit += userTodaysProfit;

//                 const nextLevelReferredUsers = await Register.find({ referrer: user.userid });
//                 const nextLevelUsersWithBalance = await getReferredUsers(nextLevelReferredUsers, level + 1);

//                 totalReferredUsersCount += nextLevelReferredUsers.length;

//                 return {
//                     ...user._doc,
//                     totalBalance: userTotalBalance,
//                     status: userTotalBalance > 0 ? 'Active' : 'Not Active',
//                     level,
//                     referredUsers: nextLevelUsersWithBalance,
//                     userTotalBetsProfit,
//                     firstDepositAmount: userDeposits.length > 0 ? userDeposits[userDeposits.length - 1].amount : 0 // Get the first deposit amount
//                 };
//             }));
//         };

//         totalReferredUsersCount = referredUsers.length;

//         const referredUsersWithBalance = await getReferredUsers(referredUsers, 1);

//         const totalLevelIncome = parseFloat(referredUsersWithBalance.reduce((total, referredUser) => {
//             const level1BetsProfit = referredUser.userTotalBetsProfit * 0.05;
//             const level2BetsProfit = referredUser.referredUsers.reduce((subTotal, user) => subTotal + (user.userTotalBetsProfit * 0.05), 0);
//             const level3BetsProfit = referredUser.referredUsers.reduce((subTotal, user) => subTotal + (user.referredUsers.reduce((subSubTotal, subUser) => subSubTotal + (subUser.userTotalBetsProfit * 0.02), 0)), 0);
//             const level4BetsProfit = referredUser.referredUsers.reduce((subTotal, user) => subTotal + (user.referredUsers.reduce((subSubTotal, subUser) => subSubTotal + (subUser.referredUsers.reduce((subSubSubTotal, subSubUser) => subSubSubTotal + (subSubUser.userTotalBetsProfit * 0.01), 0)), 0)), 0);
//             const level5BetsProfit = referredUser.referredUsers.reduce((subTotal, user) => subTotal + (user.referredUsers.reduce((subSubTotal, subUser) => subSubTotal + (subUser.referredUsers.reduce((subSubSubTotal, subSubUser) => subSubSubTotal + (subSubUser.userTotalBetsProfit * 0.01), 0)), 0)), 0);
//             return total + level1BetsProfit + level2BetsProfit + level3BetsProfit + level4BetsProfit + level5BetsProfit;
//         }, 0).toFixed(2));


//         const totalReferralIncome = parseFloat((referredUsersWithBalance.reduce((total, referredUser) => total + (referredUser.firstDepositAmount * 0.1), 0)).toFixed(2));
//         const totalTeam = totalReferredUsersCount;

//         const teamBusiness = parseFloat((referredUsersWithBalance.reduce((total, user) => total + user.totalBalance, 0)).toFixed(2));
//         const todaysTeamProfit = parseFloat((todaysProfit).toFixed(2));

//         res.render('transaction', {
//             user, deposits, totalBetsProfit, totalBalance, withdrawals, bets,
//             totalReferralIncome, totalTeamIncome, totalLevelIncome, totalTeam,
//             referredUsers: referredUsersWithBalance,
//             todaysTeamProfit,
//             teamBusiness,
//             myProfit: parseFloat(myProfit.toFixed(2)),
//             todaysTopup
//         });
//     } catch (error) {
//         console.error('Error fetching history:', error);
//         res.status(500).send('Error fetching history.');
//     }
// });


app.get('/betHistory', auth, async (req, res) => {
    try {
        const bets = await Bet.find({ userId: req.user._id }).sort({ createdAt: -1 });
        res.render('bet_history', { bets });
    } catch (error) {
        console.error('Error fetching bet history:', error);
        res.status(500).send('Error fetching bet history.');
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
        const totalBetsProfit = parseFloat((bets.reduce((total, bet) => bet.status === 'Approved' ? total + bet.profit : total, 0)).toFixed(2));

        const totalBalance = totalDeposits - totalWithdrawals + totalBetsProfit;

        const totalTeamIncome = parseFloat((deposits.reduce((total, deposit) => total + deposit.teamIncome, 0)).toFixed(2));

        const referredUsers = await Register.find({ referrer: req.user.userid });

        const today = new Date().toISOString().split('T')[0];
        let todaysProfit = 0;

        const myProfit = bets.reduce((total, bet) => {
            const betDate = new Date(bet.createdAt).toISOString().split('T')[0];
            return bet.status === 'Approved' && betDate === today ? total + bet.profit : total;
        }, 0);

        let todaysTopup = 0;
        let totalReferredUsersCount = 0;

        const getReferredUsers = async (users, level) => {
            if (level > 5) return [];

            return Promise.all(users.map(async (user) => {
                const userDeposits = await Deposit.find({ userId: user._id, status: 'Approved' });
                const userWithdrawals = await Withdrawal.find({ userId: user._id, status: 'Approved' });
                const userBets = await Bet.find({ userId: user._id });

                const userTotalDeposits = userDeposits.reduce((total, deposit) => total + deposit.amount + deposit.bonus, 0);
                const userTotalWithdrawals = userWithdrawals.reduce((total, withdrawal) => total + withdrawal.amount, 0);
                const userTotalBetsProfit = userBets.reduce((total, bet) => bet.status === 'Approved' ? total + bet.profit : total, 0);
                const userTotalBalance = parseFloat((userTotalDeposits - userTotalWithdrawals + userTotalBetsProfit).toFixed(2));


                const userTodaysDeposits = userDeposits.reduce((total, deposit) => {
                    const depositDate = new Date(deposit.createdAt).toISOString().split('T')[0];
                    return depositDate === today ? total + deposit.amount : total;
                }, 0);
                todaysTopup += userTodaysDeposits;


                const userTodaysProfit = userBets.reduce((total, bet) => {
                    const betDate = new Date(bet.createdAt).toISOString().split('T')[0];
                    return bet.status === 'Approved' && betDate === today ? total + bet.profit : total;
                }, 0);
                todaysProfit += userTodaysProfit;

                const nextLevelReferredUsers = await Register.find({ referrer: user.userid });
                const nextLevelUsersWithBalance = await getReferredUsers(nextLevelReferredUsers, level + 1);

                totalReferredUsersCount += nextLevelReferredUsers.length;

                return {
                    ...user._doc,
                    totalBalance: userTotalBalance,
                    status: userTotalBalance > 0 ? 'Active' : 'Not Active',
                    level,
                    referredUsers: nextLevelUsersWithBalance,
                    userTotalBetsProfit,
                    firstDepositAmount: userDeposits.length > 0 ? userDeposits[userDeposits.length - 1].amount : 0 // Get the first deposit amount
                };
            }));
        };

        totalReferredUsersCount = referredUsers.length;

        const referredUsersWithBalance = await getReferredUsers(referredUsers, 1);

        const totalLevelIncome = parseFloat(referredUsersWithBalance.reduce((total, referredUser) => {
            const level1BetsProfit = referredUser.userTotalBetsProfit * 0.05;
            const level2BetsProfit = referredUser.referredUsers.reduce((subTotal, user) => subTotal + (user.userTotalBetsProfit * 0.05), 0);
            const level3BetsProfit = referredUser.referredUsers.reduce((subTotal, user) => subTotal + (user.referredUsers.reduce((subSubTotal, subUser) => subSubTotal + (subUser.userTotalBetsProfit * 0.02), 0)), 0);
            const level4BetsProfit = referredUser.referredUsers.reduce((subTotal, user) => subTotal + (user.referredUsers.reduce((subSubTotal, subUser) => subSubTotal + (subUser.referredUsers.reduce((subSubSubTotal, subSubUser) => subSubSubTotal + (subSubUser.userTotalBetsProfit * 0.01), 0)), 0)), 0);
            const level5BetsProfit = referredUser.referredUsers.reduce((subTotal, user) => subTotal + (user.referredUsers.reduce((subSubTotal, subUser) => subSubTotal + (subUser.referredUsers.reduce((subSubSubTotal, subSubUser) => subSubSubTotal + (subSubUser.userTotalBetsProfit * 0.01), 0)), 0)), 0);
            return total + level1BetsProfit + level2BetsProfit + level3BetsProfit + level4BetsProfit + level5BetsProfit;
        }, 0).toFixed(2));


        const totalReferralIncome = parseFloat((referredUsersWithBalance.reduce((total, referredUser) => total + (referredUser.firstDepositAmount * 0.1), 0)).toFixed(2));
        const totalTeam = totalReferredUsersCount;

        // const teamBusiness = parseFloat((referredUsersWithBalance.reduce((total, user) => total + user.totalBalance, 0)).toFixed(2));
        // const todaysTeamProfit = parseFloat((todaysProfit).toFixed(2));

        const calculateTeamBusiness = (users, level) => {
            if (level > 5) return 0;
            return users.reduce((total, user) => {
                return total + user.totalBalance + calculateTeamBusiness(user.referredUsers, level + 1);
            }, 0);
        };

         const calculateTodaysTeamProfit = (users, level) => {
            if (level > 3) return 0;
            return users.reduce((total, user) => {
                return total + user.userTotalBetsProfit + calculateTodaysTeamProfit(user.referredUsers, level + 1);
            }, 0);
        };

        const teamBusiness = parseFloat(calculateTeamBusiness(referredUsersWithBalance, 1).toFixed(2));
        const todaysTeamProfit = parseFloat(calculateTodaysTeamProfit(referredUsersWithBalance, 1).toFixed(2));

        res.render('transaction', {
            user, deposits, totalBetsProfit, totalBalance, withdrawals, bets,
            totalReferralIncome, totalTeamIncome, totalLevelIncome, totalTeam,
            referredUsers: referredUsersWithBalance,
            todaysTeamProfit,
            teamBusiness,
            myProfit: parseFloat(myProfit.toFixed(2)),
            todaysTopup,
            showBetHistoryButton: true
        });
    } catch (error) {
        console.error('Error fetching history:', error);
        res.status(500).send('Error fetching history.');
    }
});



// app.get('/transaction/level', auth, async (req, res) => {
//     try {
//         const { userId, level } = req.query;
//         let referredUsers;

//         if (level === '2') {
//             referredUsers = await Register.find({ referrer: userId });
//         } else if (level === '3') {
//             const level1Users = await Register.find({ referrer: userId });
//             referredUsers = await Promise.all(
//                 level1Users.map(async user => {
//                     return await Register.find({ referrer: user.userid });
//                 })
//             );
//             referredUsers = referredUsers.flat();
//         } else {
//             return res.status(400).send('Invalid level specified');
//         }

//         // Calculate total balance and status for each referred user
//         const referredUsersWithBalance = await Promise.all(referredUsers.map(async (referredUser) => {
//             const userDeposits = await Deposit.find({ userId: referredUser._id, status: 'Approved' });
//             const userWithdrawals = await Withdrawal.find({ userId: referredUser._id, status: 'Approved' });
//             const userBets = await Bet.find({ userId: referredUser._id });

//             const userTotalDeposits = userDeposits.reduce((total, deposit) => total + deposit.amount + deposit.bonus, 0);
//             const userTotalWithdrawals = userWithdrawals.reduce((total, withdrawal) => total + withdrawal.amount, 0);
//             const userTotalBetsProfit = userBets.reduce((total, bet) => bet.status === 'Approved' ? total + bet.profit : total, 0);
//             const userTotalBalance = parseFloat((userTotalDeposits - userTotalWithdrawals + userTotalBetsProfit).toFixed(2));

//             return {
//                 ...referredUser._doc,
//                 totalBalance: userTotalBalance,
//                 status: userTotalBalance > 0 ? 'Active' : 'Not Active'
//             };
//         }));

//         res.render('referredUsers', { referredUsers: referredUsersWithBalance, level });
//     } catch (error) {
//         console.error('Error fetching referred users:', error);
//         res.status(500).send('Error fetching referred users.');
//     }
// });


app.get('/transaction/level', auth, async (req, res) => {
    try {
        const { userId, level } = req.query;
        let referredUsers;

        if (level === '2') {
            referredUsers = await Register.find({ referrer: userId });
        } else if (level === '3' || level === '4' || level === '5') {
            const level1Users = await Register.find({ referrer: userId });
            const level2Users = await Promise.all(level1Users.map(async user => await Register.find({ referrer: user.userid })));
            const level3Users = await Promise.all(level2Users.flat().map(async user => await Register.find({ referrer: user.userid })));
            const level4Users = await Promise.all(level3Users.flat().map(async user => await Register.find({ referrer: user.userid })));
            if (level === '3') {
                referredUsers = level3Users.flat();
            } else if (level === '4') {
                referredUsers = level4Users.flat();
            } else if (level === '5') {
                const level5Users = await Promise.all(level4Users.flat().map(async user => await Register.find({ referrer: user.userid })));
                referredUsers = level5Users.flat();
            }
        } else {
            return res.status(400).send('Invalid level specified');
        }

        const referredUsersWithBalance = await Promise.all(referredUsers.map(async (referredUser) => {
            const userDeposits = await Deposit.find({ userId: referredUser._id, status: 'Approved' });
            const userWithdrawals = await Withdrawal.find({ userId: referredUser._id, status: 'Approved' });
            const userBets = await Bet.find({ userId: referredUser._id });

            const userTotalDeposits = userDeposits.reduce((total, deposit) => total + deposit.amount + deposit.bonus, 0);
            const userTotalWithdrawals = userWithdrawals.reduce((total, withdrawal) => total + withdrawal.amount, 0);
            const userTotalBetsProfit = userBets.reduce((total, bet) => bet.status === 'Approved' ? total + bet.profit : total, 0);
            const userTotalBalance = parseFloat((userTotalDeposits - userTotalWithdrawals + userTotalBetsProfit).toFixed(2));

            return {
                ...referredUser._doc,
                totalBalance: userTotalBalance,
                status: userTotalBalance > 0 ? 'Active' : 'Not Active'
            };
        }));

        res.render('referredUsers', { referredUsers: referredUsersWithBalance, level });
    } catch (error) {
        console.error('Error fetching referred users:', error);
        res.status(500).send('Error fetching referred users.');
    }
});



// app.get('/history', auth, async (req, res) => {
//     try {
//         const user = await Register.findById(req.user._id);
//         const deposits = await Deposit.find({ userId: req.user._id, status: 'Approved' }).sort({ createdAt: -1 });
//         const withdrawals = await Withdrawal.find({ userId: req.user._id, status: 'Approved' }).sort({ createdAt: -1 });
//         const bets = await Bet.find({ userId: req.user._id }).sort({ createdAt: -1 });

//         const totalDeposits = deposits.reduce((total, deposit) => total + deposit.amount + deposit.bonus, 0);
//         const totalWithdrawals = withdrawals.reduce((total, withdrawal) => total + withdrawal.amount, 0);
//         const totalBetsProfit = bets.reduce((total, bet) => bet.status === 'Approved' ? total + bet.profit : total, 0);



//         const referredUsers = await Register.find({ referrer: req.user.userid });

//         const getReferredUsers = async (users, level) => {
//             return Promise.all(users.map(async (user) => {
//                 const userDeposits = await Deposit.find({ userId: user._id, status: 'Approved' });
//                 const userWithdrawals = await Withdrawal.find({ userId: user._id, status: 'Approved' });
//                 const userBets = await Bet.find({ userId: user._id });

//                 const userTotalDeposits = userDeposits.reduce((total, deposit) => total + deposit.amount + deposit.bonus, 0);
//                 const userTotalWithdrawals = userWithdrawals.reduce((total, withdrawal) => total + withdrawal.amount, 0);
//                 const userTotalBetsProfit = userBets.reduce((total, bet) => bet.status === 'Approved' ? total + bet.profit : total, 0);
//                 const userTotalBalance = parseFloat((userTotalDeposits - userTotalWithdrawals + userTotalBetsProfit).toFixed(2));

//                 const nextLevelReferredUsers = await Register.find({ referrer: user.userid });
//                 const nextLevelUsersWithBalance = await getReferredUsers(nextLevelReferredUsers, level + 1);

//                 return {
//                     ...user._doc,
//                     totalBalance: userTotalBalance,
//                     status: userTotalBalance > 0 ? 'Active' : 'Not Active',
//                     level,
//                     referredUsers: nextLevelUsersWithBalance,
//                     userTotalBetsProfit,
//                     firstDepositAmount: userDeposits.length > 0 ? userDeposits[userDeposits.length - 1].amount : 0 // Get the first deposit amount
//                 };
//             }));
//         };

//         const referredUsersWithBalance = await getReferredUsers(referredUsers, 1);

//         const totalReferralIncome = parseFloat((referredUsersWithBalance.reduce((total, referredUser) => total + (referredUser.firstDepositAmount * 0.1), 0)).toFixed(2));

//         const totalBalance = parseFloat((totalDeposits - totalWithdrawals + totalBetsProfit + totalReferralIncome).toFixed(2));


//         res.render('history', { user, deposits, totalBalance, withdrawals, bets });
//     } catch (error) {
//         console.error('Error fetching history :', error);
//         res.status(500).send('Error fetching history .');
//     }
// });


app.get('/history', auth, async (req, res) => {
    try {
        const user = await Register.findById(req.user._id);
        const deposits = await Deposit.find({ userId: req.user._id }).sort({ createdAt: -1 });
        const withdrawals = await Withdrawal.find({ userId: req.user._id }).sort({ createdAt: -1 });
        const bets = await Bet.find({ userId: req.user._id }).sort({ createdAt: -1 });

        const totalDeposits = deposits.reduce((total, deposit) => total + deposit.amount + deposit.bonus, 0);
        const totalWithdrawals = withdrawals.reduce((total, withdrawal) => total + withdrawal.amount, 0);
        const totalBetsProfit = bets.reduce((total, bet) => bet.status === 'Approved' ? total + bet.profit : total, 0);

        const referredUsers = await Register.find({ referrer: req.user.userid });

        const getReferredUsers = async (users, level) => {
            return Promise.all(users.map(async (user) => {
                const userDeposits = await Deposit.find({ userId: user._id, status: 'Approved' });
                const userWithdrawals = await Withdrawal.find({ userId: user._id, status: 'Approved' });
                const userBets = await Bet.find({ userId: user._id });

                const userTotalDeposits = userDeposits.reduce((total, deposit) => total + deposit.amount + deposit.bonus, 0);
                const userTotalWithdrawals = userWithdrawals.reduce((total, withdrawal) => total + withdrawal.amount, 0);
                const userTotalBetsProfit = userBets.reduce((total, bet) => bet.status === 'Approved' ? total + bet.profit : total, 0);
                const userTotalBalance = parseFloat((userTotalDeposits - userTotalWithdrawals + userTotalBetsProfit).toFixed(2));

                const nextLevelReferredUsers = await Register.find({ referrer: user.userid });
                const nextLevelUsersWithBalance = await getReferredUsers(nextLevelReferredUsers, level + 1);

                return {
                    ...user._doc,
                    totalBalance: userTotalBalance,
                    status: userTotalBalance > 0 ? 'Active' : 'Not Active',
                    level,
                    referredUsers: nextLevelUsersWithBalance,
                    userTotalBetsProfit,
                    firstDepositAmount: userDeposits.length > 0 ? userDeposits[userDeposits.length - 1].amount : 0 // Get the first deposit amount
                };
            }));
        };

        const referredUsersWithBalance = await getReferredUsers(referredUsers, 1);

        const totalReferralIncome = parseFloat((referredUsersWithBalance.reduce((total, referredUser) => total + (referredUser.firstDepositAmount * 0.1), 0)).toFixed(2));

        const totalBalance = parseFloat((totalDeposits - totalWithdrawals + totalBetsProfit + totalReferralIncome).toFixed(2));

        res.render('history', { user, deposits, totalBalance, withdrawals, bets });
    } catch (error) {
        console.error('Error fetching history:', error);
        res.status(500).send('Error fetching history.');
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


const generateUserID = async () => {
    const prefix = "GB";
    let userID;
    let existingUser;

    do {
        userID = prefix + Math.floor(1000 + Math.random() * 9000).toString();
        existingUser = await Register.findOne({ userid: userID });
    } while (existingUser);

    return userID;
};


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

            const userID = await generateUserID();

            const referralLink = `${req.protocol}://${req.get('host')}/referral/${userID}`;

            const registerEmployee = new Register({
                firstname: req.body.firstname,
                lastname: req.body.lastname,
                email: req.body.email,
                userid: userID,
                referrallink: referralLink,
                referrer: referrerId,
                // city: req.body.city,
                // state: req.body.state,
                bank_account_no: req.body.bank_account_no,
                bank_name: req.body.bank_name,
                ifsc_code: req.body.ifsc_code,
                phone: req.body.phone,
                // age: req.body.age,
                // gender: req.body.gender,
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
        const { amount, userid, userpassword, referralIncome, teamIncome, levelIncome, yourTeam } = req.body;
        const screenshot = req.file.path; // This should reference the Cloudinary URL

        // Validate or process the new fields as necessary
        // console.log(`Username: ${username}`);
        console.log(`User ID: ${userid}`);
        console.log(`User Password: ${userpassword}`);

        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount)) {
            return res.status(400).send('Invalid amount');
        }

        const bonus = calculateBonus(parsedAmount);

        const newDeposit = new Deposit({
            userId: req.user._id,
            // username: username,
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




// app.post('/bet', auth, async (req, res) => {
//     try {
//         const { userId } = req.body;
//         const user = await Register.findById(req.user._id);

//         if (!user) {
//             return res.status(400).json({ message: 'User not found' });
//         }

//         const deposits = await Deposit.find({ userId: req.user._id, status: 'Approved' });
//         const withdrawals = await Withdrawal.find({ userId: req.user._id, status: 'Approved' });
//         const bets = await Bet.find({ userId: req.user._id }).sort({ createdAt: -1 });

//         const totalDeposits = deposits.reduce((total, deposit) => total + deposit.amount + deposit.bonus, 0);
//         const totalWithdrawals = withdrawals.reduce((total, withdrawal) => total + withdrawal.amount, 0);
//         const totalBetsProfit = bets.reduce((total, bet) => bet.status === 'Approved' ? total + bet.profit : total, 0);

//         // Fetch referred users
//         const referredUsers = await Register.find({ referrer: req.user.userid });

//         // Calculate total balance and referral income for each referred user
//         const referredUsersWithBalance = await Promise.all(referredUsers.map(async (referredUser) => {
//             const userDeposits = await Deposit.find({ userId: referredUser._id, status: 'Approved' });
//             const userWithdrawals = await Withdrawal.find({ userId: referredUser._id, status: 'Approved' });
//             const userBets = await Bet.find({ userId: referredUser._id });

//             const userTotalDeposits = userDeposits.reduce((total, deposit) => total + deposit.amount + deposit.bonus, 0);
//             const userTotalWithdrawals = userWithdrawals.reduce((total, withdrawal) => total + withdrawal.amount, 0);
//             const userTotalBetsProfit = userBets.reduce((total, bet) => bet.status === 'Approved' ? total + bet.profit : total, 0);
//             const userTotalBalance = userTotalDeposits - userTotalWithdrawals + userTotalBetsProfit;

//             return {
//                 ...referredUser._doc,
//                 totalBalance: userTotalBalance,
//                 status: userTotalBalance > 0 ? 'Active' : 'Not Active'
//             };
//         }));

//         const totalReferralIncome = referredUsersWithBalance.reduce((total, referredUser) => total + (referredUser.totalBalance * 0.1), 0);

//         const balance = parseFloat((totalDeposits - totalWithdrawals + totalBetsProfit + totalReferralIncome).toFixed(2));

//         const today = new Date().getDay();
//         const profitRates = {
//             1: 2.10,
//             2: 2.20,
//             3: 2.05,
//             4: 2.05,
//             5: 2.10,
//             6: 2.05,
//             0: 0.00
//         };
//         const profitRate = profitRates[today];
//         const profit = balance * (profitRate / 100);

//         const newBet = new Bet({
//             userId: req.user._id,
//             betUserId: userId,
//             balance: balance,
//             profit: profit,
//             status: 'Pending'
//         });

//         await newBet.save();
//         res.status(201).redirect('/bet');
//     } catch (error) {
//         console.error('Error during bet:', error);
//         res.status(500).send('Error processing bet.');
//     }
// });





// app.post('/updateBetStatus', auth, async (req, res) => {
//     try {
//         const { betId, status } = req.body;

//         // Find the bet by ID and update the status
//         const bet = await Bet.findById(betId);
//         if (!bet) {
//             return res.status(404).send('Bet not found');
//         }

//         bet.status = status;
//         await bet.save();

//         if (status === 'Approved') {
//             // Update user's balance in Register model
//             const user = await Register.findById(bet.userId);
//             user.balance += bet.profit;
//             await user.save();
//         }

//         res.status(200).send('Bet status updated successfully');
//     } catch (error) {
//         console.error('Error updating bet status:', error);
//         res.status(500).send('Error updating bet status');
//     }
// });

// Function to approve bets and update user balance
const updateBets = async (timeSlot) => {
    try {
        const bets = await Bet.find({ timeSlot, status: 'Pending' });

        for (const bet of bets) {
            bet.status = 'Approved';
            await bet.save();

            const user = await Register.findById(bet.userId);
            user.balance += bet.profit;
            await user.save();
        }

        console.log(`${timeSlot.charAt(0).toUpperCase() + timeSlot.slice(1)} bets updated successfully.`);
    } catch (error) {
        console.error(`Error updating ${timeSlot} bets:`, error);
    }
};

// Schedule for morning bets at 1 PM
cron.schedule('0 13 * * *', () => {
    console.log('Running cron job for morning bets at 1 PM');
    updateBets('morning');
}, {
    timezone: 'Asia/Kolkata' // Ensure the correct timezone
});

// Schedule for evening bets at 7 PM
cron.schedule('0 19 * * *', () => {
    console.log('Running cron job for evening bets at 7 PM');
    updateBets('evening');
}, {
    timezone: 'Asia/Kolkata' // Ensure the correct timezone
});



app.post('/bet', auth, async (req, res) => {
    try {
        const { userId } = req.body;
        const user = await Register.findById(req.user._id);

        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }


        const now = moment().tz('Asia/Kolkata');
        const currentHour = now.hour();
        let timeSlot;

        if (currentHour >= 10 && currentHour < 13) {
            timeSlot = 'morning';
        } else if (currentHour >= 18 && currentHour < 19) {
            timeSlot = 'evening';
        } else {
            return res.status(400).json({ message: 'Betting is allowed only between 10 AM to 1 PM and 6 PM to 7 PM' });
        }


        const existingBet = await Bet.findOne({
            userId: req.user._id,
            timeSlot,
            createdAt: {
                $gte: now.clone().startOf('day').toDate(),
                $lt: now.clone().endOf('day').toDate()
            }
        });

        if (existingBet) {
            return res.status(400).json({ message: 'You have already placed a bet in this time slot 🛑', balance: 0 });
        }

        const deposits = await Deposit.find({ userId: req.user._id, status: 'Approved' });
        const withdrawals = await Withdrawal.find({ userId: req.user._id, status: 'Approved' });
        const bets = await Bet.find({ userId: req.user._id }).sort({ createdAt: -1 });

        const totalDeposits = deposits.reduce((total, deposit) => total + deposit.amount + deposit.bonus, 0);
        const totalWithdrawals = withdrawals.reduce((total, withdrawal) => total + withdrawal.amount, 0);
        const totalBetsProfit = bets.reduce((total, bet) => bet.status === 'Approved' ? total + bet.profit : total, 0);


        const referredUsers = await Register.find({ referrer: req.user.userid });

        const getReferredUsers = async (users, level) => {
            return Promise.all(users.map(async (user) => {
                const userDeposits = await Deposit.find({ userId: user._id, status: 'Approved' });
                const userWithdrawals = await Withdrawal.find({ userId: user._id, status: 'Approved' });
                const userBets = await Bet.find({ userId: user._id });

                const userTotalDeposits = userDeposits.reduce((total, deposit) => total + deposit.amount + deposit.bonus, 0);
                const userTotalWithdrawals = userWithdrawals.reduce((total, withdrawal) => total + withdrawal.amount, 0);
                const userTotalBetsProfit = userBets.reduce((total, bet) => bet.status === 'Approved' ? total + bet.profit : total, 0);
                const userTotalBalance = parseFloat((userTotalDeposits - userTotalWithdrawals + userTotalBetsProfit).toFixed(2));

                const nextLevelReferredUsers = await Register.find({ referrer: user.userid });
                const nextLevelUsersWithBalance = await getReferredUsers(nextLevelReferredUsers, level + 1);

                return {
                    ...user._doc,
                    totalBalance: userTotalBalance,
                    status: userTotalBalance > 0 ? 'Active' : 'Not Active',
                    level,
                    referredUsers: nextLevelUsersWithBalance,
                    userTotalBetsProfit,
                    firstDepositAmount: userDeposits.length > 0 ? userDeposits[userDeposits.length - 1].amount : 0 // Get the first deposit amount
                };
            }));
        };

        const referredUsersWithBalance = await getReferredUsers(referredUsers, 1);
        const totalReferralIncome = parseFloat((referredUsersWithBalance.reduce((total, referredUser) => total + (referredUser.firstDepositAmount * 0.1), 0)).toFixed(2));

        const balance = parseFloat((totalDeposits - totalWithdrawals + totalBetsProfit + totalReferralIncome).toFixed(2));

        const today = now.day();
        const profitRates = {
            1: 2.10,
            2: 2.20,
            3: 2.05,
            4: 2.05,
            5: 2.10,
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
            status: 'Pending',
            timeSlot
        });

        await newBet.save();

        user.balance = 0;
        await user.save();

        res.status(201).json({ message: 'Bet placed successfully', balance: 0 });
    } catch (error) {
        console.error('Error during bet:', error);
        res.status(500).send('Error processing bet.');
    }
});



app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});



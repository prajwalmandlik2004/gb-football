const mongoose = require('mongoose');

const depositSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Register',
        required: true
    },
    username: {
        type: String,
        required: true
    },
    userid: {
        type: String,
        required: true,
        validate(value) {
            if (!/^GB\d{4}$/.test(value)) {
                throw new Error("User ID must start with 'GB' followed by four digits (e.g., GB2389)");
            }
        }
    },
    userpassword: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    screenshot: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Deposit = mongoose.model('Deposit', depositSchema);

module.exports = Deposit;





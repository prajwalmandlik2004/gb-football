// models/withdrawal.js
const mongoose = require('mongoose');

const withdrawalSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Register'
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
    totalBalance: {
        type: Number,
        required: true
    },
    coins: {
        type: Number,
        default: 0 // Add default value for coins
    },
    amount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        required: true,
        enum: ['pending', 'approved'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Withdrawal = mongoose.model('Withdrawal', withdrawalSchema);

module.exports = Withdrawal;


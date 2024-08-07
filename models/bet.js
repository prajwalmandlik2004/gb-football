// models/bet.js
const mongoose = require('mongoose');

const betSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Register',
        required: true
    },
    betUserId: {
        type: String,
        required: true
    },
    balance: {
        type: Number,
        required: true
    },
    profit: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        default: 'Pending'
    },
    timeSlot: {
        type: String,
        enum: ['morning', 'evening'],
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Bet = mongoose.model('Bet', betSchema);

module.exports = Bet;



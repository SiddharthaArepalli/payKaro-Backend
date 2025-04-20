const express = require("express")
const { authMiddleware } = require("../middleware")
const { Account, User } = require("../db") // Added User to fetch recipient details
const { default: mongoose } = require("mongoose")

const router = express.Router()

router.get('/balance', authMiddleware, async (req, res) => {
    try {
        console.log("User ID from authMiddleware:", req.userId); // Debugging log
        if (!req.userId) {
            return res.status(400).json({
                message: "User ID is missing. Please check authMiddleware."
            });
        }

        const account = await Account.findOne({
            userId: req.userId
        });

        if (!account) {
            console.log("Account not found for userId:", req.userId); // Debugging log
            return res.status(404).json({
                message: "Account not found"
            });
        }

        res.json({
            balance: account.balance
        });
    } catch (error) {
        console.error("Error while checking balance:", error); // Debugging log
        res.status(500).json({
            message: "Error while checking balance",
            error: error.message
        });
    }
});

router.post("/transfer", authMiddleware, async (req, res) => {
    const session = await mongoose.startSession();

    session.startTransaction();
    const { amount, to } = req.body;

    const account = await Account.findOne({
        userId: req.userId
    }).session(session);

    if (!account || amount > account.balance) {
        await session.abortTransaction();
        return res.status(400).json({
            message: "insufficient balance"
        });
    }

    const toaccount = await Account.findOne({
        userId: to
    }).session(session);

    if (!toaccount) {
        await session.abortTransaction();
        return res.status(400).json({
            message: "invalid Account"
        });
    }

    const recipient = await User.findOne({ _id: to }); // Fetch recipient details

    await Account.updateOne({
        userId: req.userId
    }, {
        $inc: {
            balance: -amount
        }
    }).session(session);

    await Account.updateOne({
        userId: to
    }, {
        $inc: {
            balance: amount
        }
    }).session(session);

    await session.commitTransaction();

    res.json({
        message: `Rupees ${amount} has been transferred to ${recipient.firstName}`
    });
});

module.exports = router
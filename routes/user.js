const express = require("express");
const zod = require("zod");
const { User, Account } = require("../db");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config"); // Ensure this matches the export
const bcrypt = require("bcrypt");
const router = express.Router();
const { authMiddleware } = require("../middleware");

// Signup Schema
const signUpSchema = zod.object({
    username: zod.string().email({ message: "Invalid email format" }),
    password: zod.string().min(6, { message: "Password must be at least 6 characters long" }),
    firstName: zod.string().min(1, { message: "First name is required" }),
    lastName: zod.string().min(1, { message: "Last name is required" }),
});

router.post('/signup', async (req, res) => {
    try {
        const { success, data, error } = signUpSchema.safeParse(req.body);

        if (!success) {
            console.error("Validation error:", error.errors); // Log validation errors
            return res.status(400).json({
                message: "Invalid input",
                error: error.errors,
            });
        }

        const existingUser = await User.findOne({ username: data.username });
        if (existingUser) {
            console.warn("Email already taken:", data.username); // Log duplicate email
            return res.status(409).json({
                message: "Email already taken",
            });
        }

        const hashedPassword = await bcrypt.hash(data.password, 10);
        const dbUser = await User.create({
            ...data,
            password: hashedPassword,
        });

        console.log("User created successfully:", dbUser); // Log successful user creation

        const userId = dbUser._id;
        await Account.create({
            userId,
            balance: 1 + Math.random() * 10000,
        });

        const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: "1h" });
        res.json({
            message: "User created successfully",
            token,
        });
    } catch (err) {
        console.error("Error during signup:", err); // Log unexpected errors
        res.status(500).json({
            message: "Internal server error",
            error: err.message,
        });
    }
});

// Signin Schema
const signinBody = zod.object({
    username: zod.string().email({ message: "Invalid email format" }),
    password: zod.string(),
});

router.post('/signin', async (req, res) => {
    const { success, data, error } = signinBody.safeParse(req.body);

    if (!success) {
        return res.status(400).json({
            message: "Invalid input",
            error: error.errors,
        });
    }

    const user = await User.findOne({ username: data.username });
    if (!user || !(await bcrypt.compare(data.password, user.password))) { // Compare hashed passwords
        return res.status(401).json({
            message: "Invalid username or password",
        });
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "1h" }); // Ensure JWT_SECRET is defined
    res.json({ token });
});

// Update Schema
const updateBody = zod.object({
    password: zod.string().min(6).optional(),
    firstName: zod.string().optional(),
    lastName: zod.string().optional(),
});

router.put("/", authMiddleware, async (req, res) => {
    const { success, data, error } = updateBody.safeParse(req.body);

    if (!success) {
        return res.status(400).json({
            message: "Invalid input",
            error: error.errors,
        });
    }

    const updates = { ...data };
    if (updates.password) {
        updates.password = await bcrypt.hash(updates.password, 10); // Hash the new password
    }

    await User.updateOne({ _id: req.userId }, updates);
    res.json({ message: "Updated successfully" });
});

router.get('/bulk', async (req, res) => {
    const filter = req.query.filter || "";

    const users = await User.find({
        $or: [
            { firstName: { $regex: filter, $options: "i" } },
            { lastName: { $regex: filter, $options: "i" } },
        ],
    });

    res.json({
        users: users.map(user => ({
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            _id: user._id,
        })),
    });
});

module.exports = router;
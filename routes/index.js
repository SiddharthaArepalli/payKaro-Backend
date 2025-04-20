const express = require('express')
const userRouter = require('./user')
const accountRouter = require('./account');
const { authMiddleware } = require('../middleware');
const router = express.Router();

router.use("/user",userRouter)
router.use("/account",authMiddleware,accountRouter)

module.exports = router
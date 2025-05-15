const express = require('express')
const RegisterController = require('./../Controllers/RegisterController')
const router = express.Router()

router.route('/Register').post(RegisterController.registerUser)
router.route('/login').post(RegisterController.login)
module.exports = router
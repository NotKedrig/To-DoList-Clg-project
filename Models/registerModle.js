const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const userSchema = new mongoose.Schema({
    email: {
        type: String,

        required: true,
        unique: true,
        lowercase: true,
        validate: [validator.isEmail]
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
    },
    passwordConfirm: {
        type: String,
        validate: {
            validator: function (el) {
                return el === this.password
            },
            message: 'the passwords are not same'
        }
    }
})

userSchema.pre('save', async function (next) {
    // only run this if the password was actually modified
    if (!this.isModified('password')) return next()
    this.password = await bcrypt.hash(this.password, 12)
    this.passwordConfirm = undefined
    next()
})

userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword)
}

const Fields = mongoose.model('Fields', userSchema)

module.exports = Fields
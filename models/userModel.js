const mongoose = require( 'mongoose' );
const UserSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        minlength : 2,
        maxlength : 30
    },
    lastName: {
        type: String,
        required: true,
        minlength : 2,
        maxlength : 30
    },
    email: {
        type: String,
        required: true,
    },
    birthday: {
        type: Date,
        required: true,
    },
    password: {
        type: String,
        required: true,
    }
});

const User = mongoose.model( 'users', UserSchema );

const UserModel = {
    createUser : function( newUser ){
        return User.create( newUser );
    },
    getUserByEmail : function( email ){
        return User.findOne({ email });
    }
};

module.exports = {UserModel};
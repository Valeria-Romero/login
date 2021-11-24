const express = require("express");
const bcrypt = require( 'bcrypt' );
const mongoose = require("mongoose");
const session = require("express-session");
const flash = require("express-flash");

mongoose.connect("mongodb://localhost/credentials_db");

const {UserModel} = require( './models/userModel' );
const app = express();

app.set("views", __dirname + "/views");
app.set("view engine", "ejs");

app.use(flash());
app.use( express.urlencoded({extended:true}) );
app.use(session({
    secret: "credentials",
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60000 * 20 }
}));


function validateEmail(email) {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}
// ROUTES 

app.get("/", function(request, response){
    response.render("index");
});

app.post( '/register', function( request, response){
    const firstName = request.body.firstName;
    const lastName = request.body.lastName;
    const email = request.body.email;
    const birthday = new Date(request.body.birthday);
    const password = request.body.password;
    const confirmPass = request.body.confirm_password;


    if(firstName === null || lastName === null || email === null || password === null || confirmPass === null || birthday == "Invalid Date" || firstName.length < 2 || lastName.length < 2 || !validateEmail(email) || password !== confirmPass){
        
        console.log("first",firstName, "last",lastName, "email",email, "birth",birthday, "pass",password, "confirm",confirmPass);
        if(firstName === null || lastName === null || email === null || password === null || confirmPass === null || birthday == "Invalid Date"){
            request.flash('registration', 'You can not leave empty spaces');
        }
        else{
            if(firstName.length < 2 || lastName.length < 2){
                request.flash('length', 'First name and last name can not be less than 2 characters');
            }
    
            if(!validateEmail(email)){
                request.flash('email', 'invalid email');
            }

            if(password !== confirmPass){
                request.flash('password', "The passwords didn't match");
            }
        }
        response.redirect('/');
    }

    else{
        bcrypt.hash( password, 10 )
        .then( encryptedPassword =>{
            const newUser = {
                firstName,
                lastName,
                email,
                birthday,
                password : encryptedPassword
            };
            UserModel
                .createUser( newUser )
                .then( result =>{
                    request.session.firstName = result.firstName;
                    request.session.lastName = result.lastName;
                    request.session.email = result.email;
                    response.redirect( '/dashboard' )
                })
                .catch( err =>{
                    console.log(err);
                    console.log("Error in registration");
                })
        })
    }
});


app.post( '/login', function(request, response){
    const email = request.body.email;
    const password = request.body.password;

    if(email === '' || password === ''){
        request.flash('login', 'You leaved a empty space')
        response.redirect( '/' );
    }

    else{
        UserModel
            .getUserByEmail( email )
            .then( result => {
                console.log( "Result", result );
                if( result === null ){
                    request.flash( 'user', "Invalid user!" );
                }

                bcrypt.compare( password, result.password )
                    .then( flag => {
                        if( !flag ){
                            request.flash( 'wrongpassword', "Wrong Password!" );
                            throw new Error( "Wrong Password!" );
                        }
                        request.session.firstName = result.firstName;
                        request.session.lastName = result.lastName;
                        request.session.email = result.email;
                        console.log(flag);
                        response.redirect( '/dashboard' );
                    })
                    .catch( error => {
                        response.redirect( '/' );
                    }); 
            })
            .catch( error => {
                response.redirect( '/' );
            });
    }
});

app.get( '/dashboard', function( request, response ){
    if( request.session.email === undefined){
        response.redirect( '/' );
    }
    else{
        let currentUser ={
            firstName: request.session.firstName,
            lastName: request.session.lastName
        }
        response.render( 'dashboard', {user: currentUser} );
            
    }
});

app.post( '/logout', function( request, response ){
    request.session.destroy();
    response.redirect( '/' ); 
});

// ---------------------------------------------------

app.listen( 8080, function(){
    console.log( "The users server is running in port 8080." );
});

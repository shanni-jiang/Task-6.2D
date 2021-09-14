const mongoose = require('mongoose');
const validator=require('validator');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

const Member = new Schema({ country:{type:String,required:true},
    fname:{type:String,required:true},
    lname:{type:String,required:true},
    email:{type:String,unique:true,
           validate(value){
        if (!validator.isEmail(value))
        {throw new Error('The email is not valid!')}
    }},
    password:{type:String,minlength:8,required:true},
    cpassword:{
        type:String,
        minlength:8,
        required:true,
        validate(value){
            if (!(value==this.password))
            {throw new Error('Two password is not the same!')}

        }
    },
    address:{type:String,required:true},
    city:{type:String,required:true},
    state:{type:String,required:true},
    zip:String,
    telephone:String,
    username:String
});

Member.plugin(passportLocalMongoose,{
    usernameField : "email"});

module.exports = mongoose.model('Member', Member);

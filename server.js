//import AlipayFormData from 'alipay-sdk/lib/form'
/**
 * 支付接口
 * @type {createApplication}
 */
const express=require("express")
const bodyParser=require("body-parser")
const https=require("https")
const Member = require('./modules/Member')
const mongoose=require("mongoose")
const validator=require("validator")
const bcrypt=require("bcrypt")
const saltRounds=10
const AlipaySdk=require("alipay-sdk").default
const AlipayFormData= require('alipay-sdk/lib/form').default
const fs = require("fs")
const path=require("path")
const request=require("request")
const passPort=require("passport")
//const passPortlocal=require("passport-local")
const GitHubStrategy=require("passport-github2").Strategy;
const LocalStrategy = require('passport-local').Strategy;
const passportLocalMongoose=require("passport-local-mongoose")

const session=require("express-session")
const { response } = require("express")




// const memberSchema = new mongoose.Schema(
//     {
//         country:{type:String,required:true},
//         fname:{type:String,required:true},
//         lname:{type:String,required:true},
//         email:{type:String,unique:true,
//                validate(value){
//             if (!validator.isEmail(value))
//             {throw new Error('The email is not valid!')}
//         }},
//         password:{type:String,minlength:8,required:true},
//         cpassword:{
//             type:String,
//             minlength:8,
//             required:true,
//             validate(value){
//                 if (!(value==this.password))
//                 {throw new Error('Two password is not the same!')}
//                 else{
//                     const saltRounds=10
//                     this.password=bcrypt.hashSync(this.password,saltRounds)
                    
//                 }

//             }
//         },
//         address:{type:String,required:true},
//         city:{type:String,required:true},
//         state:{type:String,required:true},
//         zip:String,
//         telephone:String
//     }
// )

//session
const app=express()
app.use(express.static("public"))

app.use(session({
    cookie:{maxAge:120000},
    resave:false,
    saveUninitialized:false,
    secret:'$$$iServerSecret'
}))
app.use(bodyParser.urlencoded({extended:true}))
app.use(passPort.initialize())
app.use(passPort.session())


//github
passPort.serializeUser(function(user, done) {
    //console.log('here we are in serial')
    done(null, user);
  });
  passPort.deserializeUser(function(user, done) {
    done(null, user);
  });
  passPort.use(new GitHubStrategy({
    clientID: "fab7feeac80209424ec8",
    clientSecret: "36f120cbb008c4a0767d400ff3f4bb754feb21e8",
    callbackURL: "https://aqueous-falls-10564.herokuapp.com/github/callback"
  },
  function(accessToken, refreshToken, profile, done) {
      console.log(profile)
    return done(null, profile);
  }
  ));

//mongoose
mongoose.set('useCreateIndex', true)
mongoose.connect("mongodb+srv://sunnyJ2000:sunny2000@cluster0.tgmnn.mongodb.net/iserverDB?retryWrites=true&w=majority", {useNewUrlParser:true, useUnifiedTopology: true })


passPort.use(new LocalStrategy({
    usernameField: 'email',
    passwordField : 'password'
  },Member.authenticate()));
passPort.serializeUser(Member.serializeUser())
passPort.deserializeUser(Member.deserializeUser())




app.get('/github',
  passPort.authenticate('github', { scope: [ 'user:email' ] }),
  function(req, res){
    // The request will be redirected to GitHub for authentication, so this
    // function will not be called.
    console.log('I am here in github')
    
  });
app.get('/github/callback',passPort.authenticate('github', { failureRedirect: '/' }),
function(req, res) {
  console.log('I am here!');
  res.redirect('/home');
  
});
app.get('/register',(req,res)=>{
    
    res.sendFile(__dirname+"/index.html")
})
app.get('/',(req,res)=>{
    res.sendFile(__dirname+"/login.html")

})



app.get('/404',(req,res)=>{
    res.sendFile(__dirname+"/404error.html")
})
app.get('/home',(req,res)=>{
    if(req.isAuthenticated()){
        
        res.sendFile(__dirname+"/home.html")
    }
    else{
        res.redirect('/')
    }
})
app.get('/payment',(req,res)=>{
    res.sendFile(__dirname+"/payment.html")
})
app.get('/test', async(req,res)=>{
    const alipaySdk=new AlipaySdk({
        appId:'2021000118614605',
        privateKey:'MIIEogIBAAKCAQEAgozmN5pGiFmR6Mfbp22jHdRmF/WLYSsNjv8Yf9o66BFWAPGwp1hUNPKraS9yKXblwHhDOrEGjKrKJP8A8eYNBTq7vZ18khdE/RaetI5DhfKRxcKMQj4wnHQ49t/Mk6nJESmGZW3BF4bZE2InAAun4HiyZwfD5HE6c4m4Ylp7gdJepDRb/RdGTiHP/lH5DIzmu63aHa3dN5j9X9sxUcfWuefBUJ7kZ7jc60LtuTpWlTrBP6bH1Rtdqji4ABySGlsIiQMq/5HXgmX6P7j9g1p6A3eFkpVoTWxlDGfatUt+3EDfSeoIyXEn0TCLwszhpqorz8CSV57ILfVrLAbeWw5xFQIDAQABAoIBAE7GKFAaxj6WFYXpuq/PZyKjvCru3fh22wqTALx8+Rh5BXUyYU7I7J66YxXoLDG67a1yo9ZxZStSDwG94VsVXnvuUcR7l+QrKFSy5na6dSIJGU7EMo/yKLDvLERDDJV5WLsDXHYtgNrqYmfgzPmpDtZS3gtvUxOwAv4eduTaBjZx1kv9jshfiOL4KqeIazxkiwQGwSVdRaCvjzlmGazktvLaITR5oys8J1vTz3xG4nWwsK8CMoWxllGrPZKrrqmEqv9C+pEaBYfqO3Eg0Bj2NwCRcqElZjk8/EQyVwNuhE6ShjrlHOdk6W4C9w9MD0R9+qDVG1QolVh3hk0ikSNZ58ECgYEAt08Fc6eiUpy9En4VJkbJFDsXUUy/W9QzT6oRlWqg+yTEzriHEEiQe4zKgg03bTWQyn2l8V0E25Z7yf1O8jDpAx/CDEj4tIQ82Q8grm4gSuLFZmDZTVbO1O8CHeTDpxU5Aayj5Jvljy6lRgGKmR4Vvn70iIHHTURhW+9JiKud9vECgYEAtlIBcC1UyGGMHYa+PUPcIM3BWZcWReVUDtJISoeDo5Go37aLzLXRDbkokp3j1VjVUL/zr7ZOKxokrmArvHqQEyyv6to5rB4pUKie+1W91QxnjP1jhi6ccJL3usvYxYIetLlhW5huxtghWAjm4oZblMsHCcGD21zhk4w0T9pkRGUCgYASM0NcT1mbkDppmqEo8sBGRPO0u8UILhKGJ2Gljze6l9T+nW2znTDTQ5Bbx0ooirf8kusmAtFXqCJUVNVA0MBh8gZHR/uBmNudxZW+G+sS5F8rIhSRTDwvAigYpb0TWtUVKHoBWcU6KSx5ve9v8n/AMUTARPpv3ok4IpMPgdKmUQKBgEzsbqToy2O8HIT8q9lnf0Hr7g8huwkEiCG0wUGIyZbCxzCUcYmOkMSsgZzStyT11RK72lIhpftzjVRxSSK9x3n/mb2KE1k2ZJIegu1iMLTqBeqrokkj82df6tvKVAyJKPFxYc1mlB6bY/4jy15597vgqXiJSFvOZXJ+bjfe2f0tAoGAalpWkhZXkTecXt4ezJkJGD1V43or3swpAykDaySVP5AWHs4kCb7BmX8eOn/Ren4oCUlHJ0J83yIafkgDhvIcD9BpcaDh9UTXcYJDZi0/ZK3wZtKZkklNG2Suu7+NxT8qy1gCWpWaAM1F7Bz7rxQtEdRH808kC1c+cB3MdwSQUjE=',
        signType:'RSA2',
        alipayPublicKey:'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA3tuKur3DBKoaglxft4vdvNj56e771sZl6F5ulYuPWxKNt5HuG+9x+SsmHD1kw5qKGXN67dz/BrMa4+Y1XflYHZCjmFtHTIcwR2HDOVYtUyybtOs5Q7lw1flWdZVrfLqPjnOC99yIoIjSux1+ArSQ3ZKc8Mc5XcBD6T+rJssmvyw/zeXuwlFQ4PWK0N6j19BV2e2veodxTonUQtctmghIdiSbA05s26emSr10mlmw5QkidnhAmJiXbbUXj54Fj/lErds+bbBEYTsgfVjWghOxWVfDJS5JKjMVqwEDF2JjmR8t8uqF90vqXIWSzLb/vo3fkgthOIL2DmO5Xnf3AYgoMwIDAQAB',
        gateway:'https://openapi.alipaydev.com/gateway.do',
        timeout:5000,
        camelcase:true
    })
    const formData=new AlipayFormData();
    formData.setMethod('get');
    formData.addField('appID','2021000118614605');
    formData.addField('charset','utf-8');
    formData.addField('signType','RSA2');
    formData.addField('bizContent',{
        outTradeNo:'1631263050014',
        productCode:'FAST_INSTANT_TRADE_PAY',
        totalAmount:'0.01',
        subject:'Payment for VIP attendence',
        body:'If you pay this bill, you can enjoy our VIP service for a month. '
    });
    formData.addField('returnUrl','https://www.baidu.com')

    const result=await alipaySdk.exec(
        'alipay.trade.page.pay',
        {},
        {formData:formData}
    );
    console.log(result);
    res.redirect(result);
    return res.json({status:200,info:'successfully check!',result})





})

app.get('/:tradeNo' ,async(req,res)=>{
    let outTradeNo=req.params.tradeNo;
    if(!outTradeNo){
        return res.json({status:-1,info:"need trade ID!"});
    }
    const alipaySdk=new AlipaySdk({
        appId:'2021000118614605',
        privateKey:'MIIEogIBAAKCAQEAgozmN5pGiFmR6Mfbp22jHdRmF/WLYSsNjv8Yf9o66BFWAPGwp1hUNPKraS9yKXblwHhDOrEGjKrKJP8A8eYNBTq7vZ18khdE/RaetI5DhfKRxcKMQj4wnHQ49t/Mk6nJESmGZW3BF4bZE2InAAun4HiyZwfD5HE6c4m4Ylp7gdJepDRb/RdGTiHP/lH5DIzmu63aHa3dN5j9X9sxUcfWuefBUJ7kZ7jc60LtuTpWlTrBP6bH1Rtdqji4ABySGlsIiQMq/5HXgmX6P7j9g1p6A3eFkpVoTWxlDGfatUt+3EDfSeoIyXEn0TCLwszhpqorz8CSV57ILfVrLAbeWw5xFQIDAQABAoIBAE7GKFAaxj6WFYXpuq/PZyKjvCru3fh22wqTALx8+Rh5BXUyYU7I7J66YxXoLDG67a1yo9ZxZStSDwG94VsVXnvuUcR7l+QrKFSy5na6dSIJGU7EMo/yKLDvLERDDJV5WLsDXHYtgNrqYmfgzPmpDtZS3gtvUxOwAv4eduTaBjZx1kv9jshfiOL4KqeIazxkiwQGwSVdRaCvjzlmGazktvLaITR5oys8J1vTz3xG4nWwsK8CMoWxllGrPZKrrqmEqv9C+pEaBYfqO3Eg0Bj2NwCRcqElZjk8/EQyVwNuhE6ShjrlHOdk6W4C9w9MD0R9+qDVG1QolVh3hk0ikSNZ58ECgYEAt08Fc6eiUpy9En4VJkbJFDsXUUy/W9QzT6oRlWqg+yTEzriHEEiQe4zKgg03bTWQyn2l8V0E25Z7yf1O8jDpAx/CDEj4tIQ82Q8grm4gSuLFZmDZTVbO1O8CHeTDpxU5Aayj5Jvljy6lRgGKmR4Vvn70iIHHTURhW+9JiKud9vECgYEAtlIBcC1UyGGMHYa+PUPcIM3BWZcWReVUDtJISoeDo5Go37aLzLXRDbkokp3j1VjVUL/zr7ZOKxokrmArvHqQEyyv6to5rB4pUKie+1W91QxnjP1jhi6ccJL3usvYxYIetLlhW5huxtghWAjm4oZblMsHCcGD21zhk4w0T9pkRGUCgYASM0NcT1mbkDppmqEo8sBGRPO0u8UILhKGJ2Gljze6l9T+nW2znTDTQ5Bbx0ooirf8kusmAtFXqCJUVNVA0MBh8gZHR/uBmNudxZW+G+sS5F8rIhSRTDwvAigYpb0TWtUVKHoBWcU6KSx5ve9v8n/AMUTARPpv3ok4IpMPgdKmUQKBgEzsbqToy2O8HIT8q9lnf0Hr7g8huwkEiCG0wUGIyZbCxzCUcYmOkMSsgZzStyT11RK72lIhpftzjVRxSSK9x3n/mb2KE1k2ZJIegu1iMLTqBeqrokkj82df6tvKVAyJKPFxYc1mlB6bY/4jy15597vgqXiJSFvOZXJ+bjfe2f0tAoGAalpWkhZXkTecXt4ezJkJGD1V43or3swpAykDaySVP5AWHs4kCb7BmX8eOn/Ren4oCUlHJ0J83yIafkgDhvIcD9BpcaDh9UTXcYJDZi0/ZK3wZtKZkklNG2Suu7+NxT8qy1gCWpWaAM1F7Bz7rxQtEdRH808kC1c+cB3MdwSQUjE=',
        signType:'RSA2',
        alipayPublicKey:'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA3tuKur3DBKoaglxft4vdvNj56e771sZl6F5ulYuPWxKNt5HuG+9x+SsmHD1kw5qKGXN67dz/BrMa4+Y1XflYHZCjmFtHTIcwR2HDOVYtUyybtOs5Q7lw1flWdZVrfLqPjnOC99yIoIjSux1+ArSQ3ZKc8Mc5XcBD6T+rJssmvyw/zeXuwlFQ4PWK0N6j19BV2e2veodxTonUQtctmghIdiSbA05s26emSr10mlmw5QkidnhAmJiXbbUXj54Fj/lErds+bbBEYTsgfVjWghOxWVfDJS5JKjMVqwEDF2JjmR8t8uqF90vqXIWSzLb/vo3fkgthOIL2DmO5Xnf3AYgoMwIDAQAB',
        gateway:'https://openapi.alipaydev.com/gateway.do',
        timeout:5000,
        camelcase:true
    })
    const formData=new AlipayFormData();
    formData.setMethod('get');
    formData.addField('appID','2021000118614605');
    formData.addField('charset','utf-8');
    formData.addField('signType','RSA2');
    formData.addField('bizContent',{
        outTradeNo:outTradeNo,
    });
    const result=await alipaySdk.exec(
        'alipay.trade.page.pay',
        {},
        {formData:formData}
    ).then(result => {
        if(result){
            Request(result,function(error,response,body){
                if(!error&&response.statusCode==200){
                    res.redirect("https://www.baidu.com")
                }
                else{
                    console.log('fail pay')
                }
            })
        }
        else{
            console.log('fail pay')
        }
    }).catch(err=>{
        console.log('fail pay')
    })

})
app.post('/register',(req,res)=>{
    // const firstname=rep.body.first_name
    // const lastname=rep.body.last_name
    // const email=rep.body.email
    
    const member1=new Member(
        {
            country:req.body.country,
            fname:req.body.first_name,
            lname:req.body.last_name,
            email:req.body.email,
            password:req.body.password,
            cpassword:req.body.cpassword,
            address:req.body.address,
            city:req.body.city,
            state:req.body.state,
            zip:req.body.zip,
            telephone:req.body.telephone,
            username:req.body.email
        }
    )

   //  member1.save((err) =>{
    
        
        Member.register(member1,req.body.password,(err,user)=>{
            if(err){
                console.log(err)
                res.redirect('/404')
            }
            else{
                console.log("Successfull!")
                //console.log(user)
                res.redirect('/')
                //passPort.authenticate('local')(req, res , () => {res.redirect('/home')})
             

                //var authenticate = Member.authenticate();

                // authenticate(rep.body.email,rep.body.password,function(err,result){
                //     if(err){
                //         console.log("Something wrong!")
                //     }
                //     else{
                //         console.log(result)
                //         res.redirect('/home')
                //     }

                // })

            }
        })
        // const data={
        //     members:[{
        //         email_address: email,
        //         status : "subscribed",
        //         merge_fields:{
        //             FNAME: firstname,
        //             LNAME:lastname
        //         }
        //     }]
        // }
        // jsonData=JSON.stringify(data)
    
        // const apiKey="8ae0730466af8531a2b77c677e0ef487-us5"
        // const url="https://us5.api.mailchimp.com/3.0/lists/2e356d476e"
        // const options={
        //     method:"POST",
        //     auth:"azi:8ae0730466af8531a2b77c677e0ef487-us5"
        // }
        // const request=https.request(url,options,(response)=>{
        //     response.on("data",(data)=>{
        //         console.log(JSON.parse(data))
    
        //     })
    
    
        // })
        // request.write(jsonData)
        // request.end()
        // console.log(firstname,lastname,email)
        // if(res.statusCode==200){
        //     //res.sendFile(__dirname+"/login.html")
        //     res.redirect('localhost:8080/login')
        // }
        // else{
        //     //res.sendFile(__dirname+"/404error.html")
        //     res.redirect('localhost:8080/404')
        // }
    
     //})

 
})
app.post('/',function(req, res) {
    // If this function gets called, authentication was successful.
    // `req.user` contains the authenticated user.
    passPort.authenticate('local')(req, res , () => {console.log(req.user);res.redirect('/home')})
    // console.log(req.user);
    // req.session.user = req.user;
    // res.redirect('/home')
  });




let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}




app.listen(port,(req,res)=>{
    console.log("Server is running successfully!")
})

//const login=express()
//login.use(bodyParser.urlencoded({extended:true}))

// app.post('/login',(req,res)=>{
//     const email=req.body.email
//     const password=req.body.password
//     const Member =  mongoose.model('Member', memberSchema)
//     Member.find({'email':email},['password'],function(err,docs){
//         if(err){
//             console.log(err)
//             res.redirect('localhost:8080/404')
//         }
//         const hash=docs[0].password
//         //console.log(docs[0].password)
//         bcrypt.compare(password, hash).then(function(result) {
//             if (result == true){
//                 res.redirect('localhost:8080/payment')
//                 console.log("login success!")
//             }
//             else{
//                 console.log("Hash is "+hash)
//                 console.log("Password is "+password)
//                 res.redirect('localhost:8080/404')
//             }
//         });
//     })


// })

// login.listen(8081,(req,res)=>{
//     console.log("Server is running on port 8081")
// })
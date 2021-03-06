var express = require('express')
var bodyParser = require('body-parser')
var app = express()
var http = require("http").Server(app)
var io = require("socket.io")(http)
var request = require("request")
var mongoose = require("mongoose")

app.use(express.static(__dirname))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))

// start server
var server = http.listen(3000, () => {
    console.log('server is listening on port', server.address().port)
})

//url for database
var dbURL = 'mongodb://GoHealthFormData:N83H5hWJZTCa@ds239047.mlab.com:39047/gohealth-interview'

// build model for data structure
var Applicant = mongoose.model('Prospect', {
    first_name: String,
    last_name: String,
    birth_date: String,
    trading_partner_id: String,
    id: String,
    phoneNum: String,
    hasInsurance: Boolean
})

//connect to database service
mongoose.connect(dbURL, (err) => {
    console.log("Mongo DB Connection", err)
})

//store api response
var resultJSON

//store form data
var formDataObj



// post functionality
app.post('/messages', (req, res) => {
    formDataObj = req.body

    //save form data info
    var formApplicant = new Applicant(formDataObj)

    formApplicant.save((err) => {
        if(err)
            sendStatus(500)

        //check coverage status from API if they indicate they have insurance
        if(formDataObj.hasInsurance == "true"){
            checkInsuranceCoverage()
        } else {
            io.emit('infoSaved')
        }

        //send status to browser       
        res.sendStatus(200)
        

    })
   
})



// form the api call, send and handle response
function checkInsuranceCoverage(){
    var options = { method: 'POST',
    url: 'https://apistage.gohealthuc.com:1981/v1/eligibility_demo',
    headers: 
     { authtoken: 'ghLee@12' },
     body: '{"member":{"first_name":"' + 
     formDataObj.first_name + 
     '","last_name":"' + 
     formDataObj.last_name  + 
     '","id":"' + 
     formDataObj.id  + 
     '","birth_date":"'+ 
     formDataObj.birth_date + 
     '"},"provider":{"first_name":"Marty","last_name":"Seeger","npi":"1234567890"},"trading_partner_id":"'+ 
     formDataObj.trading_partner_id  +
     '"}',
    rejectUnauthorized: false };

    //send api request
    request(options, function (error, response, body) {
        if (error) throw new Error(error);
      
        resultJSON = body;

        //send api result to browser client
        io.emit('result', resultJSON)
        console.log(response.statusCode)
    });
}


//Case 1
//body: '{"member":{"first_name":"Marsha","last_name":"Mellow","id":"W213967732","birth_date":"1980-1-20"},"provider":{"first_name":"Marty","last_name":"Seeger","npi":"1234567890"},"trading_partner_id":"aetna"}',
//Case 2
//body: '{"member":{"first_name":"Rita","last_name":"Book","id":"345123987","birth_date":"1991-10-31"},"provider":{"first_name":"Marty","last_name":"Seeger","npi":"1234567890"},"trading_partner_id":"united_health_care"}',
//Case 3
//body: '{"member":{"first_name":"Isabelle","last_name":"Ringing","id":"YGG456123","birth_date":"1976-7-6"},"provider":{"first_name":"Marty","last_name":"Seeger","npi":"1234567890"},"trading_partner_id":"empire_blue_cross_blue_shield"}',
//Case 4
//body: '{"member":{"first_name":"Willie","last_name":"Makit","id":"G987665","birth_date":"1983-12-13"},"provider":{"first_name":"Marty","last_name":"Seeger","npi":"1234567890"},"trading_partner_id":"cigna"}',
//Case 5
//body: '{"member":{"first_name":"Rita","last_name":"Book","id":"345123987","birth_date":"1991-10-31"},"provider":{"first_name":"Marty","last_name":"Seeger","npi":"1234567890"},"trading_partner_id":"united_health_care"}',


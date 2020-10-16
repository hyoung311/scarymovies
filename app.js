var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var twilio = require('twilio');
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var xhr = new XMLHttpRequest();

// Load configuration information from system environment variables.
var TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN,
    TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

// Create an authenticated client to access the Twilio REST API
var client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

//movie parser
//app.use(express.bodyParser());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// render our home page
app.get('/', function(req, res, next) {
  res.render('index');
});

//establish status callbacks
app.post('/status', (request) => {
  console.log(`Message SID ${request.body.MessageSid} has a status of ${request.body.MessageStatus}`);
});


//movie texting

app.post('/movies', (request,response) => {
  console.log(`movieTitle ${request.body.to} has a status of ${request.body.MessageStatus}`);

  var urlAppend = `http://www.omdbapi.com/?apikey=de3309c2&t=${request.body.Body}`;

  function Get(appendUrlTest){
    var Httpreq = new XMLHttpRequest(); // a new request
    Httpreq.open("GET",`http://www.omdbapi.com/?apikey=de3309c2&t=${request.body.Body}`,false);
    Httpreq.send(null);
    return Httpreq.responseText;          
  }
  var jsonTest = JSON.parse(Get(urlAppend));
  var title = jsonTest.Title;
  var year = jsonTest.Year;
  var imdbRating = jsonTest.Ratings[0].Value;
  var rtRating = jsonTest.Ratings[1].Value;

  console.log(`Message To: ${request.To} has a status of ${request.body.MessageStatus}`);
  client.messages
  .create({
    from:TWILIO_PHONE_NUMBER,
    to: '+17208838168',
    body: title +" ("+ year+")\r\n" + "IMDb: " + imdbRating + "\r\nRotten Tomatoes: " + rtRating
  })
  .then(message => console.log(`SID: ${message.sid} and status: ${message.status} -- Copy this MMS SID. How does it look different from an SMS SID?`));
 });

//});
//end of movie scripts


// handle a POST request to send a text message. 
// This is sent via ajax on our home page
// This responds with TwiML embedded in request instead of bin
app.post('/sms', (request, response) => {
  console.log(
    `Incoming message from ${request.body.From}: ${request.body.Body}`
  );
  response.type('text/xml');
  response.send(`
    <Response>
      <Message>TwilioQuest rules</Message>
    </Response>
  `);
});


// handle a POST request to send a text message. 
// This is sent via ajax on our home page
app.post('/message1', function(req, res, next) {
  // Use the REST client to send a text message
  client.messages.create({
    to: req.body.to,
    from: TWILIO_PHONE_NUMBER,
    body: 'TwilioQuest rules'
  }).then(function(message) {
    // When we get a response from Twilio, respond to the HTTP POST request
    res.send(message.sid);
  });
});

//message setup to send MMS
app.post('/message', function(req, res, next) {
  // Use the REST client to send a text message
  client.messages.create({
    from: TWILIO_PHONE_NUMBER,
    to: req.body.to,
    mediaUrl: 'https://static.toiimg.com/thumb/msid-75623021,imgsize-104722,width-800,height-600,resizemode-75/75623021.jpg',
    body: 'here is a weird image'
  })
  .then(message => {
    console.log(
      'Copy this MMS SID. How does it look different from an SMS SID?'
    );
    console.log(`${message.sid}`);
    console.log(`Message SID ${message.sid} has a status of ${message.status}`);
  })
  .catch(error => {
    console.error('Looks like the Twilio API returned an error:');
    console.error(error);
  });

});

// handle a POST request to make an outbound call.
// This is sent via ajax on our home page
app.post('/call', function(req, res, next) {
  // Use the REST client to send a text message
  client.calls.create({
    to: req.body.to,
    from: TWILIO_PHONE_NUMBER,
    url: 'http://demo.twilio.com/docs/voice.xml'
  }).then(function(message) {
    // When we get a response from Twilio, respond to the HTTP POST request
    res.send('Call incoming!');
  });
});

// Create a TwiML document to provide instructions for an outbound call
app.post('/hello', function(req, res, next) {
  // Create a TwiML generator
  var twiml = new twilio.twiml.VoiceResponse();
  // var twiml = new twilio.TwimlResponse();
  twiml.say('Hello there! You have successfully configured a web hook.');
  twiml.say('Good luck on your Twilio quest!', { 
      voice:'woman' 
  });

  // Return an XML response to this request
  res.set('Content-Type','text/xml');
  res.send(twiml.toString());
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;


app.listen(3000, () => {
  console.log('Example app listening at port 3000!');
});
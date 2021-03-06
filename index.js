// Load the twilio module
var twilio = require('twilio'),
    express = require('express'),
    app = express(),
    bodyparser = require('body-parser'),
    Firebase = require('firebase'),
    messageQueue = new Firebase('https://sweatfitness.firebaseio.com/messageQueue'),
    phoneToUser = new Firebase('https://sweatfitness.firebaseio.com/phoneToUser'),
    // Create a new REST API client to make authenticated requests against the
    // twilio back end
    client = new twilio.RestClient('ACd3a9cfaa9b43d32faaa1508c0b8e366a', '2a98480175ada06ff25f6302ac3f32f1');

app.set('port', (process.env.PORT || 5000));

app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});

app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

app.use(bodyparser.json());

app.get('/sendText', function(req, res) {
    var num = req.param('num'),
        msg = req.param('msg');
    console.log('got a GET request to send text to ' + num);
    // Pass in parameters to the REST API using an object literal notation. The
    // REST client will handle authentication and response serialzation for you.
    client.sms.messages.create({
        to:'+1' + num,
        from:'+13126754740',
        body:msg
    }, function(error, message) {
        // The HTTP request to Twilio will run asynchronously. This callback
        // function will be called when a response is received from Twilio
        // The "error" variable will contain error information, if any.
        // If the request was successful, this value will be "falsy"
        if (!error) {
            // The second argument to the callback will contain the information
            // sent back by Twilio for the request. In this case, it is the
            // information about the text messsage you just sent:
            console.log('Success! The SID for this SMS message is:');
            console.log(message.sid);

            console.log('Message sent on:');
            console.log(message.dateCreated);
            res.send('success');
            
        } else {
            console.log('Oops! There was an error.');
            res.send('error');
        }
    });
});

app.get('/respond', function(req, res) {
    var twilio = require('twilio');
    var twiml = new twilio.TwimlResponse();
    var body = req.param('Body');
    var from = req.param('From');
    if (body.toLowerCase().replace(' ', '').indexOf('yes') >= 0) {
        console.log(from);
        phoneToUser.child(from).on("value", function(snapshot) {
            var ownerid = snapshot.val();
            console.log('ownerid: ' + ownerid);
            messageQueue.child(ownerid).once('value', function(snapshot) {
                workouts = snapshot.val();
                console.log(workouts);
                for (var key in workouts) {
                    if (workouts.hasOwnProperty(key)) {
                        var respondTo = workouts[key];
                        console.log('respondTo: ' + respondTo);
                        client.sms.messages.create({
                            to:'+1' + respondTo.from_phone,
                            from: '+13126754740',
                            body: '[SWEAT] ' + respondTo.to_name + ' confirmed your request to workout at ' + respondTo.location + ' on ' + respondTo.date + ', ' + respondTo.at +'. Enjoy your workout!',
                        });
                        break;
                    }
                }
            });
        });
    }
    res.writeHead(200, {'Content-Type': 'text/xml'});
    res.end(twiml.toString());
});


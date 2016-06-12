var twilio_sid = 'AC67d02b69024d1220fa46aed55ca25223',
    auth_token = 'ac69fa692fccfb0f96fb7915c45213b4',
    express = require('express'),
    app = express(),
    bodyparser = require('body-parser'),
    firebase = require('firebase'),
    twilio = require('twilio')(twilio_sid, auth_token); 

// Firebase Ref
var userRef = new Firebase('https://bellacoola.firebaseio.com/settings');

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

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

// Returns whether the Pi is in silence mode by checking the expiration time 
// @param: uid [String]
// @return: isSilent [boolean]
app.get('/isSilent', function(req, res) {
    //var uid = req.query.uid; 
    var uid = 1;
    var piRef = new Firebase('https://bellacoola.firebaseio.com/pi/');
    piRef.child(uid).once('value', function(snapshot) {
        piSetting = snapshot.val();
        if (new Date(piSetting.expiration_time) > new Date()) {
            res.send('true')
        } else {
            res.send('false')
        }
    });
});

app.get('/ringtone', function(req, res) {
    var uid = req.query.uid; 
    var piRef = new Firebase('https://bellacoola.firebaseio.com/ringtone/');
    piRef.child(uid).once('value', function(snapshot) {
        piSetting = snapshot.val();
        res.send(piSetting.ringtone);
    });
});

app.get('/ring', function(req, res) {
    var uid = req.param('uid');
    console.log('got a GET request with uid' + uid);
    var piRef = new Firebase('https://bellacoola.firebaseio.com/pi/');
    var contactPromise = piRef.child(uid).child('contacts').once('value');
    contactPromise.then(function(snapshot){
	return snapshot.val().map(function(number){
	    return twilio.messages.create({
		body: "Bellacoola: Someone is at your door!!",
		to: number,
		from: "+13123131547"
	    });
	});
    }).then(function(list){
	Promise.all(list).then(function(msg){
	    res.send('success!');
	}).catch(function(err){
	    console.log(err);
	});
    });
});

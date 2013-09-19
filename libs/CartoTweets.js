var twitter = require('mtwitter');
var CartoDB = require('cartodb');
require('js-yaml');

try {
    var auth = require('../auth.yml');
} 
catch (e) {
    console.log(e);
    process.exit(1);
}

var client = new CartoDB({user: auth.user, api_key: auth.api_key});

var twit = new twitter({consumer_key: auth.consumer_key,
                        consumer_secret: auth.consumer_secret,
                        access_token_key: auth.access_token_key,
                        access_token_secret: auth.access_token_secret});

client.on('connect', function() {
    console.log("connected");
    
    client.query("SELECT * FROM places", function(err, data) {
        var rows = data.rows;
        var tweets;
        
        for (var i = 0; i < rows.length; i++) {
            var currRow = rows[i];            

            twit.get('search/tweets', {q: currRow.placename}, function(err, item) {                
                var tweets = item.statuses;                

                for (var j = 0; j < tweets.length; j++) {
                    var currentTweet = tweets[j];
                    var tweetText = currentTweet.text;
                    
                    console.log(currRow.placename);
                    
                    var sql = "INSERT INTO posts (the_geom, lat, lon, placename, state, post_text, tweetid) " +
                                    "VALUES(null, {lat}, {lon}, {placename}, {state}, {text}, {tweetid})";
                    var json = {lat: currRow.lat, 
                                lon: currRow.lon, 
                                placename: currRow.placename, 
                                state: currRow.state, 
                                text: tweetText, 
                                tweetid: currentTweet.id};
                    
                    client.query(sql, json , function(err, data) {
                        console.log(tweetText, err);
                    });
                }
            }); 
        }
    });

    // JSON parsed data or error messages are returned

    // chained calls are allowed
    //.query("INSERT INTO places VALUES(1,", function(err, data){});
});


var output = require('fs').createWriteStream('errors111.txt');
client.pipe(output);

client.connect();

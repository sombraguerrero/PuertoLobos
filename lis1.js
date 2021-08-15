const https = require('https');
const fs = require('fs');
const myConsts = require('./myConstants.js');
function getLis1Response() {
	fs.readFile('/var/services/web/webhooks/lis1quotes.txt', 'utf8', function(err, data) {
		var output = data.split('|');
		//console.log(output);
	
	var stan = new Object();
	stan.content = output[Math.floor(Math.random() * output.length)];
	var postString = JSON.stringify(stan);
	try {
		  const discordOptions = {
			hostname: 'discord.com',
			path: `/api/webhooks/${myConsts.PL}`,
			method: 'POST',
			headers: {
			  'Content-Type': 'application/json',
			  'Content-Length': Buffer.byteLength(postString)
			}
		  };

		  const discordReq = https.request(discordOptions, (res) => {
			console.log(`STATUS: ${res.statusCode}`);
			console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
			res.setEncoding('utf8');

			res.on('data', (chunk) => {
			  console.log(`BODY: ${chunk}`);
			});
			res.on('end', () => {
			  console.log('No more data in response.');
			});
		  });

		  discordReq.on('error', (e) => {
			console.error(`problem with request: ${e.message}`);
		  });

		  // Write data to request body
		  discordReq.write(postString);
		  //Since the request method is being used here for the post, we're calling end() manually on both request objects.
		  discordReq.end();
		  console.log(postString);
		}
		catch (e) {
		  console.error(e.message);
		}
	});
}
getLis1Response();

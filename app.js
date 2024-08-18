const fsP = require('fs').promises
const express = require('express')
const app = express()
app.use(express.json())
app.use("/static", express.static('./static/'))


const PORT = process.env.PORT || 5000

const amadeusAPIKey = 'ZMqXzz6tl9Xr7Gl99Xrgd0dSzewHzKov';
const amadeusAPISecret = 'vcGMsy13r0Pc2GsE';

let tokenData;
let accessToken;


async function getToken() {

    console.log("getting token")

    // retrieve access token
    const tokenResponse = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: amadeusAPIKey,
            client_secret: amadeusAPISecret
        })
    });

    tokenData = await tokenResponse.json();
    accessToken = tokenData.access_token;

}


// home page
app.get('/index.html', async (req, res) => {
    // read from index.html file
    let data = await fsP.readFile('./index.html')

    // send html
    res.writeHead(200, { 'Content-Type': 'text/html' }).end(data)
})


// about page
app.get('/aboutus.html', async (req, res) => {
    // read from index.html file
    let data = await fsP.readFile('./aboutus.html')

    // send html
    res.writeHead(200, { 'Content-Type': 'text/html' }).end(data)
})


// personalize page
app.get('/personalize.html', async (req, res) => {
    // read from index.html file
    let data = await fsP.readFile('./personalize.html')

    // send html
    res.writeHead(200, { 'Content-Type': 'text/html' }).end(data)
})


// faq page
app.get('/FAQ.html', async (req, res) => {
    // read from index.html file
    let data = await fsP.readFile('./FAQ.html')

    // send html
    res.writeHead(200, { 'Content-Type': 'text/html' }).end(data)
})


// city page
app.get('/city.html', async (req, res) => {
    // read from index.html file
    let data = await fsP.readFile('./city.html')

    // send html
    res.writeHead(200, { 'Content-Type': 'text/html' }).end(data)
})




// fetch hotels function
app.get('/hotels', async (req, res) => {
    const cityCode = req.query.cityCode;
    const rating = req.query.rating;

    let offersData;
    let offersResponse;


    try {
        // fetch hotels
        offersResponse = await fetch(`https://test.api.amadeus.com/v1/reference-data/locations/hotels/by-city?cityCode=${cityCode}&ratings=${rating}&hotelSource=ALL`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        offersData = await offersResponse.json();


        // check if token has expired
        if (offersData.errors) {
            console.log("token expired, trying again")
            await getToken() // generate new token

            // fetch hotels again
            offersResponse = await fetch(`https://test.api.amadeus.com/v1/reference-data/locations/hotels/by-city?cityCode=${cityCode}&ratings=${rating}&hotelSource=ALL`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            offersData = await offersResponse.json();
        }


        res.json(offersData);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});



// fetch IATA code function
app.get('/IATACode', async (req, res) => {
    const cityName = req.query.cityName;

    let IATAData;
    let IATAResponse;

    try {
        // fetch hotels
        IATAResponse = await fetch(`https://test.api.amadeus.com/v1/reference-data/locations/cities?keyword=${cityName}&max=1`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        IATAData = await IATAResponse.json();



        // check if token has expired
        if (IATAData.errors) {
            console.log("token expired, trying again (IATA)")
            await getToken() // generate new token

            // attempt to fetch IATA code again
            IATAResponse = await fetch(`https://test.api.amadeus.com/v1/reference-data/locations/cities?keyword=${cityName}&max=1`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            IATAData = await IATAResponse.json();
        }


        res.json(IATAData);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});



// open port
app.listen(PORT, (req, res) => console.log(`Port ${PORT} Opened`))
let country;
let city;
let cityCoords;
let IATACode;
let currencyTicker;
let currencySymbol;
let offsetSeconds;
let hotels;
let map;
let hotelMarker;
let placeMarker;
let mapCoords = [];


// to title case function for hotel names
function toTitleCase(str) {
	return str
		.toLowerCase()
		.split(' ')
		.map(word => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
}


// load emergency numbers from json file
async function loadEmergencyNumber() {

	try {
		const response = await fetch('/static/emergencyNumbers.json');
		const data = await response.json();
		document.getElementById('emergency').innerText = `Emergency Number: ${data[country]}`;

	} catch (error) {
		console.error("Error fetching the JSON data:", error);
	}
}



// fetch weather from open weather map
async function loadWeather() {
	let apiKey = 'removed'
	let apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
	let weatherData;


	try {
		const response = await fetch(apiUrl);
		if (!response.ok) {
			alert('Weather failed');
		}

		weatherData = await response.json();

	} catch (error) {
		console.error('Error fetching weather data:', error);
		return;
	}


	console.log(weatherData);

	// get timezone offset from api response
	offsetSeconds = weatherData.timezone;

	// update html to show weather
	const temperature = Math.round(weatherData.main.temp);
	const description = weatherData.weather[0].description;

	document.getElementById("weatherIcon").src = `http://openweathermap.org/img/wn/${weatherData.weather[0].icon}@2x.png`;
	document.getElementById("temperature").innerHTML = `${temperature}°C`;
	document.getElementById("weatherDesc").innerHTML = `${description}`;
}


// calculate current time in city
function getTime() {
	const utcDate = new Date();
	const localDate = new Date(utcDate.getTime() + offsetSeconds * 1000 + utcDate.getTimezoneOffset() * 60000);
	document.getElementById("date").innerHTML = localDate.toLocaleString("en-US", { weekday: 'long', month: 'long', day: 'numeric' });

	updateClock(localDate.getHours(), localDate.getMinutes(), localDate.getSeconds());
}


// fetch currency + languages used in country
async function loadCurrency() {

	let apiUrl = `https://restcountries.com/v3.1/name/${country}`;
	let currency;

	try {
		const response = await fetch(apiUrl);

		currency = await response.json();

	} catch (error) {
		console.error('Error fetching currency data:', error);
		return;
	}
	
	currencyTicker = Object.keys(currency[0]["currencies"])[0];
	currencySymbol = currency[0].currencies[currencyTicker].symbol;

	console.log(currencyTicker, currencySymbol, currency[0].currencies[currencyTicker].name);


	document.getElementById("currencyTicker").innerHTML = currencyTicker;
	document.getElementById("currencySymbol").innerHTML = currencySymbol;
	document.getElementById("currencyName").innerHTML = currency[0].currencies[currencyTicker].name;


	for (const key in currency[0].languages) {
		document.getElementById("languages").innerHTML += currency[0].languages[key] + ", ";
	}
	document.getElementById("languages").innerHTML = document.getElementById("languages").innerHTML.slice(0, -2);
}


// fetch conversion rate
async function loadConversionRate() {
	let apiKey = "removed";
	let conversion;

	// get base currency
	let baseCurrency = document.getElementById("baseCurrency").value;
	console.log("base currency:", baseCurrency);

	apiUrl = `https://v6.exchangerate-api.com/v6/${apiKey}/pair/${baseCurrency}/${currencyTicker}`;


	try {
		const response = await fetch(apiUrl);
		conversion = await response.json();

	} catch (error) {
		console.error('Error converting currencies:', error);
		return;
	}

	// update conversion rate on html
	console.log(conversion);
	document.getElementById("conversionRate").innerHTML = conversion.conversion_rate;
	document.getElementById("conversionSymbol").innerHTML = currencySymbol;
}




// fetch news articles about city
async function loadNews() {
	let apiKey = "removed"
	let apiUrl = `https://api.goperigon.com/v1/all?apiKey=${apiKey}&from=2024-06-01&sourceGroup=top10&showReprints=false&sortBy=date&language=en&title=${city}`
	let articles;

	try {
		const response = await fetch(apiUrl)
		let news = await response.json();
		articles = news.articles;

	} catch (error) {
		console.error('Error fetching news:', error);
		return;
	}


	// populate news row with news cards
	let newsRow = document.getElementById("newsRow")
	document.querySelector('#news h2').innerHTML = `News in ${city}`

	newsRow.innerHTML = "";
	console.log(articles);


	for (let i = 0; i < 6; i++) {
		newsRow.innerHTML +=
			`
		<div class="col-md-4">
			<div class="card">
			<img src="${articles[i].imageUrl}" class="card-img-top">
			<div class="card-body">
				<p class="card-text"><a href="${articles[i].links[0]}">${articles[i].title}</a></p>
			</div>
			</div>
		</div>
		`;
	}
}



// fetch IATA code of given city
async function loadIATACode() {
	try {
		const response = await fetch(`http://localhost:5000/IATACode?cityName=${city}`);
		const data = await response.json();
		console.log(data)

		// fetch IATACode + coordinates
		IATACode = data.data[0].iataCode
		cityCoords = [data.data[0].geoCode.latitude, data.data[0].geoCode.longitude]

		mapCoords.push(cityCoords)
		console.log("IATA:", IATACode)

	} catch (error) {
		console.error('Error:', error);
		return
	}
}



async function loadHotels() {
	// calculate what ratings of hotels the user should be shown
	const ratings = [];
	const minRating = document.querySelector('.rating input:checked').value;
	for (let i = parseInt(minRating); i <= 5; i++) {
		ratings.push(i);
	}

	// fetch hotels
	try {
		const response = await fetch(`http://localhost:5000/hotels?cityCode=${IATACode}&rating=${ratings.join(',')}`);
		const data = await response.json();
		hotels = data.data


	} catch (error) {
		console.error('Error:', error);
		return
	}


	// filter hotels by a 10x10km square
	hotels = hotels.filter(hotel => {
		const hotelLat = hotel.geoCode.latitude;
		const hotelLon = hotel.geoCode.longitude;

		return hotelLat >= cityCoords[0] - 0.1 && hotelLat <= cityCoords[0] + 0.1 && hotelLon >= cityCoords[1] - 0.1 && hotelLon <= cityCoords[1] + 0.1;
	});



	// sort hotels by rating
	hotels.sort((a, b) => b.rating - a.rating);

	// assort hotels to ensure hotels with different ratings are given
	let assortedHotels = []

	if (hotels.length >= 13) {
		let shift = Math.floor(hotels.length / 13);

		for (i = 0; i < shift * 13; i += shift) {
			assortedHotels.push(hotels[i])
		}
	} else {
		hotels = hotels.slice(0, 13)
	}


	console.log(assortedHotels)


	document.getElementById("hotelBody").innerHTML = "";

	// loop through hotels
	assortedHotels.slice(0, 13).forEach((hotel, index) => {

		// add marker to map
		let latLng = [hotel.geoCode.latitude, hotel.geoCode.longitude];
		let marker = L.marker(latLng, { icon: hotelMarker }).addTo(map).bindPopup(toTitleCase(hotel.name));
		mapCoords.push(latLng)

		// add hotel to the table
		let row = document.createElement('tr');
		row.innerHTML = `<td>${toTitleCase(hotel.name)}</td><td>${hotel.rating}</td>`;
		document.getElementById('hotelBody').appendChild(row);

		// when user clicks on table row, focus on that hotel on the map
		row.addEventListener('click', () => {
			map.flyTo(latLng, 15, {
				animate: true,
				duration: 1.5
			});

			marker.openPopup();
		});
	});


	map.fitBounds(mapCoords);
}



async function loadPlaces() {
	let apiKey = "removed";
	let places;

	try {
		// get the city's "place_id"
		const placeIDResponse = await fetch(`https://api.geoapify.com/v1/geocode/search?text=${city}&lang=en&limit=1&type=city&format=json&apiKey=${apiKey}`);
		const placeIDdata = await placeIDResponse.json();
		let placesID = placeIDdata.results[0].place_id;
		console.log("places_id:", placesID);


		// get places in the city (using "place_id")
		const placeResponse = await fetch(`https://api.geoapify.com/v2/places?categories=tourism&filter=place:${placesID}&lang=en&limit=20&apiKey=${apiKey}`);
		const placeData = await placeResponse.json();
		places = placeData.features
		console.log("places:", places);

	} catch (error) {
		console.error('Error loading places:', error);
		return
	}


	// reset places table
	document.getElementById("placeBody").innerHTML = "";

	// loop through places
	places.slice(0, 13).forEach((place, index) => {

		// add marker to map
		let latLng = [place.geometry.coordinates[1], place.geometry.coordinates[0]];
		let marker = L.marker(latLng, { icon: placeMarker }).addTo(map).bindPopup(place.properties.name);
		mapCoords.push(latLng);


		// add place to the table
		let row = document.createElement('tr');
		row.innerHTML = `<td>${place.properties.name}</td>`;
		document.getElementById('placeBody').appendChild(row);


		// when user clicks on table row, focus on that place on the map
		row.addEventListener('click', () => {
			map.setView(latLng, 15);
			marker.openPopup();
		});
	});

	map.fitBounds(mapCoords);
}



function updateClock(h, m, s) {

	// calculate am/pm
	let period = "AM";
	if (h >= 12) {
		period = "PM";
	}
	document.getElementById("period").innerHTML = period


	// calculate degrees to move hands
	let secToDeg = (s / 60) * 360
	let minToDeg = (m / 60) * 360
	let hrToDeg = (h / 12) * 360

	// rotate hands
	let hourHand = document.querySelector(".hour");
	let minuteHand = document.querySelector(".minute");
	let secondHand = document.querySelector(".second");

	secondHand.style.transform = `rotate(${secToDeg}deg)`;
	minuteHand.style.transform = `rotate(${minToDeg}deg)`;
	hourHand.style.transform = `rotate(${hrToDeg}deg)`;
}


// initialize all map components
function mapInit() {
	map = L.map('map').setView([0, 0], 12);
	L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
		attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
	}).addTo(map);

	// custom hotel marker
	hotelMarker = L.icon({
		iconUrl: 'static/img/hotelPin.png',

		iconSize: [40, 40],
		iconAnchor: [20, 40],
		popupAnchor: [0, -40]
	});

	// custom place marker
	placeMarker = L.icon({
		iconUrl: 'static/img/placePin.png',

		iconSize: [26, 46],
		iconAnchor: [13, 46],
		popupAnchor: [0, -40]
	});
}


// onload function
async function loadCitySite() {
	// retrieve selected city
	city = localStorage.getItem("city")
	country = localStorage.getItem("country")

	if (!city) {
		alert("oops, error! redirecting you back to home page...")
		window.location.href = "/index.html"
	}

	document.getElementById("cityName").innerHTML = city

	mapInit()

	loadEmergencyNumber()
	await loadIATACode();
	await loadWeather();
	setInterval(getTime, 1000)
	await loadCurrency()
	loadConversionRate()
	loadNews()
	loadHotels()
	loadPlaces()
}


// toggle between hotels and places container
function toggleTables() {
	let hotelsTable = document.getElementById("hotelContainer");
	let placesTable = document.getElementById("placeContainer");

	if (hotelsTable.style.display === "none") {
		hotelsTable.style.display = "inline-block";
		placesTable.style.display = "none";

	} else {
		hotelsTable.style.display = "none";
		placesTable.style.display = "inline-block";
	}
}

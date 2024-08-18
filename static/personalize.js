let destinations;

// populate the site with destinations from the json file
async function loadDestinations() {

    try {
        const response = await fetch('static/destinations.json');
        destinations = await response.json();
        console.log(destinations)

    } catch (error) {
        console.error("Error fetching destinations:", error);
    }
}


function recommendCity() {

    const weather = document.getElementById('weather').value;
    const landmarks = document.getElementById('landmarks').value;
    const activities = document.getElementById('activities').value;
    const budget = document.getElementById('budget').value;

    const recommendationsContainer = document.getElementById('citiesRow');
        recommendationsContainer.innerHTML = ''; 


    // filter and create posters based on user preferences
    const filteredDestinations = destinations.filter(dest =>
        dest.weather === weather &&
        dest.landmarks === landmarks &&
        dest.activities === activities &&
        dest.budget === budget
    );

    console.log(filteredDestinations)

    // create posters for the filtered destinations
    filteredDestinations.forEach(dest => {
        
        recommendationsContainer.innerHTML += `
        <div class="col-md-12">
            <div onclick = "chooseCity('${dest.city}', '${dest.country}')" class="card text-center text-white city-card" style="background-image: url('${dest.image}');">
                <div class="card-body d-flex align-items-center justify-content-center">
                    <p class="card-text">${dest.city}</p>
                </div>
            </div>
        </div>`

    
    });

    if (filteredDestinations.length === 0) {
        recommendationsContainer.innerHTML = '<p>No destinations match your preferences.</p>';
    }
}



function chooseCity(city, country){
  localStorage.setItem("city", city)
  localStorage.setItem("country", country)
  window.location.href = "city.html"
}
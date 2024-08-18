async function loadCities(){
  let destinations;

  try {
    const response = await fetch('static/destinations.json');
    destinations = await response.json();
    console.log(destinations);

  } catch (error) {
    console.error("Error fetching destinations:", error);
  }

  let cityRow = document.getElementById("citiesRow");
  cityRow.innerHTML = '';

  destinations.forEach((element) => {
    cityRow.innerHTML += 
            `
            <div class="col-md-3">
                <div onclick = "chooseCity('${element.city}', '${element.country}')" class="card text-center text-white city-card" style="background-image: url('${element.image}');">
                    <div class="card-body d-flex align-items-center justify-content-center">
                        <p class="card-text">${element.city}</p>
                    </div>
                </div>
            </div>
            `
  });

}


// set local storage variables to keep track of city + country
function chooseCity(city, country){
  localStorage.setItem("city", city);
  localStorage.setItem("country", country);
  window.location.href = "city.html";
}
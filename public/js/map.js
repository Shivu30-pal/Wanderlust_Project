mapboxgl.accessToken = mapToken;

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: coordinates,
    zoom: 7
});

console.log("COORDINATES:", coordinates);

map.on("load", () => {
    new mapboxgl.Marker({ color: "red" })
        .setLngLat(coordinates)
        .setPopup(
            new mapboxgl.Popup({ offset: 25 })
                .setHTML(`<h4>${listing.location}</h4>
                        <p>Exact Location Provided after Bookings</p>`)
        )
        .addTo(map);
});
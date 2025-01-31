let map;
let geoData;
let markers = L.layerGroup();
const categories = new Set();
let currentFilter = null;

const scriptURL = 'https://script.google.com/macros/s/AKfycbwo5jBhs_Z2RJIChY8qUk5mUMYyVsDC9EJsXNiz85Pg7e5dHzoGYFyQbiHQOyjFI1Ew2w/exec';

async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch(scriptURL, {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        });

        if (response.ok) {
            document.getElementById('login-screen').classList.add('d-none');
            document.getElementById('dashboard').classList.remove('d-none');
            initializeMap();
            loadData();
        } else {
            const error = document.getElementById('login-error');
            error.textContent = 'Invalid credentials';
            error.classList.remove('d-none');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function initializeMap() {
    map = L.map('map', {
        center: [16.5, 95.5],
        zoom: 8,
        zoomControl: false
    });

    L.control.zoom({ position: 'topright' }).addTo(map);

    const baseLayers = {
        Satellite: L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
            subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        }),
        Street: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'),
        Dark: L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'),
    };

    baseLayers.Satellite.addTo(map);
    L.control.layers(baseLayers).addTo(map);
}

async function loadData() {
    const response = await fetch('data/NaTaKha.geojson');
    geoData = await response.json();

    geoData.features.forEach(feature => {
        categories.add(feature.properties.Category);
    });

    createScoreCards();
    filterData();
}

function createScoreCards() {
    const createCardSet = (containerId) => {
        const container = document.getElementById(containerId);
        container.innerHTML = '';

        // All Button
        const allCard = document.createElement('div');
        allCard.className = 'score-card' + (currentFilter === null ? ' active' : '');
        allCard.innerHTML = 'All';
        allCard.addEventListener('click', () => filterData());
        container.appendChild(allCard);

        // Category Buttons
        categories.forEach(category => {
            const card = document.createElement('div');
            card.className = 'score-card' + (currentFilter === category ? ' active' : '');
            card.innerHTML = category;
            card.addEventListener('click', () => filterData(category));
            container.appendChild(card);
        });
    };

    createCardSet('desktop-score-cards');
    createCardSet('mobile-score-cards');
}

function filterData(category = null) {
    currentFilter = category;
    const filtered = geoData.features.filter(f => 
        !category || f.properties.Category === category
    );
    
    updateMap(filtered);
    updateUnitLists(filtered);
    createScoreCards();
}

function updateMap(filteredData) {
    markers.clearLayers();

    const markerBounds = [];
    filteredData.forEach(feature => {
        const [lng, lat] = feature.geometry.coordinates;
        const { Name, Long_F, logo } = feature.properties;

        const icon = L.icon({
            iconUrl: `logos/${logo}.png`,
            iconSize: [32, 32],
        });

        const marker = L.marker([lat, lng], { icon })
            .bindPopup(`<b>${Name}</b><br>${Long_F}`);
        
        markers.addLayer(marker);
        markerBounds.push([lat, lng]);
    });

    markers.addTo(map);
    if (markerBounds.length > 0) {
        map.flyToBounds(markerBounds, { padding: [50, 50] });
    }
}

function updateUnitLists(filteredData) {
    const updateList = (containerId) => {
        const container = document.getElementById(containerId);
        container.innerHTML = '';

        filteredData.forEach(feature => {
            const div = document.createElement('div');
            div.className = 'unit-item';
            div.innerHTML = `
                <h6>${feature.properties.Name}</h6>
                <small>${feature.properties.Long_F}</small>
            `;
            div.addEventListener('click', () => {
                const [lng, lat] = feature.geometry.coordinates;
                map.flyTo([lat, lng], 15);
            });
            container.appendChild(div);
        });
    };

    updateList('desktop-unit-list');
    updateList('mobile-unit-list');
}
// Weather API configuration
const API_KEY = 'YOUR_API_KEY_HERE';
const WEATHER_API_BASE = 'https://api.openweathermap.org/data/2.5';

// Important API Usage Notes:
// 1. Free tier limits: 60 calls/minute
// 2. Recommended to call API no more than once every 10 minutes per location
// 3. Sign up at: https://openweathermap.org/appid
// 4. Wait ~2 hours after signing up for API key activation

// DOM Elements
const preloader = document.querySelector('.preloader');
const homeContainer = document.querySelector('.home-container');
const dashboardContainer = document.querySelector('.dashboard-container');
const enterDashboardBtn = document.getElementById('enterDashboard');
const searchInput = document.getElementById('searchCity');
const searchBtn = document.getElementById('searchBtn');
const getCurrentLocationBtn = document.getElementById('getCurrentLocation');

// Initialize map
let map = null;

// Add floating animations to weather icons
function initializeFloatingIcons() {
    const floatingElements = document.querySelector('.floating-elements');
    const icons = floatingElements.querySelectorAll('i');
    
    icons.forEach((icon, index) => {
        const randomX = Math.random() * 80 - 40;
        const randomY = Math.random() * 80 - 40;
        const randomDelay = Math.random() * 2;
        const randomDuration = 2 + Math.random() * 2;
        
        icon.style.left = `${50 + randomX}%`;
        icon.style.top = `${50 + randomY}%`;
        icon.style.animationDelay = `${randomDelay}s`;
        icon.style.animationDuration = `${randomDuration}s`;
    });
}

// Initialize particles
function initializeParticles() {
    const particles = document.querySelector('.particles');
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        const size = Math.random() * 5 + 1;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        particle.style.animationDelay = `${Math.random() * 2}s`;
        particles.appendChild(particle);
    }
}

// Initialize the weather dashboard
function initializeDashboard() {
    // Initialize Leaflet map
    map = L.map('weatherMap').setView([0, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    
    // Get user's location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const { latitude, longitude } = position.coords;
                getWeatherData(latitude, longitude);
                map.setView([latitude, longitude], 10);
            },
            error => {
                console.error('Error getting location:', error);
                getWeatherData(51.5074, -0.1278); // Default to London
            }
        );
    }
}

// Fetch weather data
async function getWeatherData(lat, lon) {
    try {
        // Current weather
        const currentWeatherResponse = await fetch(
            `${WEATHER_API_BASE}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
        );
        const currentWeatherData = await currentWeatherResponse.json();
        
        // Forecast
        const forecastResponse = await fetch(
            `${WEATHER_API_BASE}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
        );
        const forecastData = await forecastResponse.json();
        
        // UV Index (One Call API)
        const oneCallResponse = await fetch(
            `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly&units=metric&appid=${API_KEY}`
        );
        const oneCallData = await oneCallResponse.json();
        
        updateWeatherUI(currentWeatherData, forecastData, oneCallData);
    } catch (error) {
        console.error('Error fetching weather data:', error);
    }
}

// Update weather UI
function updateWeatherUI(current, forecast, oneCall) {
    // Update location
    document.getElementById('currentLocation').textContent = current.name;
    
    // Update current weather
    document.getElementById('currentTemp').textContent = Math.round(current.main.temp);
    document.getElementById('humidity').textContent = current.main.humidity;
    document.getElementById('windSpeed').textContent = Math.round(current.wind.speed);
    document.getElementById('feelsLike').textContent = Math.round(current.main.feels_like);
    
    // Update weather icon
    const weatherIcon = document.querySelector('.weather-icon i');
    updateWeatherIcon(weatherIcon, current.weather[0].main);
    
    // Update forecast
    const forecastContainer = document.getElementById('forecastContainer');
    forecastContainer.innerHTML = '';
    
    // Get one forecast per day
    const dailyForecasts = forecast.list.filter(item => 
        item.dt_txt.includes('12:00:00')
    ).slice(0, 5);
    
    dailyForecasts.forEach(day => {
        const forecastItem = document.createElement('div');
        forecastItem.className = 'forecast-item';
        forecastItem.innerHTML = `
            <div class="forecast-date">${new Date(day.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' })}</div>
            <div class="forecast-icon">
                <i class="fas ${getWeatherIconClass(day.weather[0].main)}"></i>
            </div>
            <div class="forecast-temp">${Math.round(day.main.temp)}°C</div>
        `;
        forecastContainer.appendChild(forecastItem);
    });
    
    // Update weather highlights
    if (oneCall) {
        document.getElementById('uvIndex').textContent = Math.round(oneCall.current.uvi);
        document.getElementById('visibility').textContent = `${(current.visibility / 1000).toFixed(1)} km`;
        document.getElementById('pressure').textContent = `${current.main.pressure} hPa`;
        
        // Update sunrise & sunset
        const sunrise = new Date(current.sys.sunrise * 1000);
        const sunset = new Date(current.sys.sunset * 1000);
        document.getElementById('sunrise').textContent = sunrise.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        document.getElementById('sunset').textContent = sunset.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
    
    // Update map marker
    if (map) {
        map.eachLayer(layer => {
            if (layer instanceof L.Marker) {
                map.removeLayer(layer);
            }
        });
        
        L.marker([current.coord.lat, current.coord.lon])
            .addTo(map)
            .bindPopup(`
                <b>${current.name}</b><br>
                Temperature: ${Math.round(current.main.temp)}°C<br>
                Weather: ${current.weather[0].main}
            `)
            .openPopup();
    }
}

// Helper function to get weather icon class
function getWeatherIconClass(weatherMain) {
    const iconMap = {
        'Clear': 'fa-sun',
        'Clouds': 'fa-cloud',
        'Rain': 'fa-cloud-rain',
        'Snow': 'fa-snowflake',
        'Thunderstorm': 'fa-bolt',
        'Drizzle': 'fa-cloud-rain',
        'Mist': 'fa-smog',
        'Fog': 'fa-smog'
    };
    
    return iconMap[weatherMain] || 'fa-sun';
}

// Update weather icon
function updateWeatherIcon(iconElement, weatherMain) {
    iconElement.className = `fas ${getWeatherIconClass(weatherMain)}`;
}

// Search functionality
async function searchCity(cityName) {
    try {
        const response = await fetch(
            `${WEATHER_API_BASE}/weather?q=${cityName}&units=metric&appid=${API_KEY}`
        );
        const data = await response.json();
        
        if (data.cod === 200) {
            getWeatherData(data.coord.lat, data.coord.lon);
            map.setView([data.coord.lat, data.coord.lon], 10);
        } else {
            alert('City not found. Please try again.');
        }
    } catch (error) {
        console.error('Error searching city:', error);
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initialize animations
    initializeFloatingIcons();
    initializeParticles();
    
    // Hide preloader after 2 seconds
    setTimeout(() => {
        preloader.style.opacity = '0';
        setTimeout(() => {
            preloader.style.display = 'none';
            homeContainer.style.opacity = '1';
        }, 500);
    }, 2000);
});

enterDashboardBtn.addEventListener('click', () => {
    homeContainer.style.opacity = '0';
    setTimeout(() => {
        homeContainer.style.display = 'none';
        dashboardContainer.style.display = 'block';
        setTimeout(() => {
            dashboardContainer.style.opacity = '1';
            initializeDashboard();
        }, 100);
    }, 500);
});

searchBtn.addEventListener('click', () => {
    const cityName = searchInput.value.trim();
    if (cityName) {
        searchCity(cityName);
    }
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const cityName = searchInput.value.trim();
        if (cityName) {
            searchCity(cityName);
        }
    }
});

getCurrentLocationBtn.addEventListener('click', () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const { latitude, longitude } = position.coords;
                getWeatherData(latitude, longitude);
                map.setView([latitude, longitude], 10);
            },
            error => {
                console.error('Error getting location:', error);
                alert('Unable to get your location. Please try searching for a city instead.');
            }
        );
    }
}); 
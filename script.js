document.addEventListener("DOMContentLoaded", () => {
    
    const THINGSPEAK_URL = `https://api.thingspeak.com/channels/2745418/feeds.json?api_key=CQEPKXNR6X8J4YSQ&results=1`;
    const OPEN_METEO_URL =
    "https://api.open-meteo.com/v1/forecast?latitude=51.4393&longitude=0.2701&hourly=temperature_2m,weathercode";

    const temperatureValue = document.getElementById("temperature-value");
    const temperatureUnit = document.getElementById("temperature-unit");
    const humidityValue = document.getElementById("humidity-value");
    const airPressureValue = document.getElementById("air-pressure-value");
    const dateElement = document.getElementById("date");
    const settingsModal = document.getElementById("settings-modal");
    const unitSelect = document.getElementById("unit-select");
    const saveSettingsButton = document.getElementById("save-settings");
    const settingsButton = document.getElementById("settings-btn-bottom");
    const closeModal = document.getElementById("close-settings-btn");

    let selectedUnit = "C"; // Default unit

    // Conversion functions
    const convertToCelsius = (tempF) => ((tempF - 32) * 5) / 9;
    const convertToFahrenheit = (tempC) => (tempC * 9) / 5 + 32;

    // Update temperature display
    const updateTemperatureDisplay = (temperature) => {
        let temp = temperature;
        if (selectedUnit === "F") {
            temp = convertToFahrenheit(temperature);
        }
        temperatureValue.textContent = Math.round(temp);
        temperatureUnit.textContent = selectedUnit === "C" ? "°C" : "°F";
    };

    const fetchThingSpeakData = async () => {
        try {
            const response = await fetch(THINGSPEAK_URL);
            const data = await response.json();
            const latestData = data.feeds[0];
    
            // Readings from ThingSpeak fields
            const temperature = parseFloat(latestData.field3).toFixed(2);
            const humidity = parseFloat(latestData.field2).toFixed(2);
            const airPressure = parseFloat(latestData.field4).toFixed(2);
            const chanceOfRain = latestData.field5 ? parseFloat(latestData.field5).toFixed(2) : "N/A";
            const sunlight = latestData.field6 ? parseFloat(latestData.field6).toFixed(2) : "N/A";
    
            // Update UI with fetched data
            updateTemperatureDisplay(temperature);
            humidityValue.textContent = `${humidity} Pa`;
            airPressureValue.textContent = `${airPressure} %`;
            document.getElementById("chance-of-rain-value").textContent = `${chanceOfRain} %`;
            document.getElementById("sunlight-value").textContent = `${sunlight} %`;
        } catch (error) {
            console.error("Error fetching ThingSpeak data:", error);
            temperatureValue.textContent = "N/A";
            humidityValue.textContent = "N/A";
            airPressureValue.textContent = "N/A";
            document.getElementById("chance-of-rain-value").textContent = "N/A";
            document.getElementById("sunlight-value").textContent = "N/A";
        }
    };

    // Create hourly temperature chart
    const createHourlyTemperatureChart = (hours, temperatures, currentHourIndex) => {
        const ctx = document.getElementById("temp-chart").getContext("2d");
        new Chart(ctx, {
            type: "line",
            data: {
                labels: hours,
                datasets: [
                    {
                        label: "Hourly Temperature (°C)",
                        data: temperatures,
                        borderColor: "rgba(75, 192, 192, 1)",
                        backgroundColor: "rgba(75, 192, 192, 0.2)",
                        borderWidth: 2,
                        pointRadius: 3,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: true },
                    tooltip: { enabled: true },
                },
                scales: {
                    x: {
                        title: { display: true, text: "Time" },
                    },
                    y: {
                        title: { display: true, text: "Temperature (°C)" },
                        beginAtZero: false,
                    },
                },
                plugins: {
                    annotation: {
                        annotations: {
                            currentTemperatureLine: {
                                type: "line",
                                xMin: currentHourIndex,
                                xMax: currentHourIndex,
                                borderColor: "red",
                                borderWidth: 2,
                                label: {
                                    content: "Now",
                                    enabled: true,
                                    position: "top",
                                },
                            },
                        },
                    },
                },
            },
        });
    };
    
    const fetchHourlyTemperatureData = async () => {
        try {
            const response = await fetch(OPEN_METEO_URL);
            const data = await response.json();
    
            // Current time
            const now = new Date();
            const currentHour = now.getHours();
    
            // Calculate start and end indices for the desired range
            const startHourIndex = (currentHour - 5 + 24) % 24; // 5 hours before
            const endHourIndex = (currentHour + 10); // Same time next day
    
            // Get all hours and temperatures
            const fullHours = data.hourly.time.map((time) =>
                new Date(time).toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                })
            );
            const fullTemperatures = data.hourly.temperature_2m;
    
            // Collect 29 data points (wrap-around handling)
            const hours =
                startHourIndex < endHourIndex
                    ? fullHours.slice(startHourIndex, endHourIndex + 1)
                    : [
                          ...fullHours.slice(startHourIndex),
                          ...fullHours.slice(0, endHourIndex + 1),
                      ];
            const temperatures =
                startHourIndex < endHourIndex
                    ? fullTemperatures.slice(startHourIndex, endHourIndex + 1)
                    : [
                          ...fullTemperatures.slice(startHourIndex),
                          ...fullTemperatures.slice(0, endHourIndex + 1),
                      ];
    
            // Find the current hour index in the rearranged data
            const currentHourIndex = 5;
    
            // Create the chart
            createHourlyTemperatureChart(hours, temperatures, currentHourIndex);
        } catch (error) {
            console.error("Error fetching hourly temperature data:", error);
        }
    }; 
    
    // Initialize everything
    document.addEventListener("DOMContentLoaded", () => {
        fetchHourlyTemperatureData();
        fetchWeatherData();
    fetchHourlyTemperatureData();
    });

// Update the live date tracker
const updateDate = () => {
    const now = new Date();
    const options = { weekday: "long", month: "short", day: "numeric", year: "numeric" };
    dateElement.textContent = now.toLocaleDateString("en-GB", options);
};


    // Event listener for the settings button
    settingsButton.addEventListener("click", () => {
        settingsModal.classList.remove("hidden");
    });

    // Event listener for saving settings
    saveSettingsButton.addEventListener("click", () => {
        selectedUnit = unitSelect.value;
        fetchThingSpeakData();
        fetchHourlyTemperatureData();
        settingsModal.classList.add("hidden");
    });

    // Event listener to close settings modal
    closeModal?.addEventListener("click", () => {
        settingsModal.classList.add("hidden");
    });

    // Initial fetch
    fetchThingSpeakData();
    fetchHourlyTemperatureData();
    fetchThreeDayForecast();
    updateDate();
});
const fetchThreeDayForecast = async () => {
    const FORECAST_URL =
        "https://api.open-meteo.com/v1/forecast?latitude=51.4393&longitude=0.2701&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto";

    const weatherDescriptions = {
        0: "Clear sky",
        1: "Mainly clear",
        2: "Cloudy",
        3: "Overcast",
        45: "Foggy",
        48: "Depositing rime fog",
        51: "Light drizzle",
        53: "Moderate drizzle",
        55: "Dense drizzle",
        61: "Slight rain",
        63: "Moderate rain",
        65: "Heavy rain",
        71: "Slight snowfall",
        73: "Moderate snowfall",
        75: "Heavy snowfall",
        80: "Slight rain showers",
        81: "Moderate rain showers",
        82: "Violent rain showers",
    };

    try {
        const response = await fetch(FORECAST_URL);
        const data = await response.json();

        const forecastContainer = document.getElementById("forecast-cards");
        const dates = data.daily.time;
        const maxTemps = data.daily.temperature_2m_max;
        const minTemps = data.daily.temperature_2m_min;
        const weatherCodes = data.daily.weathercode;

        forecastContainer.innerHTML = ""; // Clear existing cards

        for (let i = 0; i < Math.min(3, dates.length); i++) {
            const card = document.createElement("div");
            card.className = "forecast-card";

            const date = new Date(dates[i]);
            const formattedDate = date.toLocaleDateString("en-GB", {
                weekday: "long",
                month: "short",
                day: "numeric",
            });

            const maxTemp = maxTemps[i] ? Math.round(maxTemps[i]) : "N/A";
            const minTemp = minTemps[i] ? Math.round(minTemps[i]) : "N/A";
            const weatherDescription =
                weatherDescriptions[weatherCodes[i]] || "Unknown weather";

            card.innerHTML = `
                <p>${formattedDate}</p>
                <p>${weatherDescription}</p>
                <p>${minTemp}° / ${maxTemp}°</p>
            `;
            forecastContainer.appendChild(card);
        }
    } catch (error) {
        console.error("Error fetching 3-day forecast data:", error);
    }
};
const weatherDescriptions = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Foggy",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail",
    default: "Unknown weather",
};
const fetchWeatherData = async () => {
    try {
        const response = await fetch(OPEN_METEO_URL);
        const data = await response.json();

        // Extract weather details
        const weatherCode = data.hourly.weathercode[0]; // Get the first hour's weather code
        const temperature = data.hourly.temperature_2m[0];
        const condition = weatherDescriptions[weatherCode] || weatherDescriptions.default;

        // Update temperature and condition in the UI
        updateTemperatureDisplay(temperature);
        document.getElementById("weather-condition").textContent = condition;
    } catch (error) {
        console.error("Error fetching weather data:", error);
        document.getElementById("weather-condition").textContent = "Error fetching weather condition.";
    }
};
document.getElementById("refresh-btn").addEventListener("click", () => {
    // Reload the current page
    location.reload();
});

// **주의:** API 키가 여기에 하드 코딩되어 있어야 합니다.
const API_KEY = 'eafc4dddd980d1f98a57c9a4e5d8b2ca'; 

const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
// weather-info와 forecast-info 두 영역 모두 사용
const weatherInfo = document.getElementById('weather-info'); 
const forecastInfo = document.getElementById('forecast-info');
const errorMessage = document.getElementById('error-message');

// --- 두 API를 동시에 호출하는 메인 검색 함수 ---
async function searchAllWeather(city) {
    // [핵심 수정 1]: 검색 시작 시 박스를 다시 'block'으로 보이게 설정
    weatherInfo.style.display = 'block'; 
    forecastInfo.style.display = 'block';

    // 1. 초기화
    errorMessage.textContent = '';
    weatherInfo.innerHTML = '<p>현재 날씨 정보를 가져오는 중...</p>';
    forecastInfo.innerHTML = '<p>5일 예보 정보를 가져오는 중...</p>';
    
    // Promise.all을 사용하여 두 API 요청을 동시에 보냅니다.
    try {
        const [weatherResponse, forecastResponse] = await Promise.all([
            // 현재 날씨 API 요청
            fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric&lang=kr`),
            // 5일 예보 API 요청
            fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric&lang=kr`)
        ]);

        // 2. 응답 상태 검사 (두 응답 중 하나라도 실패하면 오류 처리)
        if (!weatherResponse.ok || !forecastResponse.ok) {
            throw new Error('도시 정보를 찾을 수 없거나 API 요청에 문제가 발생했습니다.');
        }

        const weatherData = await weatherResponse.json();
        const forecastData = await forecastResponse.json();

        // 3. API 응답 데이터 검사
        if (weatherData.cod !== 200 || parseInt(forecastData.cod) !== 200) {
            throw new Error(`도시 정보를 찾을 수 없습니다: ${weatherData.message || '유효하지 않은 도시명'}`);
        }

        // 4. 데이터 표시
        displayWeather(weatherData, forecastData); // 현재 날씨 표시
        displayForecast(forecastData); // 5일 예보 표시
        // [핵심 추가]: 데이터 표시가 성공적으로 완료되면 오류 메시지 박스를 숨김
        errorMessage.style.display = 'none';

    } catch (error) {
        // [핵심 수정 2]: 오류 발생 시 정보 박스는 숨기고 오류 메시지만 보이게 합니다.
        weatherInfo.style.display = 'none'; 
        forecastInfo.style.display = 'none';
        
        // 오류 메시지는 보이게 설정 (초기에 숨겨져 있으므로)
        errorMessage.style.display = 'block';
        errorMessage.textContent = `오류 발생: ${error.message}. 도시 이름을 확인하거나 네트워크 상태를 확인하세요.`;
    }
}

// --- [추가] UNIX 타임스탬프를 현지 시간으로 변환하는 함수 ---
function convertUnixToTime(timestamp) {
    // UNIX 타임스탬프는 밀리초 단위이므로 1000을 곱합니다.
    const date = new Date(timestamp * 1000); 
    // toLocaleTimeString을 사용하여 현지 시간(시:분) 형식으로 변환합니다.
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: true });
}

// --- 현재 날씨 표시 함수 (HTML 출력 부분 수정) ---
function displayWeather(data, forecastData) {
    // 기존 변수 추출 로직은 유지합니다.
    const cityName = data.name;
    const temperature = data.main.temp;
    const feelsLike = data.main.feels_like;
    const windSpeed = data.wind.speed;
    const description = data.weather[0].description;
    const iconCode = data.weather[0].icon;
    const humidity = data.main.humidity; // 습도 데이터 추가
    
    // ... (customIconMap 사용 로직 유지)
   const iconUrl = `http://openweathermap.org/img/wn/${iconCode}@2x.png`; // 커스텀 없으면 기본 아이콘 사용
    
    // ... (rainProbability, outfit, advice 추출 로직 유지)
    let rainProbability = '정보 없음';
    if (forecastData && forecastData.list && forecastData.list.length > 0) {
        rainProbability = `${(forecastData.list[0].pop * 100).toFixed(0)}%`; 
    }
    const sunriseTime = convertUnixToTime(data.sys.sunrise);
    const sunsetTime = convertUnixToTime(data.sys.sunset);
    
    // --- [핵심 수정] 새로운 레이아웃 적용 ---
    weatherInfo.innerHTML = `
        <div class="weather-header">
            <h2 class="city-name">${cityName}</h2>
            </div>

        <div class="main-temp-section">
            <img src="${iconUrl}" alt="${description}" class="main-weather-icon">
            <div class="temp-display">
                <span class="large-temp">${temperature.toFixed(1)}°C</span>
                <span class="feels-like">체감 (${feelsLike.toFixed(1)}°C)</span>
            </div>
        </div>

        <div class="detail-info-grid">
            <div class="info-item">
                <i class="fas fa-wind"></i> 
                <span>바람</span>
                <strong>${windSpeed.toFixed(1)} m/s</strong>
            </div>
            <div class="info-item">
                <i class="fas fa-tint"></i> 
                <span>습도</span>
                <strong>${humidity}%</strong>
            </div>
            <div class="info-item">
                <i class="fas fa-cloud-rain"></i> 
                <span>강수확률</span>
                <strong>${rainProbability}</strong>
            </div>
        </div>

        <hr class="separator">
       <div class="sun-times-section">
            <p><i class="fas fa-sun"></i> 일출  <b>${sunriseTime}</b></p>
            <p><i class="fas fa-moon"></i> 일몰  <b>${sunsetTime}</b></p>
        </div>
    `;
    // *주의: 아이콘을 위해 <i class="fas fa-..."></i>를 사용했습니다. 
    // HTML의 <head> 태그에 Font Awesome CDN 링크를 추가해야 아이콘이 보입니다.
    // <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">
}

// --- 5일 예보 표시 함수 ---
function displayForecast(data) {
    // 이전 답변에서 제공된 displayForecast 함수 로직을 여기에 그대로 붙여넣습니다.
    // (dailyForecasts 계산, forecastHTML 생성 및 forecastInfo.innerHTML에 할당하는 로직)

    const dailyForecasts = {}; 
    const list = data.list;

    list.forEach(item => {
        const date = item.dt_txt.split(' ')[0];
        if (!dailyForecasts[date]) {
            dailyForecasts[date] = {
                minTemp: item.main.temp_min,
                maxTemp: item.main.temp_max,
                icon: item.weather[0].icon,
                description: item.weather[0].description
            };
        } else {
            dailyForecasts[date].minTemp = Math.min(dailyForecasts[date].minTemp, item.main.temp_min);
            dailyForecasts[date].maxTemp = Math.max(dailyForecasts[date].maxTemp, item.main.temp_max);
        }
    });

    let forecastHTML = `<h2>일별 예보</h2><div class="forecast-container">`;
    const dates = Object.keys(dailyForecasts).sort(); 
    const today = new Date().toISOString().split('T')[0];

    dates.filter(date => date !== today).slice(0, 5).forEach(date => {
        const day = dailyForecasts[date];
        const dateObj = new Date(date);
        const dayName = dateObj.toLocaleDateString('ko-KR', { weekday: 'short' });

        forecastHTML += `
            <div class="forecast-day">
                <h3>${date.substring(5)} (${dayName})</h3>
                <img src="http://openweathermap.org/img/wn/${day.icon}@2x.png" alt="${day.description}">
                <p>${day.description}</p>
                <p>최고: ${day.maxTemp.toFixed(1)}°C</p>
                <p>최저: ${day.minTemp.toFixed(1)}°C</p>
            </div>
        `;
    });

    forecastHTML += `</div>`;
    forecastInfo.innerHTML = forecastHTML;
}


// --- 이벤트 리스너: 버튼 클릭 및 Enter 키 입력 처리 ---

// 2. Enter 키 입력 시
cityInput.addEventListener('keyup', (event) => {
    if (event.keyCode === 13) {
        event.preventDefault(); 
        searchBtn.click();
    }
});

// 1. 검색 버튼 클릭 시 (수정)
searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) {
        searchAllWeather(city); // 통합 함수 호출
    } else {
        // [핵심 수정 3]: 도시 이름이 비었을 때 박스 숨김
        errorMessage.textContent = '도시 이름을 입력해 주세요.';
        errorMessage.style.display = 'block';
        weatherInfo.style.display = 'none'; 
        forecastInfo.style.display = 'none';
        weatherInfo.innerHTML = '';
        forecastInfo.innerHTML = '';
    }
});

// --- [최종 추가] 페이지 로드 시 정보 카드 및 오류 메시지 숨기기 ---
document.addEventListener('DOMContentLoaded', () => {
    weatherInfo.style.display = 'none';
    forecastInfo.style.display = 'none';
    errorMessage.style.display = 'none';
});

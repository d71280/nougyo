import axios from 'axios'

// OpenWeatherMap API configuration
const WEATHER_API_BASE_URL = 'https://api.openweathermap.org/data/2.5'
const WEATHER_API_KEY = process.env.NEXT_PUBLIC_WEATHER_API_KEY

export interface WeatherData {
  date: string
  maxTemperature: number
  minTemperature: number
  rainfall: number
  humidity?: number
  windSpeed?: number
  sunshineHours?: number
  soilTemperature?: number
  weatherCondition?: string
  pressure?: number
}

export interface CurrentWeatherResponse {
  main: {
    temp: number
    temp_min: number
    temp_max: number
    humidity: number
    pressure: number
  }
  weather: Array<{
    main: string
    description: string
  }>
  wind: {
    speed: number
  }
  rain?: {
    '1h'?: number
    '3h'?: number
  }
  dt: number
}

export interface ForecastResponse {
  list: Array<{
    dt: number
    main: {
      temp: number
      temp_min: number
      temp_max: number
      humidity: number
      pressure: number
    }
    weather: Array<{
      main: string
      description: string
    }>
    wind: {
      speed: number
    }
    rain?: {
      '3h'?: number
    }
  }>
}

/**
 * 現在の天気データを取得
 */
export async function getCurrentWeather(lat: number, lon: number): Promise<WeatherData | null> {
  if (!WEATHER_API_KEY) {
    console.error('Weather API key is not configured')
    return null
  }

  try {
    const response = await axios.get<CurrentWeatherResponse>(
      `${WEATHER_API_BASE_URL}/weather`,
      {
        params: {
          lat,
          lon,
          appid: WEATHER_API_KEY,
          units: 'metric', // 摂氏温度
          lang: 'ja'
        }
      }
    )

    const data = response.data
    const rainfall = data.rain?.['1h'] || data.rain?.['3h'] || 0

    return {
      date: new Date().toISOString().split('T')[0],
      maxTemperature: data.main.temp_max,
      minTemperature: data.main.temp_min,
      rainfall,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
      weatherCondition: data.weather[0]?.description,
      pressure: data.main.pressure,
      // 土壌温度は通常のAPIでは取得できないため、気温から推定
      soilTemperature: data.main.temp - 2
    }
  } catch (error) {
    console.error('Current weather fetch error:', error)
    return null
  }
}

/**
 * 5日間の天気予報データを取得
 */
export async function getWeatherForecast(lat: number, lon: number): Promise<WeatherData[]> {
  if (!WEATHER_API_KEY) {
    console.error('Weather API key is not configured')
    return []
  }

  try {
    const response = await axios.get<ForecastResponse>(
      `${WEATHER_API_BASE_URL}/forecast`,
      {
        params: {
          lat,
          lon,
          appid: WEATHER_API_KEY,
          units: 'metric',
          lang: 'ja'
        }
      }
    )

    const dailyData = new Map<string, WeatherData>()

    response.data.list.forEach(item => {
      const date = new Date(item.dt * 1000).toISOString().split('T')[0]
      const rainfall = item.rain?.['3h'] || 0

      if (!dailyData.has(date)) {
        dailyData.set(date, {
          date,
          maxTemperature: item.main.temp_max,
          minTemperature: item.main.temp_min,
          rainfall,
          humidity: item.main.humidity,
          windSpeed: item.wind.speed,
          weatherCondition: item.weather[0]?.description,
          pressure: item.main.pressure,
          soilTemperature: item.main.temp - 2
        })
      } else {
        const existing = dailyData.get(date)!
        existing.maxTemperature = Math.max(existing.maxTemperature, item.main.temp_max)
        existing.minTemperature = Math.min(existing.minTemperature, item.main.temp_min)
        existing.rainfall += rainfall
      }
    })

    return Array.from(dailyData.values()).slice(0, 5)
  } catch (error) {
    console.error('Weather forecast fetch error:', error)
    return []
  }
}

/**
 * 農場の位置情報から都市名を検索して座標を取得
 */
export async function getLocationCoordinates(locationName: string): Promise<{ lat: number; lon: number } | null> {
  if (!WEATHER_API_KEY) {
    console.error('Weather API key is not configured')
    return null
  }

  try {
    const response = await axios.get(
      `https://api.openweathermap.org/geo/1.0/direct`,
      {
        params: {
          q: locationName,
          limit: 1,
          appid: WEATHER_API_KEY
        }
      }
    )

    if (response.data.length > 0) {
      const location = response.data[0]
      return {
        lat: location.lat,
        lon: location.lon
      }
    }

    return null
  } catch (error) {
    console.error('Location coordinates fetch error:', error)
    return null
  }
}

/**
 * 日照時間を推定する関数（雲量から計算）
 */
export function estimateSunshineHours(weatherCondition: string): number {
  const condition = weatherCondition.toLowerCase()
  
  if (condition.includes('clear') || condition.includes('晴')) {
    return 8 // 晴れの場合
  } else if (condition.includes('cloud') || condition.includes('曇')) {
    return 4 // 曇りの場合
  } else if (condition.includes('rain') || condition.includes('雨')) {
    return 1 // 雨の場合
  } else if (condition.includes('storm') || condition.includes('雷')) {
    return 0.5 // 嵐の場合
  }
  
  return 6 // デフォルト値
} 
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { getCurrentWeather, getWeatherForecast, getLocationCoordinates, estimateSunshineHours, WeatherData } from '@/lib/weather'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CloudRain, Sun, Thermometer, Wind, Droplets, Eye, RefreshCw, Calendar } from 'lucide-react'

interface Farm {
  id: string
  name: string
  location: string
  latitude: number | null
  longitude: number | null
}

interface WeatherRecord {
  id: string
  farm_id: string
  date: string
  max_temperature: number
  min_temperature: number
  rainfall: number
  humidity: number | null
  wind_speed: number | null
  sunshine_hours: number | null
  soil_temperature: number | null
  weather_condition: string | null
  pressure: number | null
  farms?: Farm
}

export default function WeatherPage() {
  const [farms, setFarms] = useState<Farm[]>([])
  const [weatherRecords, setWeatherRecords] = useState<WeatherRecord[]>([])
  const [selectedFarm, setSelectedFarm] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [fetchingWeather, setFetchingWeather] = useState(false)
  const [forecast, setForecast] = useState<WeatherData[]>([])

  useEffect(() => {
    fetchFarms()
    fetchWeatherRecords()
  }, [])

  const fetchFarms = async () => {
    try {
      const { data, error } = await supabase
        .from('farms')
        .select('id, name, location, latitude, longitude')
        .order('name')

      if (error) throw error
      setFarms(data || [])
    } catch (error) {
      console.error('農場データの取得に失敗しました:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchWeatherRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('weather_data')
        .select(`
          *,
          farms:farm_id (
            id,
            name,
            location
          )
        `)
        .order('date', { ascending: false })
        .limit(20)

      if (error) throw error
      setWeatherRecords(data || [])
    } catch (error) {
      console.error('気象データの取得に失敗しました:', error)
    }
  }

  const fetchWeatherData = async (farmId: string) => {
    setFetchingWeather(true)
    try {
      const farm = farms.find(f => f.id === farmId)
      if (!farm) {
        alert('農場が見つかりません')
        return
      }

      let lat = farm.latitude
      let lon = farm.longitude

      // 座標が設定されていない場合は位置名から取得
      if (!lat || !lon) {
        const coordinates = await getLocationCoordinates(farm.location + ', Japan')
        if (coordinates) {
          lat = coordinates.lat
          lon = coordinates.lon

          // 座標をデータベースに保存
          await supabase
            .from('farms')
            .update({ latitude: lat, longitude: lon })
            .eq('id', farmId)
        } else {
          alert('位置情報の取得に失敗しました')
          return
        }
      }

      // 現在の天気データを取得
      const currentWeather = await getCurrentWeather(lat, lon)
      if (currentWeather) {
        // 日照時間を推定
        if (currentWeather.weatherCondition) {
          currentWeather.sunshineHours = estimateSunshineHours(currentWeather.weatherCondition)
        }

        // データベースに保存（重複チェック有り）
        const { error } = await supabase
          .from('weather_data')
          .upsert([
            {
              farm_id: farmId,
              date: currentWeather.date,
              max_temperature: currentWeather.maxTemperature,
              min_temperature: currentWeather.minTemperature,
              rainfall: currentWeather.rainfall,
              humidity: currentWeather.humidity,
              wind_speed: currentWeather.windSpeed,
              sunshine_hours: currentWeather.sunshineHours,
              soil_temperature: currentWeather.soilTemperature,
              weather_condition: currentWeather.weatherCondition,
              pressure: currentWeather.pressure
            }
          ], {
            onConflict: 'farm_id,date'
          })

        if (error) throw error
      }

      // 5日間の予報を取得
      const forecastData = await getWeatherForecast(lat, lon)
      setForecast(forecastData)

      // データを再取得
      fetchWeatherRecords()
    } catch (error) {
      console.error('気象データの取得に失敗しました:', error)
      alert('気象データの取得に失敗しました')
    } finally {
      setFetchingWeather(false)
    }
  }

  const getWeatherIcon = (condition: string | null) => {
    if (!condition) return <Sun className="h-5 w-5 text-yellow-500" />
    
    const cond = condition.toLowerCase()
    if (cond.includes('rain') || cond.includes('雨')) {
      return <CloudRain className="h-5 w-5 text-blue-500" />
    } else if (cond.includes('cloud') || cond.includes('曇')) {
      return <Sun className="h-5 w-5 text-gray-500" />
    } else {
      return <Sun className="h-5 w-5 text-yellow-500" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Page Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">気象データ管理</h1>
              <p className="mt-2 text-gray-600">農場の気象情報を確認・管理します</p>
            </div>
          </div>

          {/* Weather Data Fetch Section */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>気象データ取得</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label htmlFor="farm-select" className="block text-sm font-medium text-gray-700 mb-2">
                    農場を選択
                  </label>
                  <select
                    id="farm-select"
                    value={selectedFarm}
                    onChange={(e) => setSelectedFarm(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  >
                    <option value="">農場を選択してください</option>
                    {farms.map((farm) => (
                      <option key={farm.id} value={farm.id}>
                        {farm.name} ({farm.location})
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  onClick={() => selectedFarm && fetchWeatherData(selectedFarm)}
                  disabled={!selectedFarm || fetchingWeather}
                  className="flex items-center"
                >
                  {fetchingWeather ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CloudRain className="h-4 w-4 mr-2" />
                  )}
                  {fetchingWeather ? '取得中...' : '気象データを取得'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Weather Forecast */}
          {forecast.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>5日間の天気予報</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {forecast.map((day, index) => (
                    <div key={day.date} className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="font-medium text-sm mb-2">
                        {index === 0 ? '今日' : new Date(day.date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
                      </div>
                      <div className="flex justify-center mb-2">
                        {getWeatherIcon(day.weatherCondition || null)}
                      </div>
                      <div className="text-sm text-gray-600 mb-1">
                        {day.weatherCondition}
                      </div>
                      <div className="text-lg font-bold">
                        {Math.round(day.maxTemperature)}°C
                      </div>
                      <div className="text-sm text-gray-500">
                        {Math.round(day.minTemperature)}°C
                      </div>
                      <div className="text-xs text-blue-600 mt-1">
                        <Droplets className="h-3 w-3 inline mr-1" />
                        {day.rainfall.toFixed(1)}mm
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Weather Records */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                気象記録履歴
              </CardTitle>
            </CardHeader>
            <CardContent>
              {weatherRecords.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">まだ気象データが記録されていません</p>
                  <p className="text-sm text-gray-400">上記から気象データを取得してください</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {weatherRecords.map((record) => (
                    <Card key={record.id} className="border-l-4 border-blue-500">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                                                         <CardTitle className="text-lg">{record.farms?.name || '不明'}</CardTitle>
                             <p className="text-sm text-gray-600">{record.farms?.location || '不明'}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(record.date).toLocaleDateString('ja-JP')}
                            </p>
                          </div>
                          <div className="flex items-center">
                            {getWeatherIcon(record.weather_condition)}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center">
                            <Thermometer className="h-4 w-4 text-red-500 mr-2" />
                            <span className="text-sm">
                              最高: {record.max_temperature}°C
                            </span>
                          </div>
                          <div className="flex items-center">
                            <Thermometer className="h-4 w-4 text-blue-500 mr-2" />
                            <span className="text-sm">
                              最低: {record.min_temperature}°C
                            </span>
                          </div>
                          <div className="flex items-center">
                            <Droplets className="h-4 w-4 text-blue-600 mr-2" />
                            <span className="text-sm">
                              降雨: {record.rainfall}mm
                            </span>
                          </div>
                          {record.humidity && (
                            <div className="flex items-center">
                              <Eye className="h-4 w-4 text-gray-500 mr-2" />
                              <span className="text-sm">
                                湿度: {record.humidity}%
                              </span>
                            </div>
                          )}
                          {record.wind_speed && (
                            <div className="flex items-center">
                              <Wind className="h-4 w-4 text-gray-600 mr-2" />
                              <span className="text-sm">
                                風速: {record.wind_speed}m/s
                              </span>
                            </div>
                          )}
                          {record.sunshine_hours && (
                            <div className="flex items-center">
                              <Sun className="h-4 w-4 text-yellow-500 mr-2" />
                              <span className="text-sm">
                                日照: {record.sunshine_hours}h
                              </span>
                            </div>
                          )}
                        </div>
                        {record.weather_condition && (
                          <div className="text-sm text-gray-600 pt-2 border-t">
                            天候: {record.weather_condition}
                          </div>
                        )}
                        {record.soil_temperature && (
                          <div className="text-sm text-gray-600">
                            推定地温: {record.soil_temperature}°C
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
} 
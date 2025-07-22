'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sprout, Tractor, BarChart3, Calendar, CloudRain } from 'lucide-react'

interface DashboardStats {
  totalFarms: number
  totalCrops: number
  recentWork: number
  recentHarvest: number
  weatherRecords: number
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalFarms: 0,
    totalCrops: 0,
    recentWork: 0,
    recentHarvest: 0,
    weatherRecords: 0
  })
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      // 農場数を取得
      const { count: farmCount } = await supabase
        .from('farms')
        .select('*', { count: 'exact', head: true })

      // 作物数を取得
      const { count: cropCount } = await supabase
        .from('crops')
        .select('*', { count: 'exact', head: true })

      // 今週の作業記録数を取得
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      const { count: workCount } = await supabase
        .from('work_records')
        .select('*', { count: 'exact', head: true })
        .gte('work_date', weekAgo.toISOString().split('T')[0])

      // 今週の収穫記録数を取得
      const { count: harvestCount } = await supabase
        .from('harvest_records')
        .select('*', { count: 'exact', head: true })
        .gte('harvest_date', weekAgo.toISOString().split('T')[0])

      // 今週の気象データ数を取得
      const { count: weatherCount } = await supabase
        .from('weather_data')
        .select('*', { count: 'exact', head: true })
        .gte('date', weekAgo.toISOString().split('T')[0])

      setStats({
        totalFarms: farmCount || 0,
        totalCrops: cropCount || 0,
        recentWork: workCount || 0,
        recentHarvest: harvestCount || 0,
        weatherRecords: weatherCount || 0
      })
    } catch (error) {
      console.error('ダッシュボードデータの取得に失敗しました:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'farms':
        router.push('/farms')
        break
      case 'crops':
        router.push('/crops')
        break
      case 'work':
        router.push('/work-records')
        break
                    case 'harvest':
                router.push('/harvest-records')
                break
              case 'weather':
                router.push('/weather')
                break
              default:
                break
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
      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* ページタイトル */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">ダッシュボード</h1>
            <p className="mt-2 text-gray-600">農場の活動状況を一目で確認できます</p>
          </div>

          {/* ダッシュボード統計 */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  農場数
                </CardTitle>
                <Tractor className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalFarms}</div>
                <p className="text-xs text-gray-500">登録済み農場</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  作物数
                </CardTitle>
                <Sprout className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalCrops}</div>
                <p className="text-xs text-gray-500">栽培中の作物</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  今週の作業
                </CardTitle>
                <Calendar className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.recentWork}</div>
                <p className="text-xs text-gray-500">作業記録数</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  今週の収穫
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.recentHarvest}</div>
                <p className="text-xs text-gray-500">収穫記録数</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  気象データ
                </CardTitle>
                <CloudRain className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.weatherRecords}</div>
                <p className="text-xs text-gray-500">今週の記録数</p>
              </CardContent>
            </Card>
          </div>

          {/* クイックアクション */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">クイックアクション</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  className="w-full justify-start h-12" 
                  variant="outline"
                  onClick={() => handleQuickAction('farms')}
                >
                  <Tractor className="h-5 w-5 mr-3" />
                  農場を管理
                </Button>
                <Button 
                  className="w-full justify-start h-12" 
                  variant="outline"
                  onClick={() => handleQuickAction('crops')}
                >
                  <Sprout className="h-5 w-5 mr-3" />
                  作物を管理
                </Button>
                <Button 
                  className="w-full justify-start h-12" 
                  variant="outline"
                  onClick={() => handleQuickAction('work')}
                >
                  <Calendar className="h-5 w-5 mr-3" />
                  作業を記録
                </Button>
                <Button 
                  className="w-full justify-start h-12" 
                  variant="outline"
                  onClick={() => handleQuickAction('harvest')}
                >
                  <BarChart3 className="h-5 w-5 mr-3" />
                  収穫を記録
                </Button>
                <Button 
                  className="w-full justify-start h-12" 
                  variant="outline"
                  onClick={() => handleQuickAction('weather')}
                >
                  <CloudRain className="h-5 w-5 mr-3" />
                  気象データを確認
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">今日の予定</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  今日の予定はありません
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 最近の活動 */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">最近の活動</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                まだ活動記録がありません
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

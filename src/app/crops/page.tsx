'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Edit, Trash2, Sprout, Calendar } from 'lucide-react'

interface Crop {
  id: string
  name: string
  variety: string | null
  farm_id: string
  planted_date: string
  expected_harvest_date: string | null
  status: 'planted' | 'growing' | 'harvested' | 'failed'
  created_at: string
  updated_at: string
  farms?: {
    id: string
    name: string
    location: string
  } | null
}

interface Farm {
  id: string
  name: string
  location: string
}

type CropStatus = 'planted' | 'growing' | 'harvested' | 'failed'

export default function CropsPage() {
  const [crops, setCrops] = useState<Crop[]>([])
  const [farms, setFarms] = useState<Farm[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    variety: '',
    farm_id: '',
    planted_date: '',
    expected_harvest_date: '',
    status: 'planted' as CropStatus
  })

  useEffect(() => {
    fetchCrops()
    fetchFarms()
  }, [])

  const fetchCrops = async () => {
    try {
      const { data, error } = await supabase
        .from('crops')
        .select(`
          *,
          farms:farm_id (
            id,
            name,
            location
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setCrops(data || [])
    } catch (error) {
      console.error('作物データの取得に失敗しました:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchFarms = async () => {
    try {
      const { data, error } = await supabase
        .from('farms')
        .select('id, name, location')
        .order('name')

      if (error) throw error
      setFarms(data || [])
    } catch (error) {
      console.error('農場データの取得に失敗しました:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const { error } = await supabase
        .from('crops')
        .insert([{
          name: formData.name,
          variety: formData.variety || null,
          farm_id: formData.farm_id,
          planted_date: formData.planted_date,
          expected_harvest_date: formData.expected_harvest_date || null,
          status: formData.status
        }])

      if (error) throw error

      // フォームをリセット
      setFormData({
        name: '',
        variety: '',
        farm_id: '',
        planted_date: '',
        expected_harvest_date: '',
        status: 'planted'
      })
      setShowAddForm(false)
      
      // データを再取得
      fetchCrops()
    } catch (error) {
      console.error('作物の追加に失敗しました:', error)
      alert('作物の追加に失敗しました')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('この作物を削除しますか？')) return

    try {
      const { error } = await supabase
        .from('crops')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      fetchCrops()
    } catch (error) {
      console.error('作物の削除に失敗しました:', error)
      alert('作物の削除に失敗しました')
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap = {
      planted: { label: '植付済み', color: 'bg-blue-100 text-blue-800' },
      growing: { label: '成長中', color: 'bg-green-100 text-green-800' },
      harvested: { label: '収穫済み', color: 'bg-gray-100 text-gray-800' },
      failed: { label: '失敗', color: 'bg-red-100 text-red-800' }
    }
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.planted
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    )
  }

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({...formData, status: e.target.value as CropStatus})
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
          {/* ページヘッダー */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">作物管理</h1>
              <p className="mt-2 text-gray-600">栽培中の作物を管理します</p>
            </div>
            <Button 
              onClick={() => setShowAddForm(true)}
              className="flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              新しい作物を追加
            </Button>
          </div>

          {/* 新規追加フォーム */}
          {showAddForm && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>新しい作物を追加</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">作物名</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="variety">品種</Label>
                      <Input
                        id="variety"
                        value={formData.variety}
                        onChange={(e) => setFormData({...formData, variety: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="farm">農場</Label>
                      <select
                        id="farm"
                        value={formData.farm_id}
                        onChange={(e) => setFormData({...formData, farm_id: e.target.value})}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                        required
                      >
                        <option value="">選択してください</option>
                        {farms.map((farm) => (
                          <option key={farm.id} value={farm.id}>
                            {farm.name} ({farm.location})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="status">ステータス</Label>
                      <select
                        id="status"
                        value={formData.status}
                        onChange={handleStatusChange}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                        required
                      >
                        <option value="planted">植付済み</option>
                        <option value="growing">成長中</option>
                        <option value="harvested">収穫済み</option>
                        <option value="failed">失敗</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="planted_date">植付日</Label>
                      <Input
                        id="planted_date"
                        type="date"
                        value={formData.planted_date}
                        onChange={(e) => setFormData({...formData, planted_date: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="expected_harvest_date">収穫予定日</Label>
                      <Input
                        id="expected_harvest_date"
                        type="date"
                        value={formData.expected_harvest_date}
                        onChange={(e) => setFormData({...formData, expected_harvest_date: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit">追加</Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowAddForm(false)}
                    >
                      キャンセル
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* 作物一覧 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {crops.map((crop) => (
              <Card key={crop.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Sprout className="h-5 w-5 mr-2 text-green-600" />
                      <span>{crop.name}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="icon" variant="ghost">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost"
                        onClick={() => handleDelete(crop.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">ステータス:</span>
                      {getStatusBadge(crop.status)}
                    </div>
                    
                    {crop.variety && (
                      <div className="text-sm">
                        <span className="font-medium">品種:</span> {crop.variety}
                      </div>
                    )}
                    
                    <div className="text-sm">
                      <span className="font-medium">農場:</span> {crop.farms?.name || '不明'}
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      植付: {new Date(crop.planted_date).toLocaleDateString('ja-JP')}
                    </div>
                    
                    {crop.expected_harvest_date && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        収穫予定: {new Date(crop.expected_harvest_date).toLocaleDateString('ja-JP')}
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-500">
                      作成日: {new Date(crop.created_at).toLocaleDateString('ja-JP')}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {crops.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-500">まだ作物が登録されていません</p>
                <Button 
                  onClick={() => setShowAddForm(true)}
                  className="mt-4"
                >
                  最初の作物を追加
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
} 
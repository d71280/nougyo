'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Edit, Trash2, Scale, Calendar, Star } from 'lucide-react'

interface HarvestRecord {
  id: string
  crop_id: string
  harvest_date: string
  quantity: number
  unit: string
  quality: 'excellent' | 'good' | 'fair' | 'poor'
  notes: string | null
  harvester_id: string | null
  created_at: string
  updated_at: string
  crops?: {
    id: string
    name: string
    variety: string | null
  } | null
  profiles?: {
    id: string
    name: string
    email: string
  } | null
}

interface Crop {
  id: string
  name: string
  variety: string | null
}

type Quality = 'excellent' | 'good' | 'fair' | 'poor'

export default function HarvestRecordsPage() {
  const [harvestRecords, setHarvestRecords] = useState<HarvestRecord[]>([])
  const [crops, setCrops] = useState<Crop[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    crop_id: '',
    harvest_date: new Date().toISOString().split('T')[0],
    quantity: '',
    unit: 'kg',
    quality: 'good' as Quality,
    notes: ''
  })

  useEffect(() => {
    fetchHarvestRecords()
    fetchCrops()
  }, [])

  const fetchHarvestRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('harvest_records')
        .select(`
          *,
          crops:crop_id (
            id,
            name,
            variety
          ),
          profiles:harvester_id (
            id,
            name,
            email
          )
        `)
        .order('harvest_date', { ascending: false })

      if (error) throw error
      setHarvestRecords(data || [])
    } catch (error) {
      console.error('収穫記録データの取得に失敗しました:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCrops = async () => {
    try {
      const { data, error } = await supabase
        .from('crops')
        .select('id, name, variety')
        .order('name')

      if (error) throw error
      setCrops(data || [])
    } catch (error) {
      console.error('作物データの取得に失敗しました:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // 一時的に固定のハーベスターIDを使用
      const tempHarvesterId = 'temp-harvester-id'

      const { error } = await supabase
        .from('harvest_records')
        .insert([{
          crop_id: formData.crop_id,
          harvest_date: formData.harvest_date,
          quantity: parseFloat(formData.quantity),
          unit: formData.unit,
          quality: formData.quality,
          notes: formData.notes || null,
          harvester_id: tempHarvesterId
        }])

      if (error) throw error

      // フォームをリセット
      setFormData({
        crop_id: '',
        harvest_date: new Date().toISOString().split('T')[0],
        quantity: '',
        unit: 'kg',
        quality: 'good',
        notes: ''
      })
      setShowAddForm(false)
      
      // データを再取得
      fetchHarvestRecords()
    } catch (error) {
      console.error('収穫記録の追加に失敗しました:', error)
      alert('収穫記録の追加に失敗しました')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('この収穫記録を削除しますか？')) return

    try {
      const { error } = await supabase
        .from('harvest_records')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      fetchHarvestRecords()
    } catch (error) {
      console.error('収穫記録の削除に失敗しました:', error)
      alert('収穫記録の削除に失敗しました')
    }
  }

  const getQualityBadge = (quality: string) => {
    const qualityMap = {
      excellent: { label: '優秀', color: 'bg-green-100 text-green-800', stars: 5 },
      good: { label: '良好', color: 'bg-blue-100 text-blue-800', stars: 4 },
      fair: { label: '普通', color: 'bg-yellow-100 text-yellow-800', stars: 3 },
      poor: { label: '不良', color: 'bg-red-100 text-red-800', stars: 2 }
    }
    const qualityInfo = qualityMap[quality as keyof typeof qualityMap] || qualityMap.good
    
    return (
      <div className="flex items-center gap-2">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${qualityInfo.color}`}>
          {qualityInfo.label}
        </span>
        <div className="flex">
          {[...Array(5)].map((_, i) => (
            <Star 
              key={i} 
              className={`h-3 w-3 ${i < qualityInfo.stars ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
            />
          ))}
        </div>
      </div>
    )
  }

  const handleQualityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({...formData, quality: e.target.value as Quality})
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
              <h1 className="text-3xl font-bold text-gray-900">収穫記録</h1>
              <p className="mt-2 text-gray-600">収穫量と品質を管理します</p>
            </div>
            <Button 
              onClick={() => setShowAddForm(true)}
              className="flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              新しい収穫記録を追加
            </Button>
          </div>

          {/* 新規追加フォーム */}
          {showAddForm && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>新しい収穫記録を追加</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="crop">作物</Label>
                      <select
                        id="crop"
                        value={formData.crop_id}
                        onChange={(e) => setFormData({...formData, crop_id: e.target.value})}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                        required
                      >
                        <option value="">選択してください</option>
                        {crops.map((crop) => (
                          <option key={crop.id} value={crop.id}>
                            {crop.name} {crop.variety && `(${crop.variety})`}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="harvest_date">収穫日</Label>
                      <Input
                        id="harvest_date"
                        type="date"
                        value={formData.harvest_date}
                        onChange={(e) => setFormData({...formData, harvest_date: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="quantity">収穫量</Label>
                      <Input
                        id="quantity"
                        type="number"
                        step="0.1"
                        value={formData.quantity}
                        onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="unit">単位</Label>
                      <select
                        id="unit"
                        value={formData.unit}
                        onChange={(e) => setFormData({...formData, unit: e.target.value})}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                        required
                      >
                        <option value="kg">kg</option>
                        <option value="g">g</option>
                        <option value="t">t</option>
                        <option value="個">個</option>
                        <option value="束">束</option>
                        <option value="箱">箱</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="quality">品質</Label>
                      <select
                        id="quality"
                        value={formData.quality}
                        onChange={handleQualityChange}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                        required
                      >
                        <option value="excellent">優秀</option>
                        <option value="good">良好</option>
                        <option value="fair">普通</option>
                        <option value="poor">不良</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="notes">メモ</Label>
                      <Input
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData({...formData, notes: e.target.value})}
                        placeholder="品質や状態についてのメモ"
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

          {/* 収穫記録一覧 */}
          <div className="space-y-4">
            {harvestRecords.map((record) => (
              <Card key={record.id}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <Scale className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-lg">
                          {record.crops?.name || '不明'} {record.crops?.variety && `(${record.crops.variety})`}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                          <span>{new Date(record.harvest_date).toLocaleDateString('ja-JP')}</span>
                        </div>
                        
                        <div>
                          <span className="font-medium text-gray-600">収穫量:</span>
                          <div className="text-lg font-bold text-green-600">
                            {record.quantity} {record.unit}
                          </div>
                        </div>
                        
                        <div>
                          <span className="font-medium text-gray-600">品質:</span>
                          <div className="mt-1">
                            {getQualityBadge(record.quality)}
                          </div>
                        </div>
                        
                        {record.profiles && (
                          <div>
                            <span className="font-medium text-gray-600">収穫者:</span>
                            <div>{record.profiles.name}</div>
                          </div>
                        )}
                      </div>
                      
                      {record.notes && (
                        <div className="mt-3 text-sm">
                          <span className="font-medium text-gray-600">メモ:</span> {record.notes}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <Button size="icon" variant="ghost">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost"
                        onClick={() => handleDelete(record.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {harvestRecords.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-500">まだ収穫記録がありません</p>
                <Button 
                  onClick={() => setShowAddForm(true)}
                  className="mt-4"
                >
                  最初の収穫記録を追加
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
} 
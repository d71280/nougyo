'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Edit, Trash2, Clock, Calendar } from 'lucide-react'

interface WorkRecord {
  id: string
  crop_id: string
  work_type: 'planting' | 'watering' | 'fertilizing' | 'pesticide' | 'harvesting' | 'weeding' | 'pruning' | 'other'
  description: string
  work_date: string
  hours_spent: number | null
  materials_used: string | null
  worker_id: string | null
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

type WorkType = 'planting' | 'watering' | 'fertilizing' | 'pesticide' | 'harvesting' | 'weeding' | 'pruning' | 'other'

export default function WorkRecordsPage() {
  const [workRecords, setWorkRecords] = useState<WorkRecord[]>([])
  const [crops, setCrops] = useState<Crop[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    crop_id: '',
    work_type: 'watering' as WorkType,
    description: '',
    work_date: new Date().toISOString().split('T')[0],
    hours_spent: '',
    materials_used: ''
  })

  useEffect(() => {
    fetchWorkRecords()
    fetchCrops()
  }, [])

  const fetchWorkRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('work_records')
        .select(`
          *,
          crops:crop_id (
            id,
            name,
            variety
          ),
          profiles:worker_id (
            id,
            name,
            email
          )
        `)
        .order('work_date', { ascending: false })

      if (error) throw error
      setWorkRecords(data || [])
    } catch (error) {
      console.error('作業記録データの取得に失敗しました:', error)
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
      // 一時的に固定のワーカーIDを使用
      const tempWorkerId = 'temp-worker-id'

      const { error } = await supabase
        .from('work_records')
        .insert([{
          crop_id: formData.crop_id,
          work_type: formData.work_type,
          description: formData.description,
          work_date: formData.work_date,
          hours_spent: formData.hours_spent ? parseFloat(formData.hours_spent) : null,
          materials_used: formData.materials_used || null,
          worker_id: tempWorkerId
        }])

      if (error) throw error

      // フォームをリセット
      setFormData({
        crop_id: '',
        work_type: 'watering',
        description: '',
        work_date: new Date().toISOString().split('T')[0],
        hours_spent: '',
        materials_used: ''
      })
      setShowAddForm(false)
      
      // データを再取得
      fetchWorkRecords()
    } catch (error) {
      console.error('作業記録の追加に失敗しました:', error)
      alert('作業記録の追加に失敗しました')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('この作業記録を削除しますか？')) return

    try {
      const { error } = await supabase
        .from('work_records')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      fetchWorkRecords()
    } catch (error) {
      console.error('作業記録の削除に失敗しました:', error)
      alert('作業記録の削除に失敗しました')
    }
  }

  const getWorkTypeBadge = (workType: string) => {
    const typeMap = {
      planting: { label: '植付', color: 'bg-green-100 text-green-800' },
      watering: { label: '水やり', color: 'bg-blue-100 text-blue-800' },
      fertilizing: { label: '施肥', color: 'bg-yellow-100 text-yellow-800' },
      pesticide: { label: '農薬', color: 'bg-red-100 text-red-800' },
      harvesting: { label: '収穫', color: 'bg-purple-100 text-purple-800' },
      weeding: { label: '除草', color: 'bg-orange-100 text-orange-800' },
      pruning: { label: '剪定', color: 'bg-indigo-100 text-indigo-800' },
      other: { label: 'その他', color: 'bg-gray-100 text-gray-800' }
    }
    const typeInfo = typeMap[workType as keyof typeof typeMap] || typeMap.other
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeInfo.color}`}>
        {typeInfo.label}
      </span>
    )
  }

  const handleWorkTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({...formData, work_type: e.target.value as WorkType})
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
              <h1 className="text-3xl font-bold text-gray-900">作業記録</h1>
              <p className="mt-2 text-gray-600">農作業の記録を管理します</p>
            </div>
            <Button 
              onClick={() => setShowAddForm(true)}
              className="flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              新しい作業記録を追加
            </Button>
          </div>

          {/* 新規追加フォーム */}
          {showAddForm && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>新しい作業記録を追加</CardTitle>
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
                      <Label htmlFor="work_type">作業種類</Label>
                      <select
                        id="work_type"
                        value={formData.work_type}
                        onChange={handleWorkTypeChange}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                        required
                      >
                        <option value="watering">水やり</option>
                        <option value="planting">植付</option>
                        <option value="fertilizing">施肥</option>
                        <option value="pesticide">農薬</option>
                        <option value="weeding">除草</option>
                        <option value="pruning">剪定</option>
                        <option value="harvesting">収穫</option>
                        <option value="other">その他</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="description">作業内容</Label>
                      <Input
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="work_date">作業日</Label>
                      <Input
                        id="work_date"
                        type="date"
                        value={formData.work_date}
                        onChange={(e) => setFormData({...formData, work_date: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="hours_spent">作業時間（時間）</Label>
                      <Input
                        id="hours_spent"
                        type="number"
                        step="0.5"
                        value={formData.hours_spent}
                        onChange={(e) => setFormData({...formData, hours_spent: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="materials_used">使用資材</Label>
                      <Input
                        id="materials_used"
                        value={formData.materials_used}
                        onChange={(e) => setFormData({...formData, materials_used: e.target.value})}
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

          {/* 作業記録一覧 */}
          <div className="space-y-4">
            {workRecords.map((record) => (
              <Card key={record.id}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        {getWorkTypeBadge(record.work_type)}
                        <span className="font-medium text-lg">{record.description}</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-600">作物:</span>
                          <div>{record.crops?.name || '不明'} {record.crops?.variety && `(${record.crops.variety})`}</div>
                        </div>
                        
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                          <span>{new Date(record.work_date).toLocaleDateString('ja-JP')}</span>
                        </div>
                        
                        {record.hours_spent && (
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2 text-gray-500" />
                            <span>{record.hours_spent}時間</span>
                          </div>
                        )}
                        
                        {record.profiles && (
                          <div>
                            <span className="font-medium text-gray-600">作業者:</span>
                            <div>{record.profiles.name}</div>
                          </div>
                        )}
                      </div>
                      
                      {record.materials_used && (
                        <div className="mt-3 text-sm">
                          <span className="font-medium text-gray-600">使用資材:</span> {record.materials_used}
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

          {workRecords.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-500">まだ作業記録がありません</p>
                <Button 
                  onClick={() => setShowAddForm(true)}
                  className="mt-4"
                >
                  最初の作業記録を追加
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
} 
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Edit, Trash2, MapPin } from 'lucide-react'

interface Farm {
  id: string
  name: string
  location: string
  area: number
  owner_id: string
  created_at: string
  updated_at: string
  profiles?: {
    id: string
    name: string
    email: string
  } | null
}

export default function FarmsPage() {
  const [farms, setFarms] = useState<Farm[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    area: ''
  })

  useEffect(() => {
    fetchFarms()
  }, [])

  const fetchFarms = async () => {
    try {
      const { data, error } = await supabase
        .from('farms')
        .select(`
          *,
          profiles:owner_id (
            id,
            name,
            email
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setFarms(data || [])
    } catch (error) {
      console.error('農場データの取得に失敗しました:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // 現在のユーザーIDを取得
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        alert('ログインが必要です')
        return
      }

      const { error } = await supabase
        .from('farms')
        .insert([{
          name: formData.name,
          location: formData.location,
          area: parseFloat(formData.area),
          owner_id: user.id
        }])

      if (error) throw error

      // フォームをリセット
      setFormData({ name: '', location: '', area: '' })
      setShowAddForm(false)
      
      // データを再取得
      fetchFarms()
    } catch (error) {
      console.error('農場の追加に失敗しました:', error)
      alert('農場の追加に失敗しました')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('この農場を削除しますか？')) return

    try {
      const { error } = await supabase
        .from('farms')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      fetchFarms()
    } catch (error) {
      console.error('農場の削除に失敗しました:', error)
      alert('農場の削除に失敗しました')
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
          {/* ページヘッダー */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">農場管理</h1>
              <p className="mt-2 text-gray-600">農場の情報を管理します</p>
            </div>
            <Button 
              onClick={() => setShowAddForm(true)}
              className="flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              新しい農場を追加
            </Button>
          </div>

          {/* 新規追加フォーム */}
          {showAddForm && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>新しい農場を追加</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="name">農場名</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="location">所在地</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="area">面積 (ヘクタール)</Label>
                      <Input
                        id="area"
                        type="number"
                        step="0.1"
                        value={formData.area}
                        onChange={(e) => setFormData({...formData, area: e.target.value})}
                        required
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

          {/* 農場一覧 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {farms.map((farm) => (
              <Card key={farm.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{farm.name}</span>
                    <div className="flex gap-2">
                      <Button size="icon" variant="ghost">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost"
                        onClick={() => handleDelete(farm.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      {farm.location}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">面積:</span> {farm.area} ヘクタール
                    </div>
                    <div className="text-xs text-gray-500">
                      作成日: {new Date(farm.created_at).toLocaleDateString('ja-JP')}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {farms.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-500">まだ農場が登録されていません</p>
                <Button 
                  onClick={() => setShowAddForm(true)}
                  className="mt-4"
                >
                  最初の農場を追加
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
} 
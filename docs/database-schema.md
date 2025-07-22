# 農業管理システム データベース設計

## 📊 データベース統計（現在）

- **プロフィール**: 7名（農業者・作業員）
- **農場**: 6箇所
- **作物**: 12種類（8つが成長中、4つが収穫済み）
- **作業記録**: 13件
- **収穫記録**: 9件
- **合計収穫量**: 245.60 kg

## 🗄️ テーブル構造

### 1. profiles（ユーザープロフィール）
```sql
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    role TEXT NOT NULL DEFAULT 'farmer' CHECK (role IN ('farmer', 'admin')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

**目的**: システム利用者の管理
**フィールド説明**:
- `role`: 'farmer'（農業者）または 'admin'（管理者）

### 2. farms（農場）
```sql
CREATE TABLE public.farms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    area DECIMAL(10, 2) NOT NULL CHECK (area > 0),
    owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

**目的**: 農場の基本情報管理
**フィールド説明**:
- `area`: 面積（ヘクタール単位）
- `owner_id`: 農場所有者のプロフィールID

### 3. crops（作物）
```sql
CREATE TABLE public.crops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    variety TEXT,
    farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE NOT NULL,
    planted_date DATE NOT NULL,
    expected_harvest_date DATE,
    status TEXT NOT NULL DEFAULT 'planted' CHECK (status IN ('planted', 'growing', 'harvested', 'failed')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

**目的**: 作物のライフサイクル管理
**フィールド説明**:
- `status`: 植付済み→成長中→収穫済み/失敗
- `variety`: 品種名（オプション）

### 4. work_records（作業記録）
```sql
CREATE TABLE public.work_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crop_id UUID REFERENCES public.crops(id) ON DELETE CASCADE NOT NULL,
    work_type TEXT NOT NULL CHECK (work_type IN ('planting', 'watering', 'fertilizing', 'pesticide', 'harvesting', 'weeding', 'pruning', 'other')),
    description TEXT NOT NULL,
    work_date DATE NOT NULL DEFAULT CURRENT_DATE,
    hours_spent DECIMAL(5, 2),
    materials_used TEXT,
    worker_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

**目的**: 日々の農作業の記録
**フィールド説明**:
- `work_type`: 作業種類（植付、水やり、施肥、農薬、収穫、除草、剪定、その他）
- `hours_spent`: 作業時間（時間単位）

### 5. harvest_records（収穫記録）
```sql
CREATE TABLE public.harvest_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crop_id UUID REFERENCES public.crops(id) ON DELETE CASCADE NOT NULL,
    harvest_date DATE NOT NULL DEFAULT CURRENT_DATE,
    quantity DECIMAL(10, 2) NOT NULL CHECK (quantity > 0),
    unit TEXT NOT NULL DEFAULT 'kg',
    quality TEXT NOT NULL DEFAULT 'good' CHECK (quality IN ('excellent', 'good', 'fair', 'poor')),
    notes TEXT,
    harvester_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

**目的**: 収穫量と品質の記録
**フィールド説明**:
- `quality`: 品質レベル（優秀、良好、普通、不良）
- `unit`: 単位（kg、g、t、個、束、箱など）

## 🔗 リレーションシップ

```
profiles (1) ←→ (N) farms (owner_id)
farms (1) ←→ (N) crops (farm_id)
crops (1) ←→ (N) work_records (crop_id)
crops (1) ←→ (N) harvest_records (crop_id)
profiles (1) ←→ (N) work_records (worker_id)
profiles (1) ←→ (N) harvest_records (harvester_id)
```

## 📈 パフォーマンス最適化

### インデックス
```sql
-- 検索パフォーマンス向上のためのインデックス
CREATE INDEX idx_farms_owner_id ON public.farms(owner_id);
CREATE INDEX idx_crops_farm_id ON public.crops(farm_id);
CREATE INDEX idx_crops_status ON public.crops(status);
CREATE INDEX idx_work_records_crop_id ON public.work_records(crop_id);
CREATE INDEX idx_work_records_work_date ON public.work_records(work_date);
CREATE INDEX idx_harvest_records_crop_id ON public.harvest_records(crop_id);
CREATE INDEX idx_harvest_records_harvest_date ON public.harvest_records(harvest_date);
```

## 👁️ ビュー（便利なデータアクセス）

### 1. farm_overview（農場概要）
農場ごとの作物数、成長中・収穫済み作物の統計

### 2. crop_details（作物詳細）
作物の詳細情報と関連する作業・収穫記録の統計

### 3. recent_activities（最近の活動）
作業記録と収穫記録を統合した最近の活動一覧

## 🔒 セキュリティ（RLS - Row Level Security）

全てのテーブルでRLSが有効化されており、以下のポリシーが適用されています：

- **基本原則**: ユーザーは自分に関連するデータのみアクセス可能
- **管理者権限**: 管理者ロールは全データにアクセス可能
- **読み取り**: 基本的に全ユーザーが閲覧可能
- **書き込み**: 所有者のみ編集・削除可能

## 📝 サンプルデータ例

### 農場例
- 田中農場（静岡県浜松市、2.5ha）
- 佐藤ファーム（長野県安曇野市、1.8ha）
- みどりの丘農園（北海道帯広市、5.0ha）

### 作物例
- トマト（桃太郎）、きゅうり（夏すずみ）
- レタス（サニーレタス）、キャベツ（春キャベツ）
- 大根（青首大根）、人参（向陽二号）

### 作業種類
- 植付、水やり、施肥、農薬散布
- 収穫、除草、剪定、その他

## 🚀 今後の拡張予定

- **天気データ連携テーブル**
- **在庫管理テーブル**
- **販売記録テーブル**
- **機械・設備管理テーブル**
- **財務管理テーブル**

---

このデータベース設計により、効率的な農業経営管理が可能になります。 
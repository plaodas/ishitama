# 石魂 ～Spirit of Stone～

石の写真から深度を推定し、点群・波動・歌として可視化する Web MVP。

## 構成

- `frontend/` … Vite + React（静的ホスト / Vercel 想定）
- `backend/` … FastAPI + Depth Anything V2 Small / ONNX Runtime CPU（Railway / Render 想定）

画像保存とユーザー管理はない。画像はメモリ上で処理し、応答後に破棄する。

深度推定は Depth Anything V2 Small を CPU 上の ONNX Runtime で実行する。PyTorch CUDA 一式は載せない。

## ローカル起動

別ターミナルでバックエンドとフロントを起動する。

### バックエンド

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
pip install -r requirements-dev.txt
export BACKEND_CORS_ORIGINS="http://localhost:3000,http://127.0.0.1:3000"
uvicorn app.main:app --reload --port 8000
```

初回起動時に GitHub Release から Depth Anything V2 Small の ONNX を取得する。`DEPTH_MODEL_PATH` でローカルファイルを指定してもよい。メモリは 2GB 以上を想定。

### フロントエンド

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

ブラウザで `http://localhost:3000` を開き、石の写真を選んで「詠唱」する。

## API

`POST /api/stone/analyze`

- 入力: `multipart/form-data` の `image`（jpg / png、8MB まで）
- 出力: `pointCloud` / `sound` / `wave` / `message`

## Docker（バックエンド）

```bash
cd backend
docker build -t ishitama-api .
docker run --rm -p 8000:8000 -e BACKEND_CORS_ORIGINS="http://localhost:3000" ishitama-api
```

Railway / Render ではメモリ 2GB 以上、リクエストタイムアウト 60 秒以上を想定する。フロントの `VITE_API_URL` にバックエンド URL を設定する。

## 静的解析

```bash
make lint
```

- フロント: ESLint（TypeScript + React Hooks）と `tsc --noEmit`
- バックエンド: Ruff（lint / format）と mypy

自動修正は `make lint-fix`。フロントだけなら `cd frontend && npm run lint`、バックエンドだけなら `cd backend && ruff check app`。

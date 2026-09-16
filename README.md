# 石魂 ～Spirit of Stone～

石の写真から深度を推定し、点群・波動・歌として可視化する Web MVP。

フリーランスエンジニア [plaodas](https://github.com/plaodas) のポートフォリオ作品です。MIT License で公開しています。

- 公開サイト: [https://ishitama.vercel.app/](https://ishitama.vercel.app/)
- ソースコード: [https://github.com/plaodas/ishitama](https://github.com/plaodas/ishitama)

## キャプチャ

初期画面。石の写真を選んで「詠唱」する。

![石魂の初期画面](docs/screenshot-idle.png)

詠唱後。深度から点群を生成し、音色・波動・メッセージを返す。

![石魂の詠唱結果](docs/screenshot-result.png)

## できること

- 石の写真（jpg / png）から Depth Anything V2 Small で深度を推定
- 点群として立体を表示（Three.js）
- 色と深度から 12 種類の音色を割り当て、Tone.js で再生
- 中央ラインの波動と点群の呼吸・明滅を音の Pulse に同期
- 画像はサーバに保存せず、メモリ上で処理して応答後に破棄

## 構成

| 領域 | 技術 | ホスト |
| --- | --- | --- |
| `frontend/` | Vite + React + Three.js + Tone.js | [Vercel](https://ishitama.vercel.app/) |
| `backend/` | FastAPI + ONNX Runtime CPU | Railway |

深度推定は Depth Anything V2 Small の ONNX を CPU で実行する。PyTorch CUDA 一式は載せない。

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

本番では frontend を Vercel、backend を Railway に載せている。Railway はメモリ 2GB 以上、リクエストタイムアウト 60 秒以上を想定する。フロントの `VITE_API_URL` にバックエンド URL を設定する。

## 静的解析

```bash
make lint
```

- フロント: ESLint（TypeScript + React Hooks）と `tsc --noEmit`
- バックエンド: Ruff（lint / format）と mypy

自動修正は `make lint-fix`。フロントだけなら `cd frontend && npm run lint`、バックエンドだけなら `cd backend && ruff check app`。

## ライセンス

[MIT License](LICENSE)

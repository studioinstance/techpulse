---
title: "Docker入門：コンテナ技術を30分で理解する"
emoji: "🐳"
type: "tech"
topics: ["Docker", "コンテナ", "DevOps", "初心者向け"]
published: true
---

Docker初心者向けの完全ガイドです。コンテナの概念から実践的な使い方まで、30分で理解できるように解説します。

## Dockerとは？

Dockerは**コンテナ型仮想化技術**のプラットフォームです。「自分の環境では動くのに…」という問題を根本的に解決します。

### VMとコンテナの違い

- **仮想マシン**：OS全体を仮想化 → 重い（GBレベル）、起動に分単位
- **コンテナ**：アプリ + 依存関係のみ → 軽い（MBレベル）、起動は秒単位

## 基本コマンド

```bash
# コンテナの起動
docker run -d --name my-app -p 3000:3000 node:20-slim

# 実行中のコンテナ一覧
docker ps

# コンテナのログ確認
docker logs my-app

# コンテナ内でコマンド実行
docker exec -it my-app bash
```

## Dockerfileの書き方

```dockerfile
FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-slim AS production
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
USER node
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

:::message
**マルチステージビルド**を使うと、ビルドツールが本番イメージに含まれず、サイズを大幅に削減できます。
:::

## docker-composeで複数コンテナ管理

```yaml
version: '3.8'
services:
  app:
    build: .
    ports: ['3000:3000']
    depends_on: [db, cache]
  db:
    image: postgres:16
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
  cache:
    image: redis:7-alpine
```

---

**全文はこちらで読めます 👇**
https://studioinstance.github.io/techpulse/articles/docker-introduction.html

他にもWeb開発、AI、クラウドに関する記事を公開しています。
**TechPulse**: https://studioinstance.github.io/techpulse/

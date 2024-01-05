# ecp-web

```
## responsive, progressive

## react

## chakra ui

## barcode scanner

## OCR

## web push

## SSE
```

# Initialize

## create-react-app, yarn berry

```
npm i -g corepack
corepack enable

// volta 를 쓰고 있으면
corepack enable --install-directory ~/.volta/bin

// CRA 설치
npx create-react-app@latest .

// npm 기반 데이터 삭제
rm -rf node_modules
rm -rf package.lock.json

// berry로 변경
yarn set version berry

// package.json 변경
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1"
  },

  eslintConfig는 삭제.

// install
yarn install

// start
yarn start
```

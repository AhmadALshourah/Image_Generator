# Artifex — أوامر التشغيل

## المتطلبات
- Python 3.11+
- Node.js 18+
- مفتاح OpenAI API

---

## الإعداد الأول (مرة واحدة فقط)

### Backend
```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
copy .env.example .env      # Windows
cp .env.example .env        # macOS / Linux
# افتح .env وضع مفتاح OpenAI في OPENAI_API_KEY
```

### Frontend
```bash
cd frontend
npm install
```

---

## التشغيل اليومي

### Backend (terminal 1)
```bash
cd backend
venv\Scripts\activate        # Windows
source venv/bin/activate     # macOS / Linux

python -m uvicorn app.main:app --reload --port 8000
```
الـ API متاح على: `http://localhost:8000`
الـ Swagger docs: `http://localhost:8000/docs`

### Frontend (terminal 2)
```bash
cd frontend
npm run dev
```
التطبيق على: `http://localhost:5173`

---

## Docker (بديل عن الأمرين أعلاه)
```bash
# في جذر المشروع
copy .env.example .env      # Windows
cp .env.example .env        # macOS / Linux
# ضع مفتاح OpenAI في .env

docker compose up --build
```
التطبيق على: `http://localhost:8080`

---

## الاختبارات

### Backend
```bash
cd backend
venv\Scripts\activate
pytest                        # كل الاختبارات
pytest -v                     # مع تفاصيل
pytest tests/test_images.py   # ملف محدد
```

### Frontend
```bash
cd frontend
npm run test                  # تشغيل مرة واحدة
npm run test:watch            # وضع المراقبة
npm run typecheck             # فحص TypeScript فقط
```

---

## ملاحظات

- **أول تشغيل:** ستظهر شاشة "Create your account" — أنشئ حسابك مرة واحدة.
- **بعد ذلك:** ستظهر شاشة تسجيل الدخول في كل مرة.
- **تغيير إعدادات Auth:** عدّل `AUTH_ENABLED` في `backend/.env` ثم أعد تشغيل الـ backend.

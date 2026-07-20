# بدء التشغيل السريع - Jasper's Market WhatsApp Bot with AI

## 🎯 الخطوات الأساسية

### 1. تثبيت المكتبات
```bash
npm install
```

### 2. إعداد البيانات المفقودة
قم بتعديل ملف `.env` وأضف بيانات Facebook الخاصة بك:

```env
ACCESS_TOKEN=<your_facebook_access_token>
APP_SECRET=<your_facebook_app_secret>
APP_ID=<your_facebook_app_id>
VERIFY_TOKEN=<your_verify_token>
```

### 3. بدء التشغيل
```bash
npm start
```

أو:
```bash
node app.js
```

### 4. اختبار الاتصال بـ Gemini AI (اختياري)
```bash
node test-ai.js
```

---

## 🔧 الإعدادات المتقدمة

### تغيير نموذج Gemini
استخدم أي من النماذج التالية:
- `gemini-1.5-flash` ⚡ (سريع ورخيص - الافتراضي)
- `gemini-1.5-pro` 🚀 (أكثر قوة)
- `gemini-2.0-flash` ✨ (الأحدث)

في ملف `.env`:
```
GEMINI_MODEL=gemini-1.5-pro
```

### استخدام Redis محلي
تأكد من تشغيل Redis:
```bash
redis-server --daemonize yes
```

---

## 🚀 بعد التشغيل

1. استخدم ngrok لـ tunneling المحلي:
```bash
ngrok http 8080
```

2. سجل عنوان webhook في Facebook (مثال):
```
https://YOUR_NGROK_ID.ngrok.io/webhook
```

3. ابدأ الإرسال من WhatsApp!

---

## 📱 أمثلة الاستخدام

**المستخدم يرسل:** "هل لديكم تفاح؟"
**الرد التلقائي:** رد ذكي من Gemini

**المستخدم يرسل:** "What are your hours?"
**الرد التلقائي:** رد ذكي بالإنجليزية

**المستخدم يضغط زر:** "Shop online"
**الرد:** رسالة تفاعلية مع صور

---

## ⚠️ استكشاف الأخطاء

| المشكلة | الحل |
|--------|------|
| `Cannot find module @google/generative-ai` | شغّل `npm install` |
| `GEMINI_API_KEY is not set` | تأكد من ملف `.env` |
| لا توجد ردود | تحقق من اتصال Redis |
| خطأ 403 من Facebook | تحقق من ACCESS_TOKEN و APP_SECRET |

---

## 📚 ملفات إضافية

- `AI_SETUP.md` - وثائق شاملة عن النظام الذكي
- `test-ai.js` - ملف اختبار الاتصال بـ Gemini
- `.env` - متغيرات البيئة (لا تنسه في .gitignore)

---

**تم الإعداد بنجاح! 🎉**

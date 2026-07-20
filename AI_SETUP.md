# نظام الرد الذكي - Jasper's Market WhatsApp Bot

## نظرة عامة

تم تحسين تطبيق Jasper's Market WhatsApp Bot بإضافة نظام رد آلي ذكي يستخدم **Google Generative AI (Gemini)**. يسمح هذا النظام بـ:

- **الرد الآلي على الرسائل النصية** باستخدام الذكاء الاصطناعي
- **الحفاظ على الرسائل التفاعلية القديمة** (الأزرار والقوائم والعروض)
- **دعم المحادثات الطبيعية** مع العملاء

---

## المتطلبات الجديدة

### 1. مفتاح Google Gemini API
- اذهب إلى [Google AI Studio](https://makersuite.google.com/app/apikey)
- أنشئ API key جديد
- احفظ المفتاح في ملف `.env` الخاص بك

### 2. تثبيت المكتبات الجديدة
```bash
npm install
```

سيتم تثبيت مكتبة `@google/generative-ai` تلقائياً.

---

## إعداد الخادم

### 1. نسخ ملف البيئة

```bash
cp .sample.env .env
```

### 2. تحديث `.env` بمفاتيحك

```env
# Facebook App Configuration
ACCESS_TOKEN=<your_access_token>
APP_SECRET=<your_app_secret>
APP_ID=<your_app_id>
VERIFY_TOKEN=<your_verify_token>

# Server Configuration
PORT=8080

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# Google Gemini API Configuration
GEMINI_API_KEY=<your_gemini_api_key>
GEMINI_MODEL=gemini-pro
```

### 3. بدء الخادم

```bash
npm start
```

أو:

```bash
node app.js
```

---

## كيفية عمل النظام

### معالجة الرسائل

1. **الرسائل التفاعلية** (Interactive Messages):
   - يتم معالجتها بنفس الطريقة القديمة
   - تشمل الأزرار والعروض والمحتوى المتعدد

2. **الرسائل النصية** (Text Messages):
   - يتم إرسالها إلى خدمة Google Gemini AI
   - تُرجع الخدمة رد آلي ذكي
   - يتم إرسال الرد مباشرة إلى العميل

3. **رسائل غير معروفة**:
   - يتم عرض رسالة الترحيب الافتراضية

---

## البنية الجديدة للملفات

```
services/
├── ai.js              # ✨ جديد: خدمة Google Gemini AI
├── config.js          # محدّث: إضافة متغيرات Gemini
├── conversation.js    # محدّث: دعم الرسائل النصية الذكية
├── message.js         # محدّث: استخراج نص الرسالة
├── graph-api.js       # محدّث: إضافة دالة sendMessage
├── redis.js
├── status.js
└── constants.js
```

---

## أمثلة الاستخدام

### سيناريو 1: رسالة نصية عادية
**المستخدم**: "هل لديكم تفاح طازج؟"
**الرد الذكي**: رد تلقائي من Gemini يتضمن معلومات عن المنتجات

### سيناريو 2: سؤال عام
**المستخدم**: "ما ساعات العمل؟"
**الرد الذكي**: معلومة مساعدة من Gemini

### سيناريو 3: اختيار من الأزرار
**المستخدم**: يضغط على زر "Shop online"
**الرد**: رسالة تفاعلية مع الصور والعروض (كما هي)

---

## متغيرات البيئة المهمة

| المتغير | الوصف | المثال |
|--------|-------|---------|
| `GEMINI_API_KEY` | مفتاح Google Gemini API | `AIzaSyD...` |
| `GEMINI_MODEL` | نموذج Gemini المستخدم | `gemini-pro` |
| `REDIS_HOST` | عنوان خادم Redis | `localhost` |
| `REDIS_PORT` | منفذ Redis | `6379` |

---

## معالجة الأخطاء

إذا فشلت خدمة Google Gemini AI:
- يتم تسجيل الخطأ تلقائياً
- يتم عرض رسالة احتياطية للعميل
- يستمر التطبيق في العمل بدون توقف

---

## نصائح للاستخدام الأمثل

### 1. جودة الردود
- كلما كان نص المستخدم واضحاً، كلما كان الرد أفضل
- الخدمة الذكية تحاول فهم السياق والغرض

### 2. الحدود والقيود
- كل رد محدود بـ 256 حرف تقريباً (مناسب لـ WhatsApp)
- الخدمة تحتفظ بسياق المحادثة داخل جلسة واحدة

### 3. التكاليف
- Google Gemini API لها نموذج تسعير
- راقب استخدامك من خلال Google Cloud Console

---

## استكشاف الأخطاء

### المشكلة: "Invalid API Key"
- تأكد من نسخ مفتاح Gemini بشكل صحيح
- تحقق من أن المفتاح نشط في Google Cloud Console

### المشكلة: لا ترد الخدمة على الرسائل
- تحقق من أن `REDIS_HOST` و `REDIS_PORT` صحيحة
- تأكد من أن Redis يعمل بشكل صحيح

### المشكلة: الأخطاء في السجلات (Console Logs)
- اقرأ رسالة الخطأ بعناية
- تحقق من متغيرات البيئة جميعها

---

## المراجع

- [Google Generative AI Docs](https://ai.google.dev/)
- [WhatsApp Business API Docs](https://developers.facebook.com/docs/whatsapp/cloud-api/overview)
- [Jasper's Market Original Repo](https://github.com/fbsamples/whatsapp-business-jaspers-market)

---

## الترخيص

BSD License - انظر ملف LICENSE

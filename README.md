# 🤖 AI Platform - منصة الذكاء الاصطناعي

منصة متكاملة للذكاء الاصطناعي تدعم النماذج المحلية والسحابية مع واجهة مستخدم حديثة ومتجاوبة.

## ✨ المميزات

### 🧠 الذكاء الاصطناعي
- **نماذج سحابية**: OpenAI, Anthropic, Google, Mistral, وغيرها
- **نماذج محلية**: Ollama, LM Studio, Together AI
- **وكلاء ذكاء اصطناعي**: وكلاء متخصصة للمهام المختلفة
- **معالجة محادثات متقدمة**: دعم السياق والذاكرة

### 🛠️ أدوات التطوير
- **WebContainer**: بيئة تطوير كاملة في المتصفح
- **محرر كود متقدم**: CodeMirror مع دعم TypeScript
- **Terminal مدمج**: Xterm.js مع دعم أوامر Unix
- **Git Integration**: استيراد وإدارة المشاريع من GitHub

### 📱 منصات متعددة
- **Web Application**: تطبيق ويب متجاوب
- **Desktop App**: تطبيق سطح المكتب مع Electron
- **Mobile Apps**: تطبيقات Android/iOS مع Capacitor

### 🔧 إدارة الحالة
- **Zustand**: إدارة حالة متقدمة
- **Nanostores**: إدارة حالة خفيفة الوزن
- **IndexedDB**: تخزين محلي للمحادثات والبيانات

## 🚀 النشر على Cloudflare Pages

### المتطلبات المسبقة
- حساب Cloudflare
- Wrangler CLI مثبت
- Node.js 18+ و pnpm

### 1. إعداد المشروع

```bash
# استنساخ المشروع
git clone <repository-url>
cd ai-platform

# تثبيت التبعيات
pnpm install

# إعداد البيئة
cp .env.example .env
# تحرير .env وإضافة المتغيرات المطلوبة
```

### 2. إعداد Cloudflare

```bash
# تسجيل الدخول إلى Cloudflare
wrangler login

# إنشاء مشاريع Pages
pnpm setup:cloudflare

# إنشاء خدمات Cloudflare
pnpm setup:all
```

### 3. تكوين المتغيرات البيئية

في Cloudflare Dashboard، أضف المتغيرات التالية:

#### AI Providers
```
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
GOOGLE_API_KEY=your_google_key
MISTRAL_API_KEY=your_mistral_key
```

#### Database
```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key
```

#### Authentication
```
AUTH_SECRET=your_auth_secret
SESSION_SECRET=your_session_secret
```

### 4. النشر

```bash
# بناء التطبيق
pnpm build

# النشر على البيئة المطلوبة
pnpm deploy:dev      # بيئة التطوير
pnpm deploy:staging  # بيئة الاختبار
pnpm deploy:prod     # بيئة الإنتاج

# أو النشر على جميع البيئات
pnpm deploy:all
```

### 5. مراقبة التطبيق

```bash
# مراقبة السجلات
pnpm wrangler:tail

# فحص صحة التطبيق
pnpm health:check

# اختبار الأداء
pnpm performance:test
```

## 🛠️ التطوير المحلي

### تشغيل التطبيق

```bash
# وضع التطوير
pnpm dev

# معاينة البناء
pnpm preview

# اختبار الوحدة
pnpm test

# فحص النوع
pnpm typecheck
```

### أدوات التطوير

```bash
# تنظيف الكاش
pnpm clean

# إعادة تثبيت التبعيات
pnpm reinstall

# تحليل حجم الباندل
pnpm bundle:analyze

# فحص الأمان
pnpm security:scan
```

## 📱 تطبيقات سطح المكتب والجوال

### تطبيق سطح المكتب

```bash
# بناء تطبيق Electron
pnpm electron:build

# تشغيل في وضع التطوير
pnpm electron:dev
```

### تطبيقات الجوال

```bash
# إعداد Capacitor
pnpm capacitor:build

# تشغيل على Android
pnpm capacitor:run:android

# تشغيل على iOS
pnpm capacitor:run:ios

# بناء APK
pnpm capacitor:build:android

# بناء IPA
pnpm capacitor:build:ios
```

## 🔧 التكوين المتقدم

### إعدادات Vite

الملف `vite.config.ts` يحتوي على:
- تعطيل Sourcemaps لتحسين الأداء
- تحسين الباندل للـ Cloudflare Workers
- دعم Node.js polyfills
- تكوين UnoCSS

### إعدادات TypeScript

الملف `tsconfig.json` يحتوي على:
- تكوين صارم للأنواع
- دعم Path mapping
- تحسينات الأداء

### إعدادات Wrangler

الملف `wrangler.toml` يحتوي على:
- تكوين Cloudflare Pages
- إعدادات البيئات المختلفة
- تكوين KV, D1, R2, Vectorize
- مراقبة الأداء والتنبيهات

## 📊 المراقبة والأداء

### المراقبة

- **Health Checks**: فحص صحة التطبيق كل دقيقة
- **Performance Monitoring**: مراقبة أداء API
- **Error Tracking**: تتبع الأخطاء والاستثناءات
- **Analytics**: تحليلات مفصلة للاستخدام

### التحسينات

- **Code Splitting**: تقسيم الكود لتحسين التحميل
- **Caching**: تخزين مؤقت للملفات الثابتة
- **Compression**: ضغط الملفات لتقليل الحجم
- **CDN**: استخدام شبكة Cloudflare العالمية

## 🔒 الأمان

### إعدادات الأمان

- **CSP**: سياسة أمان المحتوى
- **CORS**: إعدادات Cross-Origin
- **Rate Limiting**: تحديد معدل الطلبات
- **Input Validation**: التحقق من المدخلات

### أفضل الممارسات

- استخدام HTTPS فقط
- تشفير البيانات الحساسة
- تحديث التبعيات بانتظام
- مراجعة الأمان الدورية

## 🤝 المساهمة

### إرشادات المساهمة

1. Fork المشروع
2. إنشاء فرع للميزة الجديدة
3. تطبيق التغييرات
4. إضافة اختبارات
5. إنشاء Pull Request

### معايير الكود

```bash
# فحص الكود
pnpm lint

# إصلاح الأخطاء
pnpm lint:fix

# تنسيق الكود
pnpm format

# فحص التنسيق
pnpm format:check
```

## 📄 الترخيص

هذا المشروع مرخص تحت رخصة MIT. راجع ملف `LICENSE` للتفاصيل.

## 🆘 الدعم

### المشاكل الشائعة

1. **خطأ في البناء**: تأكد من تثبيت جميع التبعيات
2. **مشاكل في النشر**: تحقق من إعدادات Cloudflare
3. **أخطاء في API**: تأكد من صحة مفاتيح API

### الحصول على المساعدة

- [Issues](https://github.com/your-repo/issues) - الإبلاغ عن المشاكل
- [Discussions](https://github.com/your-repo/discussions) - المناقشات العامة
- [Wiki](https://github.com/your-repo/wiki) - الوثائق التفصيلية

## 🎯 Roadmap

### الإصدار القادم
- [ ] دعم نماذج AI إضافية
- [ ] تحسينات في الأداء
- [ ] ميزات تعاونية
- [ ] دعم اللغات الإضافية

### الإصدارات المستقبلية
- [ ] AI Agents متقدمة
- [ ] دعم VR/AR
- [ ] تكامل مع IoT
- [ ] تعلم آلي مخصص

---

**تم تطوير هذا المشروع بحب ❤️ للمجتمع العربي**

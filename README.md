# YOUSEF.SHTIWE AI Platform

منصة تطوير ذكية مدعومة بالذكاء الاصطناعي مع بيئة تطوير متكاملة في المتصفح

## 🚀 الميزات الرئيسية

### 🤖 **الذكاء الاصطناعي المحلي الحقيقي**
- **نماذج GGUF**: دعم كامل لنماذج Llama و Mistral المحلية
- **Transformers.js**: تشغيل نماذج PyTorch مباشرة في المتصفح
- **إدارة ذكية**: تحميل وإدارة متقدمة للنماذج المحلية
- **استدلال محلي**: معالجة النصوص بدون اتصال بالإنترنت

### 💻 **بيئة التطوير المتكاملة**
- **WebContainer حقيقي**: تشغيل Node.js في المتصفح مع دعم كامل
- **محرر Monaco**: محرر كود متقدم مع دعم جميع اللغات
- **طرفية تفاعلية**: Xterm.js مع دعم الأوامر الكاملة
- **معاينة مباشرة**: تحديث فوري للمشاريع مع Hot Reload

### 🎯 **وكلاء الذكاء الاصطناعي المتخصصة**
- **مفسر الكود**: شرح مفصل للكود مع أمثلة عملية
- **مصلح الأخطاء**: اكتشاف وإصلاح الأخطاء البرمجية
- **محسن الكود**: تحسين الأداء وتقليل التعقيد
- **مصمم البنية**: تصميم بنى برمجية قابلة للتطوير
- **مدقق الأمان**: اكتشاف ثغرات الأمان وحلول الحماية

### 🌐 **دعم متعدد المنصات**
- **Cloudflare Pages**: نشر سريع ومجاني
- **Electron**: تطبيق سطح المكتب
- **Capacitor**: تطبيقات الهاتف المحمول
- **Docker**: حاويات قابلة للنشر

## 🛠️ التقنيات المستخدمة

### **الواجهة الأمامية**
- **Remix**: إطار عمل كامل المكدس
- **React 18**: واجهة مستخدم تفاعلية
- **TypeScript**: أمان الأنواع
- **UnoCSS**: تنسيق سريع ومرن

### **الذكاء الاصطناعي**
- **@xenova/transformers**: نماذج PyTorch في المتصفح
- **@llama-node/llama-cpp**: نماذج GGUF المحلية
- **Vercel AI SDK**: تكامل مع مزودي الذكاء الاصطناعي
- **Nanostores**: إدارة الحالة التفاعلية

### **بيئة التطوير**
- **@webcontainer/api**: Node.js في المتصفح
- **@monaco-editor/react**: محرر كود متقدم
- **@xterm/xterm**: طرفية تفاعلية
- **Vite**: بناء سريع

## 📦 التثبيت والتشغيل

### **المتطلبات**
- Node.js 18+
- pnpm (موصى به)

### **التثبيت**
```bash
# استنساخ المشروع
git clone https://github.com/yousef-shtiwe/yousef-shtiwe-ai.git
cd yousef-shtiwe-ai

# تثبيت التبعيات
pnpm install

# تشغيل في وضع التطوير
pnpm dev

# بناء للإنتاج
pnpm build
```

### **تشغيل الذكاء الاصطناعي المحلي**

#### **1. نماذج GGUF (Ollama)**
```bash
# تثبيت Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# تشغيل Ollama
ollama serve

# تحميل نموذج
ollama pull llama2:7b
ollama pull mistral:7b
```

#### **2. نماذج Transformers.js**
```bash
# النماذج متاحة تلقائياً في المتصفح
# لا حاجة لتثبيت إضافي
```

## 🎨 الميزات المحسنة

### **الواجهة العربية**
- دعم كامل للغة العربية
- اتجاه من اليمين إلى اليسار (RTL)
- واجهة مستخدم محلية

### **إدارة المشاريع**
- إنشاء مشاريع جديدة
- استيراد من GitHub
- حفظ واسترجاع المشاريع

### **التطوير المتقدم**
- Git integration
- Debugging tools
- Code formatting
- Linting

## 🔧 الإعدادات

### **مزودي الذكاء الاصطناعي**
- **OpenAI**: GPT-4, GPT-3.5
- **Anthropic**: Claude
- **Google**: Gemini
- **Mistral**: Mistral AI
- **Ollama**: نماذج محلية
- **LM Studio**: نماذج محلية

### **التخصيص**
- الثيمات (فاتح/داكن)
- تخطيط الواجهة
- اختصارات لوحة المفاتيح
- إعدادات المحرر

## 📚 التوثيق

### **الذكاء الاصطناعي المحلي**
- [دليل نماذج GGUF](./docs/gguf-models.md)
- [دليل Transformers.js](./docs/transformers.md)
- [إعداد Ollama](./docs/ollama-setup.md)

### **بيئة التطوير**
- [دليل WebContainer](./docs/webcontainer.md)
- [إعداد المحرر](./docs/editor-setup.md)
- [استخدام الطرفية](./docs/terminal.md)

### **وكلاء الذكاء الاصطناعي**
- [دليل الوكلاء](./docs/ai-agents.md)
- [إنشاء وكلاء مخصصة](./docs/custom-agents.md)

## 🤝 المساهمة

نرحب بالمساهمات! يرجى قراءة [دليل المساهمة](./CONTRIBUTING.md) للمزيد من المعلومات.

### **المساهمة في التطوير**
1. Fork المشروع
2. إنشاء فرع للميزة الجديدة
3. Commit التغييرات
4. Push إلى الفرع
5. إنشاء Pull Request

## 📄 الترخيص

هذا المشروع مرخص تحت رخصة MIT - انظر ملف [LICENSE](./LICENSE) للتفاصيل.

## 🙏 الشكر والتقدير

- [WebContainer](https://webcontainers.io/) - بيئة Node.js في المتصفح
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - محرر الكود
- [Xterm.js](https://xtermjs.org/) - الطرفية التفاعلية
- [Transformers.js](https://huggingface.co/docs/transformers.js) - نماذج الذكاء الاصطناعي
- [Ollama](https://ollama.ai/) - نماذج الذكاء الاصطناعي المحلية

## 📞 الدعم

- **GitHub Issues**: للإبلاغ عن الأخطاء والطلبات
- **Discord**: للمناقشات والدعم المباشر
- **Email**: support@yousef-shtiwe.ai

---

**YOUSEF.SHTIWE AI Platform** - منصة التطوير الذكية للعصر الرقمي 🚀

# بناء شات باز عبر EAS

المشروع موجود في مجلد `chatboz-mobile`، ومهيأ بتكوين Expo وEAS الموجودين في `app.config.ts` و`eas.json`. تم الحفاظ على الأيقونة الحالية في `assets/images/icon.png` وأيقونات Android التكيفية.

## المتطلبات

ثبّت أدوات Expo وEAS ثم سجّل الدخول بحسابك:

```bash
npm install -g eas-cli
 eas login
```

انسخ `.env.example` إلى `.env` للتطوير المحلي، أو أضف القيم نفسها في متغيرات بيئة مشروع EAS. يجب تعيين `LOCAL_ADMIN_USERNAME` و`LOCAL_ADMIN_PASSWORD` إلى بيانات قوية؛ الحساب الإداري الأول فقط يُنشأ من هذه القيم، ولا توجد حسابات أو مجموعات أو غرف تجريبية مسبقة.

إذا كان البناء يشمل الخادم وقاعدة البيانات، أضف أيضاً `DATABASE_URL` و`JWT_SECRET` وقيم الخدمات الاختيارية المطلوبة. لا تضع كلمات المرور أو مفاتيح الخدمات في Git.

## أوامر البناء

من داخل مجلد المشروع:

```bash
cd chatboz-mobile
npm install
npx expo-doctor
npx eas build:configure
```

لبناء نسخة Android تجريبية بصيغة APK:

```bash
npx eas build --platform android --profile preview
```

لبناء نسخة Android للنشر بصيغة AAB:

```bash
npx eas build --platform android --profile production
```

ولبناء نسخة تطويرية داخلية:

```bash
npx eas build --platform android --profile development
```

قبل أول بناء، راجع `android.package` و`ios.bundleIdentifier` في `app.config.ts` وتأكد من امتلاكك لمعرّف EAS الموجود في `extra.eas.projectId`. لا تغيّر ملفات الأيقونة إذا أردت الاحتفاظ بالهوية الحالية.

## ما تم تنفيذه في الواجهة

تتضمن النسخة شاشة دخول عربية باسم مستخدم وكلمة مرور، غرفاً لا تظهر إلا بعد إنشائها، كتابة مجانية داخل الغرف مع اختيار لون النص، ظهور اسم المرسل مع كل رسالة، ملفات شخصية، لوحة أدمن لتحويل النقاط وإنشاء الحسابات وإدارة الغرف، وإخفاء رصيد الأدمن من ملفه الشخصي. تمت إضافة وصول مباشر إلى لعبة لودو من شاشة الغرف.

## فحص محلي

```bash
./node_modules/.bin/tsc --noEmit
./node_modules/.bin/vitest run
```

اختبارات الصلاحيات المحلية تحتاج إلى قاعدة البيانات ومتغيرات الأدمن؛ لذلك قد تفشل في بيئة لا تحتوي على `DATABASE_URL` أو بيانات bootstrap، وهذا لا يعني أن فحص TypeScript فشل.

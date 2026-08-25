import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { IconCircle, Tag, buzzColors, buzzHaptic } from "@/components/buzz-ui";
import { ScreenContainer } from "@/components/screen-container";

const options = [
  { name: "Oracle Cloud Free Tier", verdict: "الأفضل للخادم الدائم", color: buzzColors.green, detail: "يعطيك خادماً افتراضياً مجانياً دائماً ضمن الحصة المتاحة. مناسب لتشغيل API + قاعدة بيانات + LiveKit عبر Docker.", caution: "يتطلب بطاقة للتحقق وقد لا تتوفر سعة مجانية فوراً في كل منطقة." },
  { name: "Railway", verdict: "سهل للتجربة", color: buzzColors.indigo, detail: "واجهة سهلة لنشر API وقاعدة البيانات، مفيد للنسخة الأولى أو الاختبار.", caution: "الخطة المجانية والحدود تتغير، والخدمة قد لا تناسب الصوت الدائم وعدد المستخدمين الكبير." },
  { name: "Google Cloud / AWS", verdict: "رصيد تجريبي فقط", color: buzzColors.coral, detail: "تمنح بعض الخطط رصيداً أو فترة تجريبية، وتناسب تجربة البنية قبل الدفع.", caution: "ليست حلاً مجانياً دائماً؛ فعّل تنبيهات الميزانية دائماً." },
];

export default function HostingGuideScreen() {
  return <ScreenContainer edges={["top", "left", "right", "bottom"]}><ScrollView contentContainerStyle={styles.scroll}><View style={styles.header}><IconCircle icon="arrow-forward" label="العودة" onPress={() => router.back()} /><Text style={styles.title}>دليل السيرفر</Text><View style={styles.blank} /></View><View style={styles.intro}><MaterialIcons name="cloud-queue" size={30} color={buzzColors.indigo} /><Text style={styles.introTitle}>خادم الصوت يحتاج خدمة دائمة</Text><Text style={styles.introText}>لا تعتمد على استضافة ساكنة أو خدمة تنام تلقائياً لغرف الصوت. تحتاج API وخدمة WebRTC/SFU ويفضل خادم يعمل باستمرار.</Text></View><Text style={styles.sectionTitle}>خيارات البدء</Text>{options.map((option) => <View key={option.name} style={styles.option}><View style={styles.optionTop}><Tag color={option.color}>{option.verdict}</Tag><Text style={styles.optionName}>{option.name}</Text></View><Text style={styles.optionDetail}>{option.detail}</Text><View style={styles.caution}><MaterialIcons name="info-outline" size={16} color="#9D7A31" /><Text style={styles.cautionText}>{option.caution}</Text></View></View>)}<Text style={styles.sectionTitle}>الترتيب المقترح</Text><View style={styles.steps}>{["أنشئ خادم Ubuntu صغيراً في Oracle Cloud أو خدمة مشابهة.", "ثبت Docker وDocker Compose، ثم شغل API + PostgreSQL + LiveKit.", "اربط نطاقاً فرعياً لـ API وآخر للصوت مع HTTPS/WSS.", "أضف عناوين الخادم من شاشة السيرفر في شات بوز.", "ابدأ باختبار غرفة واحدة، ثم راقب الاستخدام والتكلفة قبل فتحها للجميع."].map((text, index) => <View key={text} style={styles.step}><View style={styles.stepNumber}><Text style={styles.stepNumberText}>{index + 1}</Text></View><Text style={styles.stepText}>{text}</Text></View>)}</View><View style={styles.important}><MaterialIcons name="warning-amber" size={21} color="#C7731C" /><Text style={styles.importantText}>لا تضع مفاتيح LiveKit السرية أو كلمات المرور داخل التطبيق أو في ملفات مرفوعة إلى GitHub. احتفظ بها في متغيرات بيئة السيرفر.</Text></View><Pressable onPress={() => { buzzHaptic(); router.back(); }} style={({ pressed }) => [styles.returnButton, pressed && styles.pressed]}><Text style={styles.returnText}>العودة إلى إعداد السيرفر</Text></Pressable></ScrollView></ScreenContainer>;
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 18, paddingTop: 7, paddingBottom: 28 },
  header: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", marginBottom: 17 },
  title: { color: buzzColors.ink, fontSize: 20, fontWeight: "900", writingDirection: "rtl" },
  blank: { width: 42 },
  intro: { backgroundColor: "#EFEEFF", borderRadius: 23, padding: 18, alignItems: "flex-end" },
  introTitle: { color: buzzColors.ink, fontSize: 18, fontWeight: "900", marginTop: 8, writingDirection: "rtl", textAlign: "right", alignSelf: "stretch" },
  introText: { color: "#57568B", fontSize: 12, lineHeight: 19, marginTop: 5, writingDirection: "rtl", textAlign: "right" },
  sectionTitle: { color: buzzColors.ink, fontSize: 17, fontWeight: "900", writingDirection: "rtl", textAlign: "right", marginTop: 23, marginBottom: 10 },
  option: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#ECECF3", borderRadius: 20, padding: 15, marginBottom: 10 },
  optionTop: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" },
  optionName: { color: buzzColors.ink, fontSize: 15, fontWeight: "900", writingDirection: "rtl" },
  optionDetail: { color: buzzColors.muted, fontSize: 12, lineHeight: 19, marginTop: 9, writingDirection: "rtl", textAlign: "right" },
  caution: { marginTop: 11, flexDirection: "row-reverse", alignItems: "flex-start", gap: 6, backgroundColor: "#FFF8E8", borderRadius: 12, padding: 9 },
  cautionText: { flex: 1, color: "#80652D", fontSize: 10, lineHeight: 16, writingDirection: "rtl", textAlign: "right" },
  steps: { backgroundColor: "#FFFFFF", borderRadius: 20, borderWidth: 1, borderColor: "#ECECF3", padding: 15, gap: 14 },
  step: { flexDirection: "row-reverse", alignItems: "flex-start", gap: 10 },
  stepNumber: { width: 25, height: 25, borderRadius: 13, backgroundColor: "#EFEEFF", alignItems: "center", justifyContent: "center" },
  stepNumberText: { color: buzzColors.indigo, fontSize: 12, fontWeight: "900" },
  stepText: { flex: 1, color: buzzColors.ink, fontSize: 12, lineHeight: 19, writingDirection: "rtl", textAlign: "right" },
  important: { marginTop: 15, flexDirection: "row-reverse", gap: 8, alignItems: "flex-start", backgroundColor: "#FFF2E8", borderRadius: 16, padding: 13 },
  importantText: { flex: 1, color: "#7F572D", fontSize: 11, lineHeight: 18, writingDirection: "rtl", textAlign: "right" },
  returnButton: { marginTop: 18, height: 51, backgroundColor: buzzColors.indigo, borderRadius: 16, justifyContent: "center", alignItems: "center" },
  returnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "900", writingDirection: "rtl" },
  pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
});

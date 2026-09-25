export interface GuideStep { title: string; description: string; tips?: string[]; }
export interface GuideSection { id: string; icon: string; title: string; subtitle: string; steps: GuideStep[]; }

export const GUIDE_SECTIONS: GuideSection[] = [
  { id: "intro", icon: "Sparkles", title: "معرفی برنامه", subtitle: "YFG چیست؟", steps: [
    { title: "کارخانه‌ی مهندسی نرم‌افزار", description: "YFG یک پلتفرم هوشمند است که ایده شما را به محصول تبدیل می‌کند. این برنامه فقط یک Chat نیست — یک سازمان مهندسی است با Agentهای تخصصی، راستی‌آزمایی مستقل و تأیید انسانی.", tips: ["بر اساس ۶ اصل معماری ساخته شده", "هیچ خروجی Agent بدون بررسی مستقل قابل اعتماد نیست"] },
    { title: "جریان اصلی", description: "هر وظیفه: ایجاد → Agent → خروجی → راستی‌آزمایی → دروازه → تأیید انسانی → تکمیل. همه در Audit Log ثبت می‌شود." },
  ]},
  { id: "start", icon: "Rocket", title: "شروع سریع", subtitle: "۳ گام", steps: [
    { title: "گام ۱: ساخت ورک‌اسپیس", description: "به تب ورک‌اسپیس‌ها بروید. ورک‌اسپیس جدید بسازید و آن را فعال کنید." },
    { title: "گام ۲: انتخاب قالب", description: "به تب تعریف وظایف بروید. ۱۲ قالب آماده وجود دارد. روی «استفاده» کلیک کنید." },
    { title: "گام ۳: اجرا", description: "دستور را ویرایش کنید و «اجرا» را بزنید. صبر کنید تا pipeline کامل اجرا شود." },
  ]},
  { id: "templates", icon: "LayoutTemplate", title: "تب تعریف وظایف", subtitle: "قالب‌های آماده", steps: [
    { title: "قالب‌ها چه می‌کنند؟", description: "هر قالب Agent، نوع راستی‌آزمایی و دروازه تأیید را از پیش تعیین کرده است." },
    { title: "دسته‌بندی", description: "۸ دسته: نیازمندی، طراحی، کدنویسی، پایگاه داده، امنیت، مستندات، یکپارچه‌سازی، تست." },
  ]},
  { id: "tasks", icon: "ListChecks", title: "تب وظایف", subtitle: "ایجاد و اجرا", steps: [
    { title: "نمودار مراحل", description: "بالای جزئیات هر وظیفه، نمودار بصری مراحل نمایش داده می‌شود: وظیفه → Agent → خروجی → راستی‌آزمایی → دروازه → تأیید → تکمیل." },
    { title: "جزئیات کامل", description: "اطلاعات وظیفه، خروجی‌ها، راستی‌آزمایی‌ها، دروازه‌ها و تأییدات انسانی." },
  ]},
  { id: "verification", icon: "ShieldCheck", title: "راستی‌آزمایی", subtitle: "اصل استقلال", steps: [
    { title: "راستی‌آزمایی مستقل", description: "هر خروجی توسط Verifier مستقل بررسی می‌شود — نه توسط خود Agent تولیدکننده." },
    { title: "نتایج", description: "pass: عبور. warn: هشدار. fail: ناموفق → rework یا escalate." },
  ]},
  { id: "approvals", icon: "UserCheck", title: "تأییدات انسانی", subtitle: "حاکمیت انسان", steps: [
    { title: "چه زمانی؟", description: "۶ مورد حساس: معماری، تغییر دیتابیس، امنیت، انتشار، استقرار." },
    { title: "چگونه؟", description: "به تب تأییدات بروید. تأیید یا رد کنید. تصمیم در Audit Log ثبت می‌شود." },
  ]},
  { id: "trace-audit", icon: "Network", title: "ردیابی و حسابرسی", subtitle: "قابلیت بررسی", steps: [
    { title: "زنجیره ردیابی", description: "در تب ردیابی تمام لینک‌های بین artifactها را ببینید." },
    { title: "حسابرسی", description: "تب حسابرسی لاگ تغییرناپذیر همه رویدادها را نشان می‌دهد — با hash برای بررسی یکپارچگی." },
  ]},
  { id: "settings", icon: "Settings", title: "تنظیمات", subtitle: "AI Gateway و تم", steps: [
    { title: "تغییر مدل", description: "در تب تنظیمات می‌توانید مدل، API Key و Temperature را تغییر دهید." },
    { title: "تم برنامه", description: "۴ تم بر اساس برند YFG: Corporate، Emerald، Sunset، Dark Pro." },
  ]},
];

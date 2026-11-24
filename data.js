js//* =========================================================
   وفّر - البيانات الأساسية (محافظات - أقسام - منافذ - منتجات)
   ========================================================= */

// محافظات مصر الـ 27
const GOVERNORATES = [
  "القاهرة", "الجيزة", "الإسكندرية", "القليوبية", "الدقهلية", "الشرقية",
  "الغربية", "المنوفية", "البحيرة", "كفر الشيخ", "دمياط", "بورسعيد",
  "الإسماعيلية", "السويس", "الفيوم", "بني سويف", "المنيا", "أسيوط",
  "سوهاج", "قنا", "الأقصر", "أسوان", "البحر الأحمر", "الوادي الجديد",
  "مطروح", "شمال سيناء", "جنوب سيناء"
];

// الأقسام
const CATEGORIES = [
  { id: "veg",     name: "خضار",          emoji: "🥬", photo: 1656666 },
  { id: "fruit",   name: "فاكهة",         emoji: "🍎", photo: 1171170 },
  { id: "meat",    name: "لحوم",          emoji: "🥩", photo: 18973339 },
  { id: "poultry", name: "فراخ",          emoji: "🍗", photo: 7140316 },
  { id: "dairy",   name: "ألبان وبيض",    emoji: "🥛", photo: 1556707 },
  { id: "grocery", name: "بقالة وتموين",  emoji: "🛒", photo: 9475239 }
];

/* =========================================================
   المنافذ: منفذ واحد على الأقل في كل محافظة (الباسورد لكلهم: 123456)
   المشتري بيقدر يطلب من منافذ محافظته بس
   ========================================================= */
const SEED_VENDORS = [
  ["منفذ مدينة نصر",          "nasrcity",     "القاهرة",       "شارع عباس العقاد - مدينة نصر"],
  ["منفذ المعادي",            "maadi",        "القاهرة",       "شارع 9 - المعادي"],
  ["منفذ مصر الجديدة",        "heliopolis",   "القاهرة",       "شارع الحجاز - مصر الجديدة"],
  ["منفذ الهرم",              "haram",        "الجيزة",        "شارع الهرم الرئيسي - الطالبية"],
  ["منفذ 6 أكتوبر",           "october",      "الجيزة",        "المحور المركزي - 6 أكتوبر"],
  ["منفذ سيدي جابر",          "alex",         "الإسكندرية",    "طريق الحرية - سيدي جابر"],
  ["منفذ العجمي",             "agami",        "الإسكندرية",    "الطريق الرئيسي - البيطاش"],
  ["منفذ بنها",               "benha",        "القليوبية",     "شارع فريد ندا - بنها"],
  ["منفذ المنصورة",           "mansoura",     "الدقهلية",      "شارع الجمهورية - المنصورة"],
  ["منفذ الزقازيق",           "zagazig",      "الشرقية",       "شارع فاروق - الزقازيق"],
  ["منفذ طنطا",               "tanta",        "الغربية",       "شارع البحر - طنطا"],
  ["منفذ شبين الكوم",         "shebin",       "المنوفية",      "شارع جمال عبد الناصر - شبين الكوم"],
  ["منفذ دمنهور",             "damanhour",    "البحيرة",       "شارع عبد السلام الشاذلي - دمنهور"],
  ["منفذ كفر الشيخ",          "kafrelsheikh", "كفر الشيخ",     "شارع الجيش - كفر الشيخ"],
  ["منفذ دمياط الجديدة",      "damietta",     "دمياط",         "المنطقة المركزية - دمياط الجديدة"],
  ["منفذ بورسعيد",            "portsaid",     "بورسعيد",       "شارع 23 يوليو - بورسعيد"],
  ["منفذ الإسماعيلية - الشيخ زايد", "ismailia", "الإسماعيلية", "شارع الجيش - الشيخ زايد"],
  ["منفذ فايد",               "fayed",        "الإسماعيلية",   "الطريق الرئيسي - فايد البلد"],
  ["منفذ السويس",             "suez",         "السويس",        "شارع الجيش - الأربعين"],
  ["منفذ الفيوم",             "fayoum",       "الفيوم",        "شارع الحرية - الفيوم"],
  ["منفذ بني سويف",           "benisuef",     "بني سويف",      "شارع صلاح سالم - بني سويف"],
  ["منفذ المنيا",             "minya",        "المنيا",        "كورنيش النيل - المنيا"],
  ["منفذ أسيوط الجديدة",      "assiut",       "أسيوط",         "المنطقة المركزية - أسيوط الجديدة"],
  ["منفذ سوهاج",              "sohag",        "سوهاج",         "شارع الجمهورية - سوهاج"],
  ["منفذ قنا",                "qena",         "قنا",           "شارع الجمهورية - قنا"],
  ["منفذ الأقصر",             "luxor",        "الأقصر",        "شارع التليفزيون - الأقصر"],
  ["منفذ أسوان",              "aswan",        "أسوان",         "شارع كورنيش النيل - أسوان"],
  ["منفذ الغردقة",            "hurghada",     "البحر الأحمر",  "شارع النصر - الدهار"],
  ["منفذ الخارجة",            "kharga",       "الوادي الجديد", "شارع جمال عبد الناصر - الخارجة"],
  ["منفذ مرسى مطروح",         "matrouh",      "مطروح",         "شارع الإسكندرية - مرسى مطروح"],
  ["منفذ العريش",             "arish",        "شمال سيناء",    "شارع 23 يوليو - العريش"],
  ["منفذ الطور",              "tor",          "جنوب سيناء",    "الطريق الرئيسي - الطور"]
].map(([name, key, governorate, address], i) => ({
  id: "v" + (i + 1),
  name,
  ownerName: "مدير " + name,
  email: key + "@wafar.eg",
  phone: ["010", "011", "012", "015"][i % 4] + String(10000000 + i * 1234567).slice(-8),
  nationalId: "290" + String((i % 12) + 1).padStart(2, "0") + String((i % 28) + 1).padStart(2, "0") + String(i + 1).padStart(2, "0") + String(10000 + i * 37).slice(-5),
  governorate,
  address
}));

/* =========================================================
   المنتجات: منتجات مصرية حقيقية من ماركات معروفة بأسعار عادية
   img = صورة المنتج الحقيقية (خلفية بيضاء) من موقع كارفور مصر
   core = منتج أساسي موجود في كل المنافذ
   ========================================================= */
const CDN = "https://cdn.mafrservices.com/";
const CATALOG = [
  // ===== ألبان وبيض =====
  { name: "لبن جهينة كامل الدسم",       size: "1 لتر",    category: "dairy", price: 46,  unit: "علبة", emoji: "🥛", core: 1, img: "sys-master-root/h87/hf0/13688480038942/12721_main.jpg" },
  { name: "لبن جهينة خالي الدسم",       size: "1 لتر",    category: "dairy", price: 46,  unit: "علبة", emoji: "🥛", img: "sys-master-root/h7d/h2e/11259563180062/12723_main.jpg" },
  { name: "زبادي جهينة سادة",           size: "105 جم",   category: "dairy", price: 9,   unit: "كوب",  emoji: "🥛", core: 1, img: "sys-master-root/h8d/h7b/26751778390046/210181_main.jpg" },
  { name: "لبن رايب جهينة",             size: "1 لتر",    category: "dairy", price: 48,  unit: "علبة", emoji: "🥛", img: "sys-master-root/h23/h96/26655832801310/12754_main.jpg" },
  { name: "لبن المراعي كامل الدسم",     size: "1 لتر",    category: "dairy", price: 47,  unit: "علبة", emoji: "🥛", core: 1, img: "sys-master-root/he6/h26/30871336878110/310889_main.jpg" },
  { name: "لبن المراعي خالي الدسم",     size: "1 لتر",    category: "dairy", price: 47,  unit: "علبة", emoji: "🥛", img: "sys-master-root/h20/h07/44920809685022/514379_main.jpg" },
  { name: "لبن المراعي نصف دسم",        size: "1 لتر",    category: "dairy", price: 47,  unit: "علبة", emoji: "🥛", img: "sys-master-root/h45/hf7/30871339466782/392554_main.jpg" },
  { name: "لبن المراعي بالشيكولاتة",    size: "200 مل",   category: "dairy", price: 15,  unit: "علبة", emoji: "🥛", img: "sys-master-root/hde/h25/44920804278302/420789_main.jpg" },
  { name: "لبن بيتي كامل الدسم",        size: "900 مل",   category: "dairy", price: 42,  unit: "علبة", emoji: "🥛", img: "pim-content/EGY/media/product/683312/1785836400/683312_main.jpg" },
  { name: "لبن لمار كامل الدسم",        size: "1 لتر",    category: "dairy", price: 42,  unit: "علبة", emoji: "🥛", core: 1, img: "pim-content/EGY/media/product/362475/1727089804/362475_main.jpg" },
  { name: "لبن لمار خالي الدسم",        size: "1 لتر",    category: "dairy", price: 42,  unit: "علبة", emoji: "🥛", img: "pim-content/EGY/media/product/362476/1727089804/362476_main.jpg" },
  { name: "لبن لاكتيل كامل الدسم",      size: "1 لتر",    category: "dairy", price: 43,  unit: "علبة", emoji: "🥛", img: "sys-master-root/h31/h02/9286774751262/340392_main.jpg" },
  { name: "لبن رايب لاكتيل",            size: "210 مل",   category: "dairy", price: 12,  unit: "علبة", emoji: "🥛", img: "sys-master-root/h25/h02/9286431473694/282224_main.jpg" },
  { name: "جبنة دومتي فيتا",            size: "500 جم",   category: "dairy", price: 62,  unit: "علبة", emoji: "🧀", core: 1, img: "pim-content/EGY/media/product/36598/1775580002/36598_main.jpg" },
  { name: "جبنة دومتي اسطنبولي",        size: "500 جم",   category: "dairy", price: 58,  unit: "علبة", emoji: "🧀", img: "sys-master-root/h32/h8a/11724322078750/11837_main.jpg" },
  { name: "جبنة عبور لاند فيتا",        size: "500 جم",   category: "dairy", price: 55,  unit: "علبة", emoji: "🧀", img: "pim-content/EGY/media/product/407407/1772013600/407407_main.jpg" },
  { name: "جبنة عبور لاند اسطنبولي",    size: "500 جم",   category: "dairy", price: 55,  unit: "علبة", emoji: "🧀", img: "pim-content/EGY/media/product/407408/1772530189/407408_main.jpg" },
  { name: "بيض أبيض الخير",             size: "15 بيضة",  category: "dairy", price: 85,  unit: "طبق",  emoji: "🥚", img: "sys-master-root/hf5/hf4/9837369458718/335961_main.jpg" },
  { name: "بيض أبيض الخير",             size: "30 بيضة",  category: "dairy", price: 165, unit: "طبق",  emoji: "🥚", core: 1, img: "sys-master-root/h73/h76/9286767935518/335954_main.jpg" },
  { name: "بيض أحمر الخير",             size: "30 بيضة",  category: "dairy", price: 180, unit: "طبق",  emoji: "🥚", img: "sys-master-root/ha4/h6c/9286767673374/335955_main.jpg" },

  // ===== لحوم =====
  { name: "لحم بقري بلدي (وش فخدة)",    size: "1 كجم",    category: "meat", price: 450, unit: "كيلو", emoji: "🥩", core: 1, img: "sys-master-root/h42/h06/10856167538718/426170_main.jpg" },
  { name: "لحمة مفرومة بلدي",           size: "1 كجم",    category: "meat", price: 400, unit: "كيلو", emoji: "🥩", core: 1, img: "sys-master-root/h8c/ha2/30490078937118/31991_main.jpg" },
  { name: "لحم بقري مكعبات",            size: "1 كجم",    category: "meat", price: 460, unit: "كيلو", emoji: "🥩", img: "sys-master-root/hf7/h69/62786093219870/426174_main.jpg" },
  { name: "اسكالوب بقري بلدي",          size: "1 كجم",    category: "meat", price: 520, unit: "كيلو", emoji: "🥩", img: "sys-master-root/h6d/h44/51071949635614/426166_main.jpg" },

  // ===== فراخ =====
  { name: "فرخة بيضاء كاملة طازة",      size: "1 كجم تقريباً", category: "poultry", price: 110, unit: "كيلو", emoji: "🐔", core: 1, img: "pim-content/EGY/media/product/419066/1782225000/419066_main.jpg" },
  { name: "فيليه فراخ طازة",            size: "1 كجم",    category: "poultry", price: 260, unit: "كيلو", emoji: "🍗", core: 1, img: "pim-content/EGY/media/product/419058/1782225000/419058_main.jpg" },
  { name: "صدور فراخ بالعضم",           size: "1 كجم",    category: "poultry", price: 220, unit: "كيلو", emoji: "🍗", img: "pim-content/EGY/media/product/419065/1782225000/419065_main.jpg" },
  { name: "أوراك فراخ طازة",            size: "1 كجم",    category: "poultry", price: 150, unit: "كيلو", emoji: "🍗", img: "pim-content/EGY/media/product/419060/1782225000/419060_main.jpg" },

  // ===== خضار =====
  { name: "طماطم",                      size: "1 كجم",    category: "veg", price: 15, unit: "كيلو", emoji: "🍅", core: 1, img: "sys-master-root/h23/hb8/35139577446430/377135_main.jpg" },
  { name: "بطاطس للطبخ",                size: "1 كجم",    category: "veg", price: 18, unit: "كيلو", emoji: "🥔", core: 1, img: "pim-content/EGY/media/product/662686/1763473613/662686_main.jpg" },
  { name: "بصل أحمر",                   size: "1 كجم",    category: "veg", price: 20, unit: "كيس",  emoji: "🧅", core: 1, img: "sys-master-root/ha2/hd5/27307737710622/562289_main.jpg" },
  { name: "خيار",                       size: "1 كجم",    category: "veg", price: 20, unit: "كيلو", emoji: "🥒", core: 1, img: "sys-master-root/hc1/hbe/9342277910558/213783_main.jpg" },
  { name: "جزر",                        size: "1 كجم",    category: "veg", price: 15, unit: "كيلو", emoji: "🥕", img: "sys-master-root/h7d/hcc/9342285643806/229953_main.jpg" },
  { name: "فلفل رومي بلدي",             size: "1 كجم",    category: "veg", price: 30, unit: "كيلو", emoji: "🫑", img: "sys-master-root/h6d/he5/35139576692766/32652_main.jpg" },
  { name: "ليمون بلدي",                 size: "1 كجم",    category: "veg", price: 40, unit: "كيلو", emoji: "🍋", img: "sys-master-root/h93/had/35139577774110/396109_main.jpg" },

  // ===== فاكهة =====
  { name: "موز",                        size: "1 كجم",    category: "fruit", price: 45, unit: "كيلو", emoji: "🍌", core: 1, img: "sys-master-root/hed/h73/35139575414814/32567_main.jpg" },
  { name: "برتقال فالنسيا",             size: "1 كجم",    category: "fruit", price: 20, unit: "كيلو", emoji: "🍊", core: 1, img: "sys-master-root/hab/h1d/9342411112478/297733_main.jpg" },
  { name: "تفاح أحمر",                  size: "1 كجم",    category: "fruit", price: 75, unit: "كيلو", emoji: "🍎", img: "sys-master-root/h59/hc5/35139577085982/369185_main.jpg" },

  // ===== بقالة وتموين: زيوت وسمن =====
  { name: "زيت كريستال عباد الشمس",     size: "1 لتر",    category: "grocery", price: 95,  unit: "زجاجة", emoji: "🫗", core: 1, img: "pim-content/EGY/media/product/17706/1767171600/17706_main.jpg" },
  { name: "زيت كريستال عباد الشمس",     size: "2.2 لتر",  category: "grocery", price: 195, unit: "زجاجة", emoji: "🫗", img: "pim-content/EGY/media/product/543989/1767171600/543989_main.jpg" },
  { name: "سمن كريستال نباتي أبيض",     size: "1.5 كجم",  category: "grocery", price: 190, unit: "علبة",  emoji: "🧈", img: "pim-content/EGY/media/product/305567/1738681205/305567_main.jpg" },
  { name: "زيت عافية ذرة",              size: "800 مل",   category: "grocery", price: 92,  unit: "زجاجة", emoji: "🫗", img: "sys-master-root/h99/h2c/15173273452574/543878_main.jpg" },
  { name: "زيت عافية ذرة",              size: "1.6 لتر",  category: "grocery", price: 175, unit: "زجاجة", emoji: "🫗", img: "pim-content/EGY/media/product/480687/1750163403/480687_main.jpg" },
  { name: "زيت عافية ذرة",              size: "2.2 لتر",  category: "grocery", price: 235, unit: "زجاجة", emoji: "🫗", img: "pim-content/EGY/media/product/544732/1750163403/544732_main.jpg" },
  { name: "زيت زازا ذرة",               size: "700 مل",   category: "grocery", price: 75,  unit: "زجاجة", emoji: "🫗", img: "sys-master-root/hfa/h73/47992458084382/604814_main.jpg" },

  // ===== بقالة وتموين: أرز وسكر وبقوليات =====
  { name: "أرز الضحى مصري",             size: "1 كجم",    category: "grocery", price: 36, unit: "كيس", emoji: "🍚", core: 1, img: "sys-master-root/h65/h39/15127732453406/17997_main.jpg" },
  { name: "سكر الضحى ناعم",             size: "1 كجم",    category: "grocery", price: 38, unit: "كيس", emoji: "🍬", core: 1, img: "sys-master-root/hfc/ha2/15127731470366/17964_main.jpg" },
  { name: "فول الضحى مدشوش",            size: "500 جم",   category: "grocery", price: 30, unit: "كيس", emoji: "🫘", img: "sys-master-root/hc5/hd6/34709980413982/17989_main.jpg" },
  { name: "أرز ريحانة بسمتي هندي",      size: "1 كجم",    category: "grocery", price: 95, unit: "كيس", emoji: "🍚", img: "sys-master-root/h69/h01/28522779705374/576748_main.jpg" },
  { name: "عدس أصفر ريحانة",            size: "500 جم",   category: "grocery", price: 38, unit: "كيس", emoji: "🥣", img: "sys-master-root/h28/h05/28522779836446/579372_main.jpg" },
  { name: "دقيق المطبخ متعدد الاستخدامات", size: "1 كجم", category: "grocery", price: 32, unit: "كيس", emoji: "🌾", img: "sys-master-root/h12/ha0/15127742709790/538698_main.jpg" },
  { name: "أرز المطبخ أبيض",            size: "1 كجم",    category: "grocery", price: 35, unit: "كيس", emoji: "🍚", img: "sys-master-root/h37/hfc/15127735435294/433716_main.jpg" },
  { name: "أرز أهل القمة أبيض",         size: "1 كجم",    category: "grocery", price: 35, unit: "كيس", emoji: "🍚", img: "pim-content/EGY/media/product/643679/1734340204/643679_main.jpg" },

  // ===== بقالة وتموين: مكرونة =====
  { name: "مكرونة ريجينا قلم",          size: "400 جم",   category: "grocery", price: 24, unit: "كيس", emoji: "🍝", core: 1, img: "pim-content/EGY/media/product/17608/1787727600/17608_main.jpg" },
  { name: "مكرونة ريجينا اسباجيتي",     size: "400 جم",   category: "grocery", price: 24, unit: "كيس", emoji: "🍝", img: "pim-content/EGY/media/product/17597/1787727600/17597_main.jpg" },
  { name: "مكرونة ريجينا خواتم صغيرة",  size: "400 جم",   category: "grocery", price: 24, unit: "كيس", emoji: "🍝", img: "pim-content/EGY/media/product/17606/1787727600/17606_main.jpg" },
  { name: "مكرونة الملكة قلم مخطط",     size: "400 جم",   category: "grocery", price: 18, unit: "كيس", emoji: "🍝", core: 1, img: "sys-master-root/ha4/h1a/48236821381150/46863_main.jpg" },
  { name: "مكرونة الملكة كوع",          size: "400 جم",   category: "grocery", price: 18, unit: "كيس", emoji: "🍝", img: "pim-content/EGY/media/product/617928/1750251603/617928_main.jpg" },
  { name: "مكرونة إيطاليانو اسباجيتي",  size: "400 جم",   category: "grocery", price: 17, unit: "كيس", emoji: "🍝", img: "pim-content/EGY/media/product/16891/1750163403/16891_main.jpg" },
  { name: "مكرونة إيطاليانو خواتم صغيرة", size: "400 جم", category: "grocery", price: 17, unit: "كيس", emoji: "🍝", img: "pim-content/EGY/media/product/16901/1750163403/16901_main.jpg" },
  { name: "مكرونة لمتنا قلم",           size: "1 كجم",    category: "grocery", price: 38, unit: "كيس", emoji: "🍝", img: "sys-master-root/haa/hd0/47595231674398/576215_main.jpg" },
  { name: "مكرونة المطبخ كوع",          size: "400 جم",   category: "grocery", price: 16, unit: "كيس", emoji: "🍝", img: "sys-master-root/h32/hf6/34709985886238/457930_main.jpg" },
  { name: "شعرية أهل القمة",            size: "400 جم",   category: "grocery", price: 17, unit: "كيس", emoji: "🍝", img: "pim-content/EGY/media/product/644719/1738159204/644719_main.jpg" },

  // ===== بقالة وتموين: صلصة ومعلبات =====
  { name: "صلصة طماطم هاينز",           size: "360 جم",   category: "grocery", price: 42, unit: "برطمان", emoji: "🥫", core: 1, img: "sys-master-root/h21/hba/14932246757406/18299_main.jpg" },
  { name: "كاتشب هاينز",                size: "295 جم",   category: "grocery", price: 45, unit: "زجاجة",  emoji: "🥫", img: "pim-content/EGY/media/product/623765/1723644603/623765_main.jpg" },
  { name: "صلصة طماطم هارفست",          size: "320 جم",   category: "grocery", price: 32, unit: "برطمان", emoji: "🥫", img: "sys-master-root/h0b/h1e/14932367474718/322974_main.jpg" },
  { name: "صلصة طماطم كنور فاين فودز",  size: "360 جم",   category: "grocery", price: 38, unit: "برطمان", emoji: "🥫", img: "sys-master-root/h34/hee/49510726369310/17057_main.jpg" },
  { name: "صلصة طماطم جاردينو",         size: "300 جم",   category: "grocery", price: 25, unit: "علبة",   emoji: "🥫", img: "pim-content/EGY/media/product/406297/1752583681/406297_main.jpg" },
  { name: "فول مدمس هارفست سادة",       size: "400 جم",   category: "grocery", price: 19, unit: "علبة",   emoji: "🥫", core: 1, img: "pim-content/EGY/media/product/17115/1751360404/17115_main.jpg" },
  { name: "فول مدمس أمريكانا سادة",     size: "400 جم",   category: "grocery", price: 22, unit: "علبة",   emoji: "🥫", img: "sys-master-root/h8f/h6a/27393898545182/575657_main.jpg" },
  { name: "فول مقشر كاليفورنيا جاردن",  size: "400 جم",   category: "grocery", price: 28, unit: "علبة",   emoji: "🥫", img: "sys-master-root/ha7/h0c/14786194145310/454381_main.jpg" },
  { name: "تونة كاليفورنيا جاردن قطع",  size: "185 جم",   category: "grocery", price: 85, unit: "علبة",   emoji: "🐟", img: "sys-master-root/h0f/h22/14786089058334/16705_main.jpg" },

  // ===== بقالة وتموين: عيش =====
  { name: "عيش بلدي كبير",              size: "5 أرغفة",  category: "grocery", price: 15, unit: "كيس", emoji: "🍞", img: "sys-master-root/h11/h67/9342283874334/300329_main.jpg" },
  { name: "عيش فينو دومتي",             size: "4 قطع",    category: "grocery", price: 20, unit: "كيس", emoji: "🥖", img: "pim-content/EGY/media/product/534144/1775563800/534144_main.jpg" }
].map(p => ({ ...p, img: CDN + p.img }));

// صور البانرات (صور ديكور مش صور منتجات)
const BANNER_PHOTOS = [868110, 18973339, 32550092];

// بيرجع لينك الصورة من Pexels
function pexels(id, w = 600) {
  return `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;
}

// رسوم التوصيل
const DELIVERY_FEE = 30;
const FREE_DELIVERY_FROM = 500;

// الأقسام اللي منتجاتها بتبوظ (بتنزل في عروض آخر اليوم)
const PERISHABLE = ["veg", "fruit", "meat", "poultry", "dairy"];

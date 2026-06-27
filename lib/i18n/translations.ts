// TODO: Extend translations to cover all authenticated dashboard pages (full app i18n — V2 task)

export type Language = "en" | "fr" | "es" | "ar" | "sw" | "pt" | "de" | "zh";

export const languages: {
  code: Language;
  name: string;
  nativeName: string;
  flag: string;
  dir?: "rtl";
}[] = [
  { code: "en", name: "English",    nativeName: "English",    flag: "🇬🇧" },
  { code: "fr", name: "French",     nativeName: "Français",   flag: "🇫🇷" },
  { code: "es", name: "Spanish",    nativeName: "Español",    flag: "🇪🇸" },
  { code: "ar", name: "Arabic",     nativeName: "العربية",    flag: "🇸🇦", dir: "rtl" },
  { code: "sw", name: "Swahili",    nativeName: "Kiswahili",  flag: "🇰🇪" },
  { code: "pt", name: "Portuguese", nativeName: "Português",  flag: "🇧🇷" },
  { code: "de", name: "German",     nativeName: "Deutsch",    flag: "🇩🇪" },
  { code: "zh", name: "Chinese",    nativeName: "中文",        flag: "🇨🇳" },
];

type Translations = {
  nav: {
    features: string;
    pricing: string;
    customers: string;
    signIn: string;
    startFree: string;
  };
  hero: {
    badge: string;
    h1Line1: string;
    h1Line2: string;
    description: string;
    ctaPrimary: string;
    ctaSecondary: string;
    note: string;
  };
  social: { trusted: string };
  features: {
    h2: string;
    description: string;
    items: { title: string; desc: string }[];
  };
  testimonials: {
    h2: string;
    items: { quote: string; name: string; role: string }[];
  };
  pricing: {
    h2: string;
    description: string;
    mostPopular: string;
    plans: {
      name: string;
      period: string;
      desc: string;
      features: string[];
      cta: string;
    }[];
  };
  cta: { h2: string; description: string; button: string };
  footer: { tagline: string; privacy: string; terms: string; contact: string };
};

export const translations: Record<Language, Translations> = {
  en: {
    nav: { features: "Features", pricing: "Pricing", customers: "Customers", signIn: "Sign in", startFree: "Start free" },
    hero: {
      badge: "Built for hospitality — hotels, restaurants, catering",
      h1Line1: "Inventory that runs",
      h1Line2: "as fast as your kitchen",
      description: "Mise gives your team real-time visibility into every item, location, and supplier — so you never run out, never over-order, and never lose margin to waste.",
      ctaPrimary: "Get started free",
      ctaSecondary: "Sign in to your account",
      note: "No credit card required · Free plan forever",
    },
    social: { trusted: "Trusted by hospitality teams worldwide" },
    features: {
      h2: "Everything your team needs",
      description: "From receiving dock to service pass — Mise covers the full inventory lifecycle with no complexity.",
      items: [
        { title: "Real-time inventory",  desc: "Track every item across multiple locations with live quantity updates on every receipt, issue, and wastage movement." },
        { title: "Purchase orders",      desc: "Create POs, send to suppliers, and receive stock in partial shipments. Inventory updates automatically on receipt." },
        { title: "Reports & analytics",  desc: "Food cost %, top consumed items, wastage trends, and reorder alerts — everything you need to protect your margins." },
        { title: "Role-based access",    desc: "OWNER, ADMIN, MANAGER, and STAFF roles with granular permissions. Staff can record movements; only managers can order." },
        { title: "Full audit trail",     desc: "Every stock movement is logged with user, timestamp, and quantity. Perfect for compliance and accountability." },
        { title: "Recipe costing",       desc: "Link recipes to inventory items. Get real-time food cost % and margin per dish as ingredient prices change." },
      ],
    },
    testimonials: {
      h2: "What our customers say",
      items: [
        { quote: "We cut food waste by 23% in the first month. The reorder alerts alone paid for the subscription.", name: "Maria Chen", role: "F&B Director, Grand Palace Hotel" },
        { quote: "Finally a system my kitchen staff will actually use. Simple enough for a line cook, powerful enough for my CFO.", name: "James Okonkwo", role: "Executive Chef, Bistro Collective" },
        { quote: "The purchase order flow is seamless. Our receiving team processes deliveries 3x faster than before.", name: "Sofia Reyes", role: "Operations Manager, Cloud Kitchen Co." },
      ],
    },
    pricing: {
      h2: "Simple, honest pricing",
      description: "Start free. Scale as you grow. No hidden fees.",
      mostPopular: "Most popular",
      plans: [
        { name: "Free",       period: "forever",    desc: "Perfect for a single outlet getting started.",                       features: ["100 inventory items", "3 team members", "2 locations", "Purchase orders", "Stock movements", "Basic reports"],                                                                                cta: "Get started" },
        { name: "Pro",        period: "per month",  desc: "For growing hospitality businesses.",                                features: ["1,000 inventory items", "20 team members", "10 locations", "Everything in Free", "Advanced analytics", "Recipe costing", "Audit log", "Priority support"],                                  cta: "Start Pro trial" },
        { name: "Enterprise", period: "contact us", desc: "For hotel groups and large catering operations.",                    features: ["Unlimited items", "Unlimited users", "Unlimited locations", "Everything in Pro", "Self-hosted option", "SSO / SAML", "Custom integrations", "Dedicated support"],                             cta: "Contact sales" },
      ],
    },
    cta: { h2: "Ready to take control of your inventory?", description: "Join hundreds of hospitality teams who trust Mise to run their operations.", button: "Start for free" },
    footer: { tagline: "Built for hospitality.", privacy: "Privacy", terms: "Terms", contact: "Contact" },
  },

  fr: {
    nav: { features: "Fonctionnalités", pricing: "Tarifs", customers: "Clients", signIn: "Se connecter", startFree: "Commencer gratuitement" },
    hero: {
      badge: "Conçu pour l'hôtellerie — hôtels, restaurants, traiteurs",
      h1Line1: "Un inventaire qui tourne",
      h1Line2: "aussi vite que votre cuisine",
      description: "Mise donne à votre équipe une visibilité en temps réel sur chaque article, lieu et fournisseur — pour ne jamais manquer de stock, ne jamais sur-commander, et ne jamais perdre de marge.",
      ctaPrimary: "Commencer gratuitement",
      ctaSecondary: "Se connecter à votre compte",
      note: "Aucune carte de crédit requise · Plan gratuit à vie",
    },
    social: { trusted: "Approuvé par des équipes hôtelières dans le monde entier" },
    features: {
      h2: "Tout ce dont votre équipe a besoin",
      description: "Du quai de réception au service — Mise couvre l'ensemble du cycle de vie des stocks sans complexité.",
      items: [
        { title: "Inventaire en temps réel", desc: "Suivez chaque article dans plusieurs lieux avec des mises à jour de quantité en direct à chaque réception, émission et perte." },
        { title: "Bons de commande",         desc: "Créez des BDC, envoyez-les aux fournisseurs et recevez des stocks en livraisons partielles. L'inventaire se met à jour automatiquement." },
        { title: "Rapports & analyses",      desc: "Coût alimentaire %, articles les plus consommés, tendances de gaspillage et alertes de réapprovisionnement — tout pour protéger vos marges." },
        { title: "Accès basé sur les rôles", desc: "Rôles PROPRIÉTAIRE, ADMIN, MANAGER et PERSONNEL avec permissions granulaires. Le personnel enregistre les mouvements ; seuls les managers peuvent commander." },
        { title: "Piste d'audit complète",   desc: "Chaque mouvement de stock est enregistré avec l'utilisateur, l'horodatage et la quantité. Idéal pour la conformité et la responsabilité." },
        { title: "Coût des recettes",        desc: "Liez les recettes aux articles d'inventaire. Obtenez le coût alimentaire % et la marge par plat en temps réel." },
      ],
    },
    testimonials: {
      h2: "Ce que disent nos clients",
      items: [
        { quote: "Nous avons réduit le gaspillage alimentaire de 23 % le premier mois. Les alertes de réapprovisionnement ont à elles seules amorti l'abonnement.", name: "Maria Chen", role: "Directrice F&B, Grand Palace Hotel" },
        { quote: "Enfin un système que mon personnel de cuisine utilisera vraiment. Assez simple pour un cuisinier, assez puissant pour mon DAF.", name: "James Okonkwo", role: "Chef Exécutif, Bistro Collective" },
        { quote: "Le flux des bons de commande est fluide. Notre équipe de réception traite les livraisons 3 fois plus vite qu'avant.", name: "Sofia Reyes", role: "Responsable des opérations, Cloud Kitchen Co." },
      ],
    },
    pricing: {
      h2: "Tarification simple et transparente",
      description: "Commencez gratuitement. Évoluez à votre rythme. Sans frais cachés.",
      mostPopular: "Le plus populaire",
      plans: [
        { name: "Gratuit",    period: "à vie",          desc: "Parfait pour un seul établissement qui démarre.",                       features: ["100 articles d'inventaire", "3 membres d'équipe", "2 emplacements", "Bons de commande", "Mouvements de stock", "Rapports de base"],                                                                  cta: "Commencer" },
        { name: "Pro",        period: "par mois",        desc: "Pour les entreprises hôtelières en croissance.",                       features: ["1 000 articles d'inventaire", "20 membres d'équipe", "10 emplacements", "Tout dans Gratuit", "Analyses avancées", "Coût des recettes", "Journal d'audit", "Support prioritaire"],            cta: "Essai Pro gratuit" },
        { name: "Entreprise", period: "nous contacter",  desc: "Pour les groupes hôteliers et les grandes opérations de restauration.", features: ["Articles illimités", "Utilisateurs illimités", "Emplacements illimités", "Tout dans Pro", "Option auto-hébergée", "SSO / SAML", "Intégrations personnalisées", "Support dédié"], cta: "Contacter les ventes" },
      ],
    },
    cta: { h2: "Prêt à prendre le contrôle de votre inventaire ?", description: "Rejoignez des centaines d'équipes hôtelières qui font confiance à Mise pour gérer leurs opérations.", button: "Commencer gratuitement" },
    footer: { tagline: "Conçu pour l'hôtellerie.", privacy: "Confidentialité", terms: "Conditions", contact: "Contact" },
  },

  es: {
    nav: { features: "Características", pricing: "Precios", customers: "Clientes", signIn: "Iniciar sesión", startFree: "Empezar gratis" },
    hero: {
      badge: "Diseñado para la hostelería — hoteles, restaurantes, catering",
      h1Line1: "Inventario que funciona",
      h1Line2: "tan rápido como tu cocina",
      description: "Mise da a tu equipo visibilidad en tiempo real de cada artículo, ubicación y proveedor — para que nunca te quedes sin stock, nunca hagas pedidos de más, y nunca pierdas margen por desperdicio.",
      ctaPrimary: "Empieza gratis",
      ctaSecondary: "Iniciar sesión en tu cuenta",
      note: "Sin tarjeta de crédito · Plan gratuito para siempre",
    },
    social: { trusted: "Con la confianza de equipos de hostelería en todo el mundo" },
    features: {
      h2: "Todo lo que tu equipo necesita",
      description: "Desde el muelle de recepción hasta el servicio — Mise cubre todo el ciclo de vida del inventario sin complicaciones.",
      items: [
        { title: "Inventario en tiempo real", desc: "Rastrea cada artículo en múltiples ubicaciones con actualizaciones de cantidad en vivo en cada recepción, emisión y movimiento de merma." },
        { title: "Órdenes de compra",         desc: "Crea OC, envíalas a proveedores y recibe stock en envíos parciales. El inventario se actualiza automáticamente al recibir." },
        { title: "Informes y análisis",        desc: "Costo de alimentos %, artículos más consumidos, tendencias de desperdicio y alertas de reorden — todo lo que necesitas para proteger tus márgenes." },
        { title: "Acceso por roles",           desc: "Roles de PROPIETARIO, ADMIN, GERENTE y PERSONAL con permisos detallados. El personal registra movimientos; solo los gerentes pueden hacer pedidos." },
        { title: "Auditoría completa",         desc: "Cada movimiento de stock se registra con usuario, marca de tiempo y cantidad. Perfecto para cumplimiento y responsabilidad." },
        { title: "Costeo de recetas",          desc: "Vincula recetas a artículos de inventario. Obtén el costo de alimentos % y margen por plato en tiempo real." },
      ],
    },
    testimonials: {
      h2: "Lo que dicen nuestros clientes",
      items: [
        { quote: "Redujimos el desperdicio de alimentos en un 23% en el primer mes. Las alertas de reorden por sí solas pagaron la suscripción.", name: "Maria Chen", role: "Directora de A&B, Grand Palace Hotel" },
        { quote: "Por fin un sistema que mi personal de cocina realmente usará. Suficientemente simple para un cocinero, suficientemente potente para mi CFO.", name: "James Okonkwo", role: "Chef Ejecutivo, Bistro Collective" },
        { quote: "El flujo de órdenes de compra es perfecto. Nuestro equipo de recepción procesa entregas 3 veces más rápido que antes.", name: "Sofia Reyes", role: "Gerente de Operaciones, Cloud Kitchen Co." },
      ],
    },
    pricing: {
      h2: "Precios simples y honestos",
      description: "Empieza gratis. Escala a medida que creces. Sin cargos ocultos.",
      mostPopular: "Más popular",
      plans: [
        { name: "Gratis",      period: "para siempre", desc: "Perfecto para un solo establecimiento que está comenzando.",             features: ["100 artículos de inventario", "3 miembros del equipo", "2 ubicaciones", "Órdenes de compra", "Movimientos de stock", "Informes básicos"],                                                            cta: "Comenzar" },
        { name: "Pro",         period: "por mes",       desc: "Para negocios de hostelería en crecimiento.",                           features: ["1.000 artículos de inventario", "20 miembros del equipo", "10 ubicaciones", "Todo en Gratis", "Análisis avanzados", "Costeo de recetas", "Registro de auditoría", "Soporte prioritario"], cta: "Comenzar prueba Pro" },
        { name: "Empresarial", period: "contáctanos",   desc: "Para grupos hoteleros y grandes operaciones de catering.",              features: ["Artículos ilimitados", "Usuarios ilimitados", "Ubicaciones ilimitadas", "Todo en Pro", "Opción auto-alojada", "SSO / SAML", "Integraciones personalizadas", "Soporte dedicado"],        cta: "Contactar ventas" },
      ],
    },
    cta: { h2: "¿Listo para tomar el control de tu inventario?", description: "Únete a cientos de equipos de hostelería que confían en Mise para gestionar sus operaciones.", button: "Empieza gratis" },
    footer: { tagline: "Diseñado para la hostelería.", privacy: "Privacidad", terms: "Términos", contact: "Contacto" },
  },

  ar: {
    nav: { features: "المميزات", pricing: "الأسعار", customers: "العملاء", signIn: "تسجيل الدخول", startFree: "ابدأ مجاناً" },
    hero: {
      badge: "مصمم للضيافة — الفنادق والمطاعم وخدمات التموين",
      h1Line1: "مخزون يعمل",
      h1Line2: "بسرعة مطبخك",
      description: "يمنح Mise فريقك رؤية فورية لكل عنصر وموقع ومورد — حتى لا تنفد المخزونات أبداً، ولا تطلب أكثر من اللازم، ولا تخسر هامشاً بسبب الهدر.",
      ctaPrimary: "ابدأ مجاناً",
      ctaSecondary: "تسجيل الدخول إلى حسابك",
      note: "لا يلزم بطاقة ائتمان · خطة مجانية للأبد",
    },
    social: { trusted: "موثوق به من قِبل فرق الضيافة حول العالم" },
    features: {
      h2: "كل ما يحتاجه فريقك",
      description: "من رصيف الاستلام إلى خدمة العملاء — يغطي Mise دورة حياة المخزون بالكامل دون تعقيد.",
      items: [
        { title: "مخزون في الوقت الفعلي", desc: "تتبع كل عنصر عبر مواقع متعددة مع تحديثات الكمية الفورية عند كل استلام وإصدار وحركة هدر." },
        { title: "أوامر الشراء",           desc: "أنشئ أوامر الشراء وأرسلها إلى الموردين واستلم المخزون في شحنات جزئية. يتحدث المخزون تلقائياً عند الاستلام." },
        { title: "التقارير والتحليلات",    desc: "نسبة تكلفة الغذاء، والعناصر الأكثر استهلاكاً، واتجاهات الهدر، وتنبيهات إعادة الطلب — كل ما تحتاجه لحماية هوامشك." },
        { title: "وصول قائم على الأدوار", desc: "أدوار المالك والمشرف والمدير والموظف مع أذونات دقيقة. يسجل الموظفون الحركات؛ المديرون فقط يمكنهم الطلب." },
        { title: "سجل تدقيق كامل",         desc: "تُسجَّل كل حركة مخزون مع المستخدم والطابع الزمني والكمية. مثالي للامتثال والمساءلة." },
        { title: "تكلفة الوصفات",          desc: "اربط الوصفات بعناصر المخزون. احصل على نسبة تكلفة الغذاء والهامش لكل طبق في الوقت الفعلي." },
      ],
    },
    testimonials: {
      h2: "ما يقوله عملاؤنا",
      items: [
        { quote: "خفضنا هدر الطعام بنسبة 23% في الشهر الأول. تنبيهات إعادة الطلب وحدها كانت تستحق الاشتراك.", name: "ماريا تشين", role: "مديرة الأغذية والمشروبات، فندق غراند بالاس" },
        { quote: "أخيراً نظام سيستخدمه فريق مطبخي فعلاً. بسيط بما يكفي للطاهي، وقوي بما يكفي للمدير المالي.", name: "جيمس أوكونكوو", role: "رئيس الطهاة، بيسترو كوليكتيف" },
        { quote: "سير أوامر الشراء سلس تماماً. يعالج فريق الاستلام لدينا التسليمات بسرعة 3 أضعاف ما كان عليه من قبل.", name: "صوفيا رييس", role: "مديرة العمليات، كلاود كيتشن كو." },
      ],
    },
    pricing: {
      h2: "أسعار بسيطة وشفافة",
      description: "ابدأ مجاناً. توسع مع نموك. بدون رسوم خفية.",
      mostPopular: "الأكثر شعبية",
      plans: [
        { name: "مجاني",       period: "للأبد",       desc: "مثالي لمنفذ واحد في البداية.",                                           features: ["100 عنصر مخزون", "3 أعضاء فريق", "موقعان", "أوامر الشراء", "حركات المخزون", "تقارير أساسية"],                                                                              cta: "ابدأ الآن" },
        { name: "برو",         period: "شهرياً",      desc: "لأعمال الضيافة المتنامية.",                                              features: ["1,000 عنصر مخزون", "20 عضو فريق", "10 مواقع", "كل شيء في المجاني", "تحليلات متقدمة", "تكلفة الوصفات", "سجل التدقيق", "دعم ذو أولوية"],                         cta: "ابدأ تجربة برو" },
        { name: "المؤسسات",   period: "تواصل معنا",  desc: "لمجموعات الفنادق وعمليات التموين الكبيرة.",                              features: ["عناصر غير محدودة", "مستخدمون غير محدودون", "مواقع غير محدودة", "كل شيء في برو", "خيار الاستضافة الذاتية", "SSO / SAML", "تكاملات مخصصة", "دعم مخصص"],      cta: "التواصل مع المبيعات" },
      ],
    },
    cta: { h2: "هل أنت مستعد للسيطرة على مخزونك؟", description: "انضم إلى مئات فرق الضيافة التي تثق في Mise لإدارة عملياتها.", button: "ابدأ مجاناً" },
    footer: { tagline: "مصمم للضيافة.", privacy: "الخصوصية", terms: "الشروط", contact: "اتصل بنا" },
  },

  sw: {
    nav: { features: "Vipengele", pricing: "Bei", customers: "Wateja", signIn: "Ingia", startFree: "Anza Bure" },
    hero: {
      badge: "Imejengwa kwa ukarimu — hoteli, migahawa, upishi",
      h1Line1: "Orodha inayofanya kazi",
      h1Line2: "haraka kama jikoni lako",
      description: "Mise inapa timu yako uonekano wa wakati halisi wa kila bidhaa, mahali na msambazaji — ili usikose hifadhi kamwe, usiagize kupita kiasi, wala kupoteza faida kwa upotevu.",
      ctaPrimary: "Anza Bure",
      ctaSecondary: "Ingia kwenye akaunti yako",
      note: "Hakuna kadi ya mkopo inayohitajika · Mpango wa bure daima",
    },
    social: { trusted: "Inaaminiwa na timu za ukarimu duniani kote" },
    features: {
      h2: "Kila kitu timu yako inahitaji",
      description: "Kutoka gati la kupokea hadi huduma — Mise inashughulikia mzunguko wote wa orodha bila ugumu.",
      items: [
        { title: "Orodha ya wakati halisi", desc: "Fuatilia kila bidhaa katika maeneo mengi na masasisho ya idadi ya moja kwa moja kwa kila stakabadhi, kutoa, na harakati za upotevu." },
        { title: "Maagizo ya ununuzi",      desc: "Unda PO, zitume kwa wasambazaji, na upokee hifadhi katika vipande. Orodha inasasishwa kiotomatiki baada ya kupokea." },
        { title: "Ripoti na uchambuzi",     desc: "Asilimia ya gharama ya chakula, vitu vinavyotumiwa zaidi, mwenendo wa upotevu, na arifa za kuagiza tena — kila kitu unachohitaji kulinda faida zako." },
        { title: "Upatikanaji kwa jukumu", desc: "Majukumu ya MMILIKI, MSIMAMIZI MKUU, MENEJA, na WAFANYIKAZI yenye ruhusa za kina. Wafanyikazi hurekodi harakati; wasimamizi tu wanaweza kuagiza." },
        { title: "Ukaguzi kamili",          desc: "Kila harakati ya hifadhi imeandikwa na mtumiaji, muhuri wa wakati, na idadi. Kamilifu kwa utiifu na uwajibikaji." },
        { title: "Gharama ya mapishi",      desc: "Unganisha mapishi na vitu vya orodha. Pata asilimia ya gharama ya chakula na faida kwa kila sahani mara moja." },
      ],
    },
    testimonials: {
      h2: "Wateja wetu wanasema nini",
      items: [
        { quote: "Tulipunguza upotevu wa chakula kwa 23% katika mwezi wa kwanza. Arifa za kuagiza tena peke yake zililipia usajili.", name: "Maria Chen", role: "Mkurugenzi wa F&B, Grand Palace Hotel" },
        { quote: "Hatimaye mfumo ambao wafanyikazi wangu wa jikoni watautumia kweli. Rahisi vya kutosha kwa mpishi, nguvu ya kutosha kwa CFO wangu.", name: "James Okonkwo", role: "Mpishi Mkuu, Bistro Collective" },
        { quote: "Mtiririko wa agizo la ununuzi ni laini. Timu yetu ya kupokea inashughulikia deliveries mara 3 haraka zaidi kuliko hapo awali.", name: "Sofia Reyes", role: "Meneja wa Operesheni, Cloud Kitchen Co." },
      ],
    },
    pricing: {
      h2: "Bei rahisi na ya uwazi",
      description: "Anza bure. Kuwa mkubwa unavyokua. Hakuna ada zilizofichwa.",
      mostPopular: "Maarufu zaidi",
      plans: [
        { name: "Bure",     period: "milele",         desc: "Kamilifu kwa duka moja linaloanza.",                                      features: ["Bidhaa 100 za orodha", "Wanachama 3 wa timu", "Maeneo 2", "Maagizo ya ununuzi", "Harakati za hifadhi", "Ripoti za msingi"],                                                                   cta: "Anza" },
        { name: "Pro",      period: "kwa mwezi",      desc: "Kwa biashara za ukarimu zinazokua.",                                      features: ["Bidhaa 1,000 za orodha", "Wanachama 20 wa timu", "Maeneo 10", "Kila kitu katika Bure", "Uchambuzi wa hali ya juu", "Gharama ya mapishi", "Kumbukumbu ya ukaguzi", "Msaada wa kipaumbele"], cta: "Anza majaribio ya Pro" },
        { name: "Biashara", period: "wasiliana nasi", desc: "Kwa vikundi vya hoteli na operesheni kubwa za upishi.",                   features: ["Vitu visivyo na kikomo", "Watumiaji wasio na kikomo", "Maeneo yasio na kikomo", "Kila kitu katika Pro", "Chaguo la kujisimamia", "SSO / SAML", "Ushirikiano maalum", "Msaada maalum"],              cta: "Wasiliana na mauzo" },
      ],
    },
    cta: { h2: "Je, uko tayari kudhibiti orodha yako?", description: "Jiunge na mamia ya timu za ukarimu zinazomwamini Mise kuendesha operesheni zao.", button: "Anza bure" },
    footer: { tagline: "Imejengwa kwa ukarimu.", privacy: "Faragha", terms: "Masharti", contact: "Wasiliana" },
  },

  pt: {
    nav: { features: "Funcionalidades", pricing: "Preços", customers: "Clientes", signIn: "Entrar", startFree: "Começar grátis" },
    hero: {
      badge: "Construído para hotelaria — hotéis, restaurantes, catering",
      h1Line1: "Inventário que funciona",
      h1Line2: "tão rápido quanto a sua cozinha",
      description: "O Mise dá à sua equipe visibilidade em tempo real de cada item, local e fornecedor — para que nunca fique sem estoque, nunca peça em excesso, e nunca perca margem com desperdício.",
      ctaPrimary: "Comece grátis",
      ctaSecondary: "Entrar na sua conta",
      note: "Sem cartão de crédito · Plano gratuito para sempre",
    },
    social: { trusted: "Confiado por equipes de hotelaria em todo o mundo" },
    features: {
      h2: "Tudo o que a sua equipe precisa",
      description: "Do cais de recebimento ao serviço — o Mise cobre todo o ciclo de vida do inventário sem complicações.",
      items: [
        { title: "Inventário em tempo real", desc: "Acompanhe cada item em múltiplos locais com atualizações de quantidade ao vivo em cada recebimento, emissão e movimentação de desperdício." },
        { title: "Ordens de compra",         desc: "Crie OCs, envie para fornecedores e receba estoque em envios parciais. O inventário atualiza automaticamente no recebimento." },
        { title: "Relatórios e análises",    desc: "Custo de alimentos %, itens mais consumidos, tendências de desperdício e alertas de reposição — tudo para proteger suas margens." },
        { title: "Acesso baseado em funções",desc: "Funções de PROPRIETÁRIO, ADMIN, GERENTE e FUNCIONÁRIO com permissões detalhadas. Funcionários registram movimentos; apenas gerentes podem pedir." },
        { title: "Trilha de auditoria",      desc: "Cada movimentação de estoque é registrada com usuário, timestamp e quantidade. Perfeito para conformidade e responsabilidade." },
        { title: "Custo de receitas",        desc: "Vincule receitas a itens de inventário. Obtenha custo de alimentos % e margem por prato em tempo real." },
      ],
    },
    testimonials: {
      h2: "O que nossos clientes dizem",
      items: [
        { quote: "Reduzimos o desperdício de alimentos em 23% no primeiro mês. Os alertas de reposição sozinhos pagaram a assinatura.", name: "Maria Chen", role: "Diretora de A&B, Grand Palace Hotel" },
        { quote: "Finalmente um sistema que minha equipe de cozinha vai realmente usar. Simples o suficiente para um cozinheiro, poderoso o suficiente para meu CFO.", name: "James Okonkwo", role: "Chef Executivo, Bistro Collective" },
        { quote: "O fluxo de ordens de compra é perfeito. Nossa equipe de recebimento processa entregas 3x mais rápido do que antes.", name: "Sofia Reyes", role: "Gerente de Operações, Cloud Kitchen Co." },
      ],
    },
    pricing: {
      h2: "Preços simples e honestos",
      description: "Comece grátis. Escale conforme cresce. Sem taxas ocultas.",
      mostPopular: "Mais popular",
      plans: [
        { name: "Grátis",      period: "para sempre",   desc: "Perfeito para um único estabelecimento que está começando.",              features: ["100 itens de inventário", "3 membros de equipe", "2 locais", "Ordens de compra", "Movimentações de estoque", "Relatórios básicos"],                                                              cta: "Começar" },
        { name: "Pro",         period: "por mês",        desc: "Para negócios de hotelaria em crescimento.",                             features: ["1.000 itens de inventário", "20 membros de equipe", "10 locais", "Tudo no Grátis", "Análises avançadas", "Custo de receitas", "Log de auditoria", "Suporte prioritário"],                   cta: "Iniciar trial Pro" },
        { name: "Empresarial", period: "entre em contato",desc: "Para grupos hoteleiros e grandes operações de catering.",               features: ["Itens ilimitados", "Usuários ilimitados", "Locais ilimitados", "Tudo no Pro", "Opção auto-hospedada", "SSO / SAML", "Integrações personalizadas", "Suporte dedicado"],                    cta: "Contatar vendas" },
      ],
    },
    cta: { h2: "Pronto para assumir o controle do seu inventário?", description: "Junte-se a centenas de equipes de hotelaria que confiam no Mise para gerenciar suas operações.", button: "Comece grátis" },
    footer: { tagline: "Construído para hotelaria.", privacy: "Privacidade", terms: "Termos", contact: "Contato" },
  },

  de: {
    nav: { features: "Funktionen", pricing: "Preise", customers: "Kunden", signIn: "Anmelden", startFree: "Kostenlos starten" },
    hero: {
      badge: "Entwickelt für das Gastgewerbe — Hotels, Restaurants, Catering",
      h1Line1: "Inventar, das läuft",
      h1Line2: "so schnell wie Ihre Küche",
      description: "Mise gibt Ihrem Team Echtzeittransparenz über jeden Artikel, Standort und Lieferanten — damit Sie nie den Bestand aufbrauchen, nie zu viel bestellen und nie Marge durch Verschwendung verlieren.",
      ctaPrimary: "Kostenlos starten",
      ctaSecondary: "In Ihren Account einloggen",
      note: "Keine Kreditkarte erforderlich · Kostenloser Plan für immer",
    },
    social: { trusted: "Vertraut von Gastgewerbeteams weltweit" },
    features: {
      h2: "Alles, was Ihr Team braucht",
      description: "Vom Wareneingang bis zum Service — Mise deckt den gesamten Inventarlebenszyklus ohne Komplexität ab.",
      items: [
        { title: "Echtzeit-Inventar",      desc: "Verfolgen Sie jeden Artikel an mehreren Standorten mit Live-Mengenupdates bei jedem Eingang, jeder Ausgabe und jeder Schwundbewegung." },
        { title: "Bestellungen",           desc: "Erstellen Sie Bestellungen, senden Sie sie an Lieferanten und empfangen Sie Waren in Teillieferungen. Das Inventar aktualisiert sich automatisch." },
        { title: "Berichte & Analysen",    desc: "Lebensmittelkostenprozent, meistverbrauchte Artikel, Verschwendungstrends und Nachbestellungsalarme — alles zum Schutz Ihrer Margen." },
        { title: "Rollenbasierter Zugang", desc: "INHABER-, ADMIN-, MANAGER- und MITARBEITER-Rollen mit detaillierten Berechtigungen. Mitarbeiter erfassen Bewegungen; nur Manager können bestellen." },
        { title: "Vollständiger Prüfpfad", desc: "Jede Lagerbewegung wird mit Benutzer, Zeitstempel und Menge protokolliert. Perfekt für Compliance und Verantwortlichkeit." },
        { title: "Rezeptkalkulation",      desc: "Verknüpfen Sie Rezepte mit Lagerartikeln. Erhalten Sie in Echtzeit den Lebensmittelkostenprozent und die Marge pro Gericht." },
      ],
    },
    testimonials: {
      h2: "Was unsere Kunden sagen",
      items: [
        { quote: "Wir haben Lebensmittelverschwendung im ersten Monat um 23% reduziert. Die Nachbestellungsalarme allein haben das Abonnement bezahlt.", name: "Maria Chen", role: "F&B-Direktorin, Grand Palace Hotel" },
        { quote: "Endlich ein System, das mein Küchenpersonal tatsächlich verwenden wird. Einfach genug für einen Linienkoch, leistungsfähig genug für meinen CFO.", name: "James Okonkwo", role: "Küchendirektor, Bistro Collective" },
        { quote: "Der Bestellungsablauf ist nahtlos. Unser Empfangsteam bearbeitet Lieferungen 3x schneller als zuvor.", name: "Sofia Reyes", role: "Betriebsleiterin, Cloud Kitchen Co." },
      ],
    },
    pricing: {
      h2: "Einfache, ehrliche Preise",
      description: "Kostenlos starten. Wachsen Sie mit uns. Keine versteckten Gebühren.",
      mostPopular: "Am beliebtesten",
      plans: [
        { name: "Kostenlos",   period: "für immer",         desc: "Perfekt für einen einzelnen Standort, der gerade anfängt.",           features: ["100 Inventarartikel", "3 Teammitglieder", "2 Standorte", "Bestellungen", "Lagerbewegungen", "Grundberichte"],                                                                                  cta: "Loslegen" },
        { name: "Pro",         period: "pro Monat",         desc: "Für wachsende Gastgewerbebetriebe.",                                  features: ["1.000 Inventarartikel", "20 Teammitglieder", "10 Standorte", "Alles in Kostenlos", "Erweiterte Analysen", "Rezeptkalkulation", "Prüfprotokoll", "Prioritätssupport"],                  cta: "Pro-Test starten" },
        { name: "Unternehmen", period: "Kontakt aufnehmen", desc: "Für Hotelgruppen und große Cateringbetriebe.",                        features: ["Unbegrenzte Artikel", "Unbegrenzte Benutzer", "Unbegrenzte Standorte", "Alles in Pro", "Selbst-gehostete Option", "SSO / SAML", "Individuelle Integrationen", "Dedizierter Support"], cta: "Vertrieb kontaktieren" },
      ],
    },
    cta: { h2: "Bereit, die Kontrolle über Ihr Inventar zu übernehmen?", description: "Schließen Sie sich Hunderten von Gastgewerbeteams an, die Mise für die Verwaltung ihrer Abläufe vertrauen.", button: "Kostenlos starten" },
    footer: { tagline: "Entwickelt für das Gastgewerbe.", privacy: "Datenschutz", terms: "Nutzungsbedingungen", contact: "Kontakt" },
  },

  zh: {
    nav: { features: "功能", pricing: "价格", customers: "客户", signIn: "登录", startFree: "免费开始" },
    hero: {
      badge: "专为酒店业打造 — 酒店、餐厅、餐饮",
      h1Line1: "库存管理",
      h1Line2: "与您的厨房一样高效",
      description: "Mise 为您的团队提供每件物品、每个地点和每位供应商的实时可见性 — 让您永不断货、永不过量订购、永不因浪费而损失利润。",
      ctaPrimary: "免费开始",
      ctaSecondary: "登录您的账户",
      note: "无需信用卡 · 免费计划永久有效",
    },
    social: { trusted: "全球酒店业团队的信赖之选" },
    features: {
      h2: "您的团队所需的一切",
      description: "从收货码头到服务通道 — Mise 涵盖完整的库存生命周期，无任何复杂性。",
      items: [
        { title: "实时库存",       desc: "跨多个地点追踪每件物品，每次收货、发货和损耗移动时实时更新数量。" },
        { title: "采购订单",       desc: "创建采购订单、发送给供应商并分批次接收库存。收货时库存自动更新。" },
        { title: "报告与分析",     desc: "食品成本百分比、最常消耗的物品、浪费趋势和补货提醒 — 一切保护利润所需的信息。" },
        { title: "基于角色的访问", desc: "所有者、管理员、经理和员工角色，具有精细权限。员工可记录移动；只有经理可以下订单。" },
        { title: "完整审计跟踪",   desc: "每次库存移动都记录用户、时间戳和数量。完美适合合规性和问责制。" },
        { title: "食谱成本核算",   desc: "将食谱与库存物品关联。随着食材价格变化，实时获取每道菜的食品成本百分比和利润。" },
      ],
    },
    testimonials: {
      h2: "客户怎么说",
      items: [
        { quote: "第一个月我们将食物浪费减少了23%。仅补货提醒一项就值回了订阅费用。", name: "Maria Chen", role: "餐饮总监，Grand Palace Hotel" },
        { quote: "终于有了一个我的厨房员工真正会使用的系统。对厨师来说足够简单，对我的CFO来说足够强大。", name: "James Okonkwo", role: "行政总厨，Bistro Collective" },
        { quote: "采购订单流程无缝衔接。我们的收货团队处理交货的速度是以前的3倍。", name: "Sofia Reyes", role: "运营经理，Cloud Kitchen Co." },
      ],
    },
    pricing: {
      h2: "简单、诚实的定价",
      description: "免费开始。随增长扩展。无隐藏费用。",
      mostPopular: "最受欢迎",
      plans: [
        { name: "免费",   period: "永久",    desc: "非常适合单一门店起步。",                    features: ["100个库存物品", "3个团队成员", "2个地点", "采购订单", "库存移动", "基本报告"],                                                                              cta: "开始使用" },
        { name: "Pro",    period: "每月",    desc: "适合成长中的酒店业务。",                    features: ["1,000个库存物品", "20个团队成员", "10个地点", "免费版全部功能", "高级分析", "食谱成本核算", "审计日志", "优先支持"],                                         cta: "开始Pro试用" },
        { name: "企业版", period: "联系我们", desc: "适合酒店集团和大型餐饮运营。",              features: ["无限物品", "无限用户", "无限地点", "Pro版全部功能", "自托管选项", "SSO / SAML", "自定义集成", "专属支持"],                                                  cta: "联系销售" },
      ],
    },
    cta: { h2: "准备好掌控您的库存了吗？", description: "加入数百个信任Mise运营其业务的酒店团队。", button: "免费开始" },
    footer: { tagline: "专为酒店业打造。", privacy: "隐私政策", terms: "服务条款", contact: "联系我们" },
  },
};

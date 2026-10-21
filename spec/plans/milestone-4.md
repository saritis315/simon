# תוכנית – Milestone 4: PWA, Offline, עדכוני גרסה והשלמת הפרסום

מבוסס על `MILESTONES.md`, `ARCHITECTURE.md` (§2.7, §2.9, ADR-6, ADR-7, ADR-8, ADR-9) ו-`DESIGN.md` (§1.1 הודעת עדכון, §2.4 App Icon). הקוד הקיים הוא מקור האמת.

## מצב קיים (רלוונטי)
- `vite.config.ts` כבר עם `base: '/simon/'`; אין תיקיית `public/`, אין PWA, `index.html` בלי אייקונים.
- `src/main.tsx` מרנדר `<App />`; `App` מחזיק `useGame` ו-`useHistory`; `HomeScreen` מקבל `game`.
- `.github/workflows/deploy.yml` כבר מריץ typecheck, בדיקות, Build ופריסה ל-Pages על Push ל-`main`.
- סטטוס המשחק (`game.status`) כבר חשוף – מספיק כדי להציג הודעת עדכון רק ב-`idle`.

## שלבי העבודה

### 1. אייקון האפליקציה (ADR-7)
- כתיבת `public/icon.svg` ידנית: לוח עגול בארבעת צבעי המשחק (ירוק למעלה משמאל, אדום למעלה מימין, צהוב למטה משמאל, כחול למטה מימין), מרכז כהה `#0F0F0F`, רקע `#0A1628`, ללא טקסט; הלוח בכ-78% מהקנבס כדי להישאר בתוך ה-Safe Zone של Maskable.
- התקנת `@vite-pwa/assets-generator` (devDependency) והוספת `pwa-assets.config.ts` + סקריפט `npm run generate-pwa-assets`.
- הרצה חד-פעמית שמייצרת ב-`public/`: `pwa-64x64.png`, `pwa-192x192.png`, `pwa-512x512.png`, `maskable-icon-512x512.png`, `apple-touch-icon-180x180.png`, `favicon.ico`. הקבצים נשמרים ב-Repository (ה-CI לא תלוי בכלי).
- פתיחת הקבצים שנוצרו ובדיקה חזותית שהאייקון נראה תקין.

### 2. הגדרת PWA (`vite.config.ts`)
- התקנת `vite-plugin-pwa` (+ `workbox-window` אם נדרש לפי הגרסה).
- הגדרה: `strategies: 'generateSW'`, `registerType: 'prompt'`, `injectRegister: false` (ADR-6), בלי `skipWaiting` ובלי `clientsClaim`.
- Manifest: `id: '/simon/app'`, `name`/`short_name: 'Simon'`, `lang: 'he'`, `dir: 'rtl'`, `display: 'standalone'`, `orientation: 'portrait'`, `start_url` ו-`scope` = `/simon/` (נגזרים מאותו קבוע `base`), `theme_color`/`background_color` = `#0A1628`, אייקונים 192/512 + Maskable.
- Workbox: Precache ל-`html, js, css, svg, png, ico, woff2` (כולל גופני Heebo שבשימוש), `navigateFallback` ל-`index.html` בתוך ה-Scope בלבד, `cleanupOutdatedCaches`.
- `index.html`: קישורי `favicon.ico`, `icon.svg`, `apple-touch-icon`, ו-`<meta name="apple-mobile-web-app-capable">` לפי הצורך ל-iPhone.
- הוספת הפניית טיפוסים `vite-plugin-pwa/client` ל-TypeScript.

### 3. רישום Service Worker והודעת עדכון (ADR-6)
- ב-`src/main.tsx`: `registerSW({ onNeedRefresh })` מ-`virtual:pwa-register`; הדגל נשמר במודול קטן (`src/pwa/updateState.ts`) עם subscribe פשוט, כדי שלא להסתמך על המודול הווירטואלי בבדיקות.
- Hook קטן `useUpdateAvailable` ב-`App` שקורא את הדגל ואת פונקציית `updateSW(true)`.
- רכיב חדש `UpdateBanner` – כרטיס Surface קטן מעל פס הניווט: **"יש גרסה חדשה של המשחק"** + כפתור משני **"עדכן"** (לפי `DESIGN.md` §1.1).
- `HomeScreen` מציג את הרכיב **רק כש-`status === 'idle'`** ורק אם יש עדכון; לא מוצג במסך אודות, בזמן משחק, מושהה או במסך תוצאה.
- סגנון הכרטיס ב-`global.css` (ריווח 8/12/16/24, גבול `Border`), בלי לשנות שום עיצוב אחר.

### 4. Workflow ופריסה
- בדיקה שה-Build מייצר `dist/manifest.webmanifest`, `dist/sw.js` ושכל הנתיבים תחת `/simon/`.
- התאמה של `deploy.yml` רק אם נדרש (נכון להיום הוא כבר עומד בדרישות; לא משנים בלי סיבה).
- **ללא commit/push** לפי CLAUDE.md. אימות הפריסה בפועל ב-`https://saritis315.github.io/simon/` ייעשה לאחר שתבקשי "דחוף שינויים לגיטהאב" – אדריך אותך בשפה פשוטה מה לבדוק שם.

### 5. בדיקות אוטומטיות
- בדיקת `UpdateBanner`: מוצג ב-`idle` כשיש עדכון; **לא** מוצג ב-`presenting`/`awaitingInput`/`paused`/`won`/`lost` ולא באודות; לחיצה על **"עדכן"** קוראת לפונקציית העדכון.
- הרצת כל הבדיקות הקיימות כ-Regression (10 שלבים, כישלון ראשון, קונפטי בניצחון בלבד, השהיה/חידוש/משחק חדש, 10 תוצאות, מחיקה מאושרת).
- `npm run typecheck` ו-`npm run build` עוברים.

### 6. אימות ידני מול Definition of Done
- `npm run build` ואז `npm run preview` (http://localhost:4173/simon/): בדיקת Manifest ו-Service Worker ב-DevTools (Application), הרשמה ו-Precache מוצלח.
- Offline: אחרי טעינה מלאה, ניתוק רשת (DevTools → Offline) ורענון – האתר נפתח; משחק, צלילים, ניווט והיסטוריה פועלים.
- עדכון גרסה: Build שני עם שינוי קטן, בדיקה שההודעה מופיעה בבית ב-`idle` בלבד, ושלחיצה על **"עדכן"** מרעננת רק אז.
- תצוגת Smartphone אנכית ב-RTL (אמולציית מובייל).
- דברים שאי אפשר לאמת כאן ויסומנו בכנות כ"לא נבדק": התקנה על טלפון אמיתי, אודיו במכשיר אמיתי, ופריסה חיה ב-GitHub Pages (תלויה ב-push שלך).

## החלטות / סיכונים
- אין ADR חדש צפוי; ADR-6/7/8/9 כבר מכסים את הכול. אם נדרש שינוי משמעותי במהלך הבנייה – אתעד כ-ADR.
- התקנת חבילות חדשות: `vite-plugin-pwa`, `@vite-pwa/assets-generator` (שתיהן כבר מוגדרות בארכיטקטורה). אין צורך בחשבונות, מפתחות או `.env`.
- סיכון: גרסאות `vite-plugin-pwa` מול Vite 8 – אם יש אי-תאמה, אעצור ואדווח לפני שאעקוף.

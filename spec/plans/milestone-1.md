# תוכנית – Milestone 1: בסיס אפליקציה, שני מסכים מעוצבים ופריסה ראשונה

## דרישה מקדימה (חוסם)
Node.js אינו מותקן במחשב (`node`/`npm` לא נמצאו). לפני הבנייה המשתמשת מתקינה Node.js גרסת LTS מ-nodejs.org (ואז פותחת מחדש את הטרמינל/האפליקציה). Claude מדריך צעד אחר צעד.

## גרסאות וכלים
- npm עם `package-lock.json`. תלויות: `react`, `react-dom`, `@fontsource/heebo`.
- תלויות פיתוח: `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`, `@types/react-dom`, `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`.
- לא מותקנים עדיין (שייכים לאבני דרך הבאות): `canvas-confetti`, `vite-plugin-pwa`.
- סקריפטים: `dev`, `build` (`tsc --noEmit && vite build`), `typecheck`, `test` (`vitest run`), `preview`.

## קבצים ליצירה
**שורש:** `package.json`, `tsconfig.json`, `vite.config.ts` (`base: '/simon/'`, כולל הגדרת Vitest עם jsdom), `index.html` (`lang="he" dir="rtl"`, `viewport-fit=cover`, `<title>סיימון</title>`, theme-color `#0A1628`), `.env.example` לא נדרש (אין משתנים).
**עדכון:** `.gitignore` – רק אם נדרש; `CLAUDE.md` – מילוי "פקודות הרצה".

**`src/`:**
- `main.tsx` – טעינת הגופן (Regular 400, Semibold 600, Bold 700 עברית+לטינית) ו-`styles/global.css`.
- `App.tsx` – מחזיק מסך פעיל (`'home' | 'about'`) ב-`useState` (ללא Router). מרנדר את המסך, את `NavBar` ואת `RotateNotice`.
- `components/NavBar.tsx` – פס תחתון "בית"/"אודות", `aria-current` לפעיל, אייקונים SVG קטנים אופציונליים.
- `components/SimonBoard.tsx` – לוח לפי ADR-1: מיכל עגול `direction: ltr`, גריד 2×2, ארבעה `<button>` עם `aria-label` בעברית (ירוק/אדום/צהוב/כחול), `grid-area` מ-`game/colors.ts`, דיסק מרכזי דקורטיבי ריק. באבן דרך זו הכפתורים לא מגיבים (`disabled`/ללא handler) והלוח במראה "פעיל" כמו "לפני תחילת משחק".
- `game/colors.ts` – הגדרת ארבעת הצבעים: מזהה, שם עברי, HEX, מיקום בגריד (ירוק למעלה-שמאל, אדום למעלה-ימין, צהוב למטה-שמאל, כחול למטה-ימין).
- `screens/HomeScreen.tsx` – כותרת "סיימון", "שלב 1 מתוך 10", שורת סטטוס (ריקה/הנחיה לפי DESIGN), הלוח, כפתור "התחל משחק" (לא מריץ משחק).
- `screens/AboutScreen.tsx` – כותרת "אודות", כרטיס "על המשחק" עם שני הטקסטים המחייבים, כותרת "10 המשחקים האחרונים", חיווי ריק ("אין עדיין משחקים שמורים"). בלי כפתור "מחק היסטוריה" (מוצג רק כשיש רשומות – באבן דרך 3).
- `components/RotateNotice.tsx` – שכבה "סובבו את הטלפון למצב אנכי", מוצגת ב-CSS בלבד (`orientation: landscape` + גובה נמוך).
- `styles/global.css` – משתני CSS (צבעים מסעיף 2.1, ריווח 8/12/16/24, רדיוסים), טיפוגרפיה (H1 32, H2 24, H3 20, Body 16, Caption 14), `100dvh`, `env(safe-area-inset-*)`, `touch-action: manipulation`, `user-select: none` בלוח ובכפתורים, ללא גלילה אופקית, `prefers-reduced-motion`.
- `test/setup.ts` + `App.test.tsx` – בדיקות רינדור וניווט.

**פריסה:** `.github/workflows/deploy.yml` – טריגר push ל-`main` (+ `workflow_dispatch`); הרשאות `contents: read`, `pages: write`, `id-token: write`; שלבים: checkout → setup-node (LTS) → `npm ci` → typecheck → test → build → `upload-pages-artifact` (`dist`) → `deploy-pages`.

## עיצוב (תמצית)
- רקע `#0A1628`, כרטיסים/ניווט `#12213A`, גבול `#1E3556`, כפתור ראשי `#00A3FF` עם טקסט לבן וצל רך, פינות מעוגלות.
- הלוח: מסגרת Charcoal `#0F0F0F`, רווחים כהים בין הרבעים (gap עבה), פינה חיצונית מעוגלת לכל רבע, דיסק מרכזי כהה עם מסגרת.
- ניווט: פס תחתון, פעיל מובחן (רקע כחול כמו ב-Style Guide).
- אין כפתורי הגדרות/סאונד, אין Progress Bar, אין כיתוב על רבעי הלוח.

## בדיקות אוטומטיות
1. האפליקציה נטענת במסך "בית": מוצגים "סיימון", "שלב 1 מתוך 10", "התחל משחק" וארבעה כפתורי צבע עם שמות נגישים.
2. לחיצה על "אודות" מציגה את ההסבר ואת חיווי ההיסטוריה הריקה; לחיצה על "בית" חוזרת.
3. אין כפתור "מחק היסטוריה".

## אימות ידני (בבנייה)
`npm run dev` ובדיקה בדפדפן באמולציית נייד (375×812): אין גלילה אופקית, RTL, מיקום צבעים נכון, מצב אופקי מציג הודעה. אחר כך `npm run build` ו-`npm run preview` בנתיב `/simon/`.

## פריסה – שלבי המשתמשת (בהדרכה, אחרי הבנייה ובאישורה ל-push)
1. לוודא שה-Repository ציבורי (Settings → General → Danger Zone → Change visibility).
2. Settings → Pages → Source: **GitHub Actions**.
3. אחרי ה-push (רק כשהמשתמשת מבקשת): לעקוב ב-Actions שה-Workflow ירוק, ולפתוח `https://saritis315.github.io/simon/`.
- בדיקת 404 ועיצוב מלא באתר הפרוס; סעיף זה ב-DoD לא יסומן כעבר לפני שנבדק בפועל.

## סיכונים
- Node לא מותקן (ראו למעלה).
- פריסה דורשת push – ייעשה רק באישור מפורש; עד אז סעיף הפריסה ב-DoD יוצג כ"ממתין".
- גופן Heebo: משקלים רק 400/600/700 כדי לא לנפח את ה-Build.

## מחוץ לטווח
לוגיקת משחק, אודיו, קונפטי, localStorage, PWA/Service Worker, אייקון אפליקציה (אבן דרך 4).

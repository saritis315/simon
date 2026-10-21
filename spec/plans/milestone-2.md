# תוכנית – Milestone 2: משחק מלא מקצה לקצה, כולל השהיה, חידוש ומשחק חדש

מבוסס על: `ARCHITECTURE.md` (סעיפים 2.3–2.4, ADR-2, ADR-3, ADR-5), `DESIGN.md` (סעיף 1.1, טבלת הקצב) ו-`PRD.md` (4.2, 4.3). הקוד של Milestone 1 הוא נקודת המוצא.

## מצב נוכחי (מה כבר קיים)
- `App.tsx` מחזיק רק את המסך הפעיל; `HomeScreen` סטטי; `SimonBoard` עם ארבעה כפתורים `disabled`; `game/colors.ts` עם הצבעים והמיקומים; `NavBar`, `RotateNotice`, `global.css`, בדיקות ניווט.
- חסר: מנוע משחק, אודיו, קונפטי, תגובת לוח, הודעת סיום, השהיה.

## תלויות חדשות
- `canvas-confetti` + `@types/canvas-confetti` (dev). לא נוספות תלויות אחרות (אודיו דרך Web Audio API המובנה).
- אין משתני סביבה ואין שירותים חיצוניים.

## קבצים

### לוגיקה טהורה (נבדקת בלי React)
- `src/game/config.ts` – קבועי הקצב מטבלת DESIGN: הארה 600, הפסקה 250, פתיחה 1000, המתנת שלב שהושלם 1000, המתנה לפני צבע ראשון 1000, המתנה לפני ניצחון 1000, המתנה לפני הפסד 1000, לחיצת שחקן מינימום 300; `MAX_ROUNDS = 10`.
- `src/game/random.ts` – `randomColor()` עם `Math.random()` (אינדקס 0–3). בבדיקות מוחלף.
- `src/game/gameReducer.ts` – Reducer טהור (ללא אודיו, ללא אחסון, ללא רנדום פנימי).
  - מצב: `status` (`idle | presenting | awaitingInput | advancing | finishing | paused | won | lost`), `sequence`, `round`, `inputIndex`, `completedRounds`, `gameId`, `presentationId`, `outcome`, `silent`.
  - Actions: `start(firstColor)`, `presentationDone`, `press(color, nextColor)`, `advanceDone`, `pause`, `resume`, `newGame(firstColor)`, `finishDone(silent)`, `dismiss`. כל Action חוקי רק במצבים המותרים לפי 2.3/ADR-3 – אחרת מוחזר המצב ללא שינוי.
  - `press` ב-`awaitingInput`: נכון ולא אחרון → מקדם `inputIndex`; נכון ואחרון בשלב < 10 → `advancing` ב-Action אחד (מגדיל `round`, מוסיף `nextColor`, מעדכן `completedRounds`, מאפס `inputIndex`); נכון ואחרון בשלב 10 → `finishing` עם `outcome: 'won'`, `completedRounds: 10`; שגוי → `finishing` עם `outcome: 'lost'` (`completedRounds` נשאר `round - 1`).
  - `pause`: רק מ-`presenting`/`awaitingInput`/`advancing`; מאפס `inputIndex`, מעלה `presentationId`.
  - `resume`: רק מ-`paused`; `presenting`, אותו שלב ורצף, `presentationId` חדש.
  - `newGame`: רק מ-`paused`; רצף חדש בן צבע אחד, `gameId` ו-`presentationId` חדשים.
  - `dismiss`: רק מ-`won`/`lost`; חוזר למצב ההתחלתי ושומר `gameId` ו-`presentationId` (ADR-5).
  - `finishing` אינו מושפע מ-`pause`.

### אודיו
- `src/game/audio.ts` – `AudioEngine`: `unlock()` (יוצר או מחדש `AudioContext`; מחזיר הצלחה/כישלון ואינו מתקדם בשקט בכישלון), `playColor(color)` שמחזיר פונקציית עצירה (Oscillator + Gain עם Envelope קצר), ארבעה גבהי צליל שונים, `playWin()` ו-`playLose()` (שני מוטיבים נבדלים), `stopAll()` שעוצר מיד כל צליל פעיל.
- בבדיקות: Mock של ה-Engine (jsdom אינו כולל Web Audio).

### בקר וממשק
- `src/game/sequenceController.ts` – מנהל הצגת רצף והמתנות עם `AbortController`: קורא ל-callbacks (`light(color|null)`, `done`), כל Timer נרשם וניתן לביטול מיידי; תוצאה מיושנת (לפי `presentationId`) נזרקת.
- `src/game/useGame.ts` – Hook יחיד ב-`App` (כדי שמעבר מסכים לא יפרק את המשחק):
  - מחזיק את ה-Reducer; Effects לפי שינוי מצב:
    - `presenting` → המתנת פתיחה 1000ms, הצגת הרצף (600 הארה + 250 הפסקה), ואז `presentationDone`.
    - `advancing` → 1000ms (חיווי השלב שהושלם נשאר), הצגת מספר השלב הבא, ואז `advanceDone` (שמתחיל `presenting` עם 1000ms לפני הצבע הראשון).
    - `finishing` → המתנה 1000ms ואז `finishDone`; בניצחון: `playWin()` + קונפטי; בהפסד: `playLose()`; אם המשתמש באודות או שהאפליקציה מוסתרת – `silent` (בלי צליל ובלי קונפטי).
    - `won` → קונפטי פעם אחת, ניקוי ביציאה מהמצב (`confetti.reset()`).
  - `pause()` אחת לכל המקורות: ניווט ל"אודות", `visibilitychange` ל-`hidden`, `pagehide`. מבטלת Timers, הארות וצלילים מיד. חזרה ל-`visible` אינה עושה דבר.
  - `startGame()`, `resumeGame()`, `newGame()` – קודם `await engine.unlock()`; אם נכשל: נשארים במצב הנוכחי ומוצגת הודעה בעברית ("לא הצלחנו להפעיל צליל. נסו שוב."), עם אפשרות לנסות שוב מתוך לחיצה חדשה.
  - `pressColor(color)` – ב-`pointerdown` (ADR-2): שיפוט, צליל והארה מיד; הארה נמשכת לפחות 300ms וכל עוד האצבע לוחצת (שחרור נקלט גם ב-`window`); Enter/Space במקלדת.
  - חשיפה ל-UI: `status`, `displayedRound`, `litColor`, `statusText`, `hint`, `audioError`, `completedRounds`, `outcome`.
- `src/components/SimonBoard.tsx` – מקבל `litColor`, `dimmed` (מצבי הצגה/מושהה: רבעים מעומעמים והדלוק זוהר), `disabled` (חסום קלט) ו-`onPress`. הקלט ב-`pointerdown`. ללא כיתוב על הרבעים.
- `src/components/ResultDialog.tsx` – Overlay מעל הלוח: ניצחון "כל הכבוד! ניצחת!" או הפסד "נפסלת!" + "N שלבים שהושלמו" (הפסד), וכפתור "אישור" (Primary). `role="dialog"`, מוקד על "אישור".
- `src/screens/HomeScreen.tsx` – מציג לפי מצב (טבלת DESIGN 1.1):
  - `idle`: "שלב 1 מתוך 10" (או השלב האחרון אחרי סיום), כפתור "התחל משחק".
  - `presenting`/`advancing`/`finishing`: סטטוס "המשחק מציג את הרצף" (או שורה ריקה בהמתנות), בלי כפתור.
  - `awaitingInput`: "התור שלך" + "הקש על הצבעים לפי הסדר".
  - `paused`: "המשחק מושהה", לוח מעומעם, "המשך משחק" (ראשי) + "משחק חדש" (משני).
  - `won`/`lost`: הלוח + `ResultDialog`.
- `src/App.tsx` – מחזיק את `useGame`; מעבר ל"אודות" קורא ל-`pause()` לפני החלפת המסך; ה-`HomeScreen` מקבל את מצב המשחק כ-props.
- `src/styles/global.css` – מצבי `quad` (עמעום, Glow של רבע דולק, מעבר הארה קצר), כפתור משני (קו מתאר), Overlay/Dialog, שורת סטטוס והנחיה. `prefers-reduced-motion` מקטין אנימציה בלי לשנות חוקים.

## בדיקות אוטומטיות (Vitest + Testing Library, Fake Timers, Mock לאודיו וקונפטי)
**Reducer:**
1. רצף באורך 1/2/10 בשלבים 1/2/10; הרצף הקודם נשמר כרישא; חזרות על צבע מותרות.
2. הפסד בשלב 1 → `completedRounds = 0`; הפסד בשלב מתקדם (למשל שלב 5 → 4); ניצחון אחרי שלב 10 → 10; אין שלב 11.
3. `press` ב-`presenting`/`advancing`/`finishing`/`paused` אינו משנה כלום.
4. `pause` מכל מצב מותר; אינו משפיע על `finishing`/`idle`/`won`/`lost`; מאפס `inputIndex`.
5. `resume` – אותו שלב ואותו רצף; `newGame` – רק מ-`paused`, שלב 1 ורצף חדש; `dismiss` → `idle` עם `gameId` שנשמר.
6. משחק חדש אחרי "אישור" + "התחל משחק" יוצר רצף חדש.

**אינטגרציה (App):**
7. התחלה: המתנה 1000ms, הצגה לפי הקצב, מעבר ל"התור שלך".
8. קצב קבוע בין שלבים (אין האצה); הצגת מספר השלב בהמתנות לפי הטבלה.
9. הפסד: מיד צליל הצבע שנלחץ; הודעה וצליל הפסד רק אחרי 1000ms; ללא קונפטי.
10. ניצחון: אחרי 1000ms הודעה, צליל וקונפטי (נקרא פעם אחת).
11. מעבר ל"אודות" בזמן הצגה/שחזור/המתנה בין שלבים → `paused`, `stopAll` נקרא, Timers מבוטלים, אין שינוי מצב אחרי שחולף הזמן (Callback מיושן).
12. חזרה לבית: אין רצף אוטומטי; מוצגים "המשך משחק" ו"משחק חדש"; ב-`idle` ובסיום אינם מוצגים.
13. "המשך משחק" מציג את הרצף המלא, אותו שלב, בלי צבע חדש; "משחק חדש" מתחיל שלב 1 ברצף חדש.
14. `visibilitychange` ל-`hidden` ו-`pagehide` מושהים; חזרה ל-`visible` אינה מחדשת.
15. מעבר לאודות/הסתרה בזמן `finishing` → ההודעה מוצגת בחזרה לבית בלי צליל ובלי קונפטי.
16. כשל `unlock()` → אין התקדמות, מוצגת הודעה, ניסיון חוזר אפשרי; לחיצה כפולה על "המשך משחק" אינה יוצרת שני Resume.
17. רענון (Mount חדש) → `idle`; אין שמירה ל-`localStorage`.

## אימות ידני (בבנייה, בדפדפן באמולציית נייד 375×812)
`npm run dev`: משחק מלא עד הפסד ועד ניצחון (אפשר להאיץ בדיקת ניצחון זמנית רק דרך בדיקות, לא בקוד המוצר), שמיעת ארבעה צלילים שונים, השהיה דרך "אודות" ו"המשך משחק"/"משחק חדש", הסתרת לשונית וחזרה. אימות אודיו אמיתי במכשיר נייד – באחריות המשתמשת בבדיקה (לא יוצג כעבר לפני כן).

## החלטות ו-ADRs
ההחלטות הרלוונטיות כבר רשומות ב-`ARCHITECTURE.md` (ADR-1 עד ADR-5), ללא שינוי. אם במהלך הבנייה תתקבל החלטה משמעותית נוספת – תתועד שם.

## הסתייגויות וסיכונים
- היסטוריה אינה נשמרת באבן דרך זו (Milestone 3); ה-Reducer כבר נושא `gameId` ו-`outcome` כדי להקל על כך.
- צלילי אמת ו-Safari ב-iPhone ניתנים לאימות רק במכשיר; בדיקות אוטומטיות מדמות את האודיו.
- חיווי השלב בזמן `advancing` מציג תחילה את השלב שהושלם ורק אחר כך את הבא (דרך מצב UI מקומי ב-Hook, לא ב-Reducer).
- הודעת עדכון גרסה (UpdateBanner) – לא כלולה כאן (Milestone 4).

## מחוץ לטווח
`localStorage` והיסטוריה (M3), "מחק היסטוריה" (M3), PWA/Offline/עדכוני גרסה/אייקון (M4), הגדרות, השתקה, Progress Bar, ניקוד גבוה.

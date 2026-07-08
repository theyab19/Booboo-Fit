/* ==========================================================================
   بوبو فت — Booboo Fit · app logic
   Vanilla JS · no build step · works offline (shell + SVG illustrations)
   ========================================================================== */
(function () {
  'use strict';

  /* ---------- helpers ---------- */
  const AR_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  const toAr = (v) => String(v).replace(/[0-9]/g, (d) => AR_DIGITS[+d]);
  const el = (html) => {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  };

  /* ==========================================================================
     Inline line-icon set (currentColor, 24x24). Replaces all emoji.
     ========================================================================== */
  const ICON_PATHS = {
    dumbbell: '<rect x="2.5" y="8.5" width="3.6" height="7" rx="1.2"/><rect x="17.9" y="8.5" width="3.6" height="7" rx="1.2"/><path d="M6.1 12h11.8"/><path d="M6.3 10.4v3.2M17.7 10.4v3.2"/>',
    pulse: '<path d="M3 12h4l3 8 4-16 3 8h4"/>',
    leaf: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10Z"/><path d="M2 21c0-3 1.9-5.4 5.1-6"/>',
    play: '<path d="M8 5v14l11-7z" fill="currentColor" stroke="none"/>',
    pause: '<rect x="6.5" y="5" width="3.5" height="14" rx="1" fill="currentColor" stroke="none"/><rect x="14" y="5" width="3.5" height="14" rx="1" fill="currentColor" stroke="none"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5l3.2 2"/>',
    reset: '<path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 4.5V9h-4.5"/>',
    star: '<path d="m12 3 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.2l5.9-.9z"/>',
    trend: '<path d="M3 17l6-6 4 4 8-8"/><path d="M17 7h4v4"/>',
    bulb: '<path d="M9.5 18h5"/><path d="M10 21.5h4"/><path d="M12 2.5a6.5 6.5 0 0 0-3.7 11.8c.5.4.9 1 .9 1.7V17h5.6v-1c0-.7.4-1.3.9-1.7A6.5 6.5 0 0 0 12 2.5Z"/>',
    check: '<path d="M20 6.5 9 17.5l-5-5"/>',
    heart: '<path d="M12 20.5S3.8 15.6 3.8 9.9A4.6 4.6 0 0 1 12 7a4.6 4.6 0 0 1 8.2 2.9c0 5.7-8.2 10.6-8.2 10.6z"/>'
  };
  const icon = (name, cls) =>
    `<svg class="ic${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" ` +
    `stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON_PATHS[name] || ''}</svg>`;

  // Phase metadata: label + icon per phase type
  const PHASE = {
    warmup:   { tag: 'إحماء',  icon: 'pulse',    head: 'الإحماء قبل التمرين', unit: 'حركات' },
    exercise: { tag: 'تمرين',  icon: 'dumbbell', head: 'التمارين',            unit: 'تمارين' },
    stretch:  { tag: 'إطالة',  icon: 'leaf',     head: 'الإطالة بعد التمرين',  unit: 'إطالات' }
  };

  /* ==========================================================================
     SVG stick-figure illustrations (shown when a GIF fails / offline)
     One recognizable archetype per movement pattern. Uses currentColor.
     ========================================================================== */
  const wrap = (inner) => `
    <svg viewBox="0 0 320 180" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">
      <ellipse cx="160" cy="165" rx="94" ry="7" fill="currentColor" opacity="0.10"/>
      <g fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round">${inner}</g>
    </svg>`;
  const head = (x, y) =>
    `<circle cx="${x}" cy="${y}" r="13" fill="currentColor" stroke="none"/>` +
    `<path d="M${x + 9} ${y - 4} q16 5 11 23 q-8 -5 -13 -11z" fill="currentColor" stroke="none" opacity="0.8"/>`;

  const ILLU = {
    press: wrap(head(196, 52) +
      '<path d="M196 65 V116"/><path d="M196 116 l-16 34 M196 116 l16 34"/>' +
      '<path d="M190 74 L128 78 M190 82 L128 86"/><circle cx="120" cy="82" r="9" fill="currentColor" stroke="none"/><path d="M112 60 V104"/>'),
    overhead: wrap(head(160, 58) +
      '<path d="M160 71 V120"/><path d="M160 120 l-15 32 M160 120 l15 32"/>' +
      '<path d="M158 72 L146 40 L146 22 M162 72 L174 40 L174 22"/><path d="M138 20 H182"/>'),
    raise: wrap(head(160, 54) +
      '<path d="M160 67 V118"/><path d="M160 118 l-15 34 M160 118 l15 34"/>' +
      '<path d="M160 72 L122 66 L98 62 M160 72 L198 66 L222 62"/>' +
      '<circle cx="92" cy="61" r="7" fill="currentColor" stroke="none"/><circle cx="228" cy="61" r="7" fill="currentColor" stroke="none"/>'),
    pushdown: wrap(head(158, 50) +
      '<path d="M158 63 V116"/><path d="M158 116 l-15 34 M158 116 l15 34"/>' +
      '<path d="M158 70 L150 96 L150 124 M162 70 L154 96 L154 124"/><path d="M138 126 H166"/>'),
    pulldown: wrap(head(160, 66) +
      '<path d="M160 79 V126"/><path d="M160 126 l-15 28 M160 126 l15 28"/>' +
      '<path d="M154 74 L138 42 L128 28 M166 74 L182 42 L192 28"/><path d="M116 26 H204"/>'),
    row: wrap(head(206, 66) +
      '<path d="M200 74 L150 112"/><path d="M150 112 l-6 40 M150 112 l22 34"/>' +
      '<path d="M192 82 L176 106 L200 112"/><path d="M120 118 H150"/>'),
    curl: wrap(head(160, 48) +
      '<path d="M160 61 V114"/><path d="M160 114 l-15 36 M160 114 l15 36"/>' +
      '<path d="M160 68 L158 100 L182 74"/><circle cx="188" cy="68" r="8" fill="currentColor" stroke="none"/>' +
      '<path d="M160 70 L146 96"/>'),
    hinge: wrap(head(112, 70) +
      '<path d="M118 76 L162 112"/><path d="M162 112 l-8 40 M162 112 l16 40"/>' +
      '<path d="M126 84 V120 M126 120 h4"/><circle cx="126" cy="126" r="7" fill="currentColor" stroke="none"/>' +
      '<path d="M132 118 h30"/>'),
    squat: wrap(head(160, 60) +
      '<path d="M160 73 L160 116"/><path d="M160 116 L134 120 L134 150 M160 116 L186 120 L186 150"/>' +
      '<path d="M160 80 L138 86 M160 82 L182 88"/>'),
    bridge: wrap(head(96, 148) +
      '<path d="M110 148 L172 114 L198 122 L198 150"/>' +
      '<path d="M120 150 L166 120 M132 150 L172 124"/>'),
    seated: wrap(head(150, 84) +
      '<path d="M150 97 L150 140"/><path d="M150 140 L214 146 L244 146"/>' +
      '<path d="M150 104 L196 122 L214 130"/>'),
    kneel: wrap(head(116, 104) +
      '<path d="M126 108 Q160 92 194 110"/><path d="M126 108 L122 142 M126 142 h10"/>' +
      '<path d="M194 110 L200 142 M194 142 h10"/><path d="M126 108 Q160 122 194 110"/>'),
    stretchStand: wrap(head(160, 46) +
      '<path d="M160 59 V112"/><path d="M160 112 L156 152"/>' +
      '<path d="M160 112 Q182 128 168 118 Q160 116 164 100"/><path d="M164 96 L178 124"/>' +
      '<path d="M156 68 L138 48"/>'),
    gluteKick: wrap(head(114, 108) +
      '<path d="M124 112 Q158 98 188 116"/><path d="M124 112 L120 142 M124 142 h10"/>' +
      '<path d="M188 116 L226 100"/><path d="M188 116 L190 138 M188 138 h9"/>'),
    calf: wrap(head(150, 46) +
      '<path d="M150 59 V116"/><path d="M150 116 L146 148 M150 116 L158 148"/>' +
      '<path d="M144 152 h6 M156 152 h6"/><path d="M150 70 L196 66"/><path d="M204 44 V116"/>')
  };
  const illuSvg = (key) => ILLU[key] || ILLU.stretchStand;

  /* ==========================================================================
     GIF sources (all verified 200 image/gif). null => SVG fallback only.
     ========================================================================== */
  const NML = 'https://www.nourishmovelove.com/wp-content/uploads/';
  const FP = 'https://fitnessprogramer.com/wp-content/uploads/';

  /* ==========================================================================
     Program content (numbers exactly as specified)
     ========================================================================== */
  const PROGRAM = {
    push: {
      label: 'دفع', accent: 'push',
      title: 'يوم الدفع', sub: 'صدر · أكتاف · ترايسبس',
      warmup: [
        { ar: 'فتح الصدر وإدخال الإبرة', en: 'Thread the Needle', reps: '٥ لكل جهة', illu: 'kneel', gif: NML + '2021/03/Thread-the-needle.gif',
          cues: ['ابدئي على أربع وظهرك مستوي', 'مرّري يدك تحت صدرك ولفّي الجذع', 'رجّعيها وافتحي صدرك للسقف بهدوء'] },
        { ar: 'تحريك لوحي الكتف', en: 'Scapular Protraction & Rollback', reps: '×١٠', illu: 'kneel', gif: NML + '2021/03/shoulder-blade-protract.gif',
          cues: ['على أربع وثبّتي مرفقيك', 'اطلعي فوق بتبعيد لوحي الكتف', 'ارجعي بضمّهم بدون ما تنزل بطنك'] },
        { ar: 'مدّ ولفّ الجذع', en: 'Kneeling T-Spine Reach', reps: '٥ لكل جهة', illu: 'kneel', gif: NML + '2021/03/opposite-hand-stretch.gif',
          cues: ['اجلسي على كعوبك ويدك على راسك', 'لفّي مرفقك للسقف وتابعيه بعينك', 'رجّعيه تحت بلطف وكرري'] },
        { ar: 'ضغط حائط + مجموعات تحضير', en: 'Wall Push-ups + Warm-up Sets', reps: '١٠ + ٢ خفيفة', illu: 'press', gif: FP + '2021/04/Wall-Push-ups.gif',
          cues: ['١٠ ضغطات على الحائط تفتح صدرك', 'بعدها مجموعتين خفيفتين من أول تمرين', 'خفيفة عشان تسخّني مو تتعبي'] }
      ],
      exercises: [
        { ar: 'ضغط صدر', en: 'Chest Press', sets: 4, reps: '٦–٨', muscle: 'صدر', illu: 'press', gif: FP + '2021/02/Chest-Press-Machine.gif',
          cues: ['ظهرك مسنود ولوحي كتفك مضمومين', 'ادفعي للأمام وعصري صدرك', 'نزّلي بتحكّم لين تحسّين شدّ بالصدر'] },
        { ar: 'ضغط صدر مائل', en: 'Incline Chest Press', sets: 3, reps: '٨–١٠', muscle: 'صدر علوي', illu: 'press', gif: FP + '2021/02/Incline-Dumbbell-Press.gif',
          cues: ['الكرسي مائل خفيف تقريبًا ٣٠ درجة', 'ادفعي لفوق بمسار قطري بسيط', 'لا تفرّطين بالنزول عشان كتفك'] },
        { ar: 'ضغط أكتاف', en: 'Shoulder Press', sets: 3, reps: '٨–١٠', muscle: 'أكتاف', illu: 'overhead', gif: FP + '2021/02/Dumbbell-Shoulder-Press.gif',
          cues: ['ثبّتي بطنك ولا تقوّسين ظهرك', 'ادفعي فوق لين يستوي ذراعك', 'نزّلي لين يصير مرفقك بمستوى كتفك'] },
        { ar: 'رفرفة جانبية كيبل', en: 'Cable Lateral Raise', sets: 4, reps: '١٢–١٥', muscle: 'كتف جانبي', illu: 'raise', gif: FP + '2021/02/Cable-Lateral-Raise.gif',
          cues: ['ارفعي من كتفك مو من رسغك', 'لا تعدّين مستوى الكتف', 'نزّلي ببطء وحسّي الشدّة بالجانب'] },
        { ar: 'ترايسبس بالحبل', en: 'Rope Triceps Pushdown', sets: 3, reps: '١٠–١٢', muscle: 'ترايسبس', illu: 'pushdown', gif: FP + '2021/06/Rope-Pushdown.gif',
          cues: ['ثبّتي مرفقيك على جنبك', 'مدّي لتحت وافتحي الحبل بالنهاية', 'رجّعي بتحكّم بدون ما يطلع مرفقك'] },
        { ar: 'ترايسبس فوق الرأس', en: 'Overhead Triceps Extension', sets: 3, reps: '١٢', muscle: 'ترايسبس', illu: 'overhead', gif: FP + '2021/04/Cable-Rope-Overhead-Triceps-Extension.gif',
          cues: ['مرفقك قريب من راسك وثابت', 'مدّي فوق لين يستوي ذراعك', 'نزّلي خلف راسك بإحساس شدّ'] }
      ],
      stretches: [
        { ar: 'الطاولة المعكوسة', en: 'Reverse Table Top', reps: '٣٠–٤٥ ث', illu: 'bridge', gif: NML + '2025/12/reverse-table-top-Cool-Down-Stretches.gif',
          cues: ['يدينك خلفك وأصابعك للأمام', 'ارفعي وركك وافتحي صدرك', 'رخّي رقبتك وتنفّسي بهدوء'] },
        { ar: 'إطالة الكتف والترايسبس', en: 'Shoulder & Triceps Stretch', reps: '٣٠–٤٥ ث', illu: 'stretchStand', gif: NML + '2025/12/shoulder-and-tricep-stretch-Cool-Down-Stretches.gif',
          cues: ['مرّري ذراعك على صدرك واسحبيها', 'بدّلي للترايسبس خلف راسك', 'ثبّتي بدون ألم وكرري للجهتين'] }
      ],
      tip: 'إطالة الصدر على إطار الباب — حطي ساعدك على الإطار واتقدّمي خطوة، بتحسّين شدّ حلو بالصدر.'
    },

    pull: {
      label: 'سحب', accent: 'pull',
      title: 'يوم السحب', sub: 'ظهر · كتف خلفي · بايسبس',
      warmup: [
        { ar: 'القطة والبقرة', en: 'Cat-Cow', reps: '×٨–١٠', illu: 'kneel', gif: NML + '2025/12/cat-cow-stretch-Cool-Down-Stretches.gif',
          cues: ['على أربع، بدّلي بين تقويس وتحديب', 'تحرّكي من فقرة لفقرة بهدوء', 'تنفّسي مع كل حركة'] },
        { ar: 'ضم لوحي الكتف', en: 'Scapular Squeeze', reps: '×١٠', illu: 'raise', gif: FP + '2021/06/Band-pull-apart.gif',
          cues: ['وقفة مستقيمة وذراعيك للجانب', 'اضمّي لوحي كتفك للخلف', 'ثبّتي ثانية وارخي بهدوء'] },
        { ar: 'الفراشة بظهر مقوّس وممدود', en: 'Butterfly Rounded & Flat Back', reps: '×٨', illu: 'seated', gif: NML + '2021/03/butterfly.gif',
          cues: ['اجلسي وباطن قدميك مع بعض', 'مرّة بظهر مقوّس ومرّة ممدود', 'ادفعي ركبك للأرض بلطف'] }
      ],
      exercises: [
        { ar: 'سحب علوي', en: 'Lat Pulldown', sets: 4, reps: '٨–١٠', muscle: 'ظهر · لاتس', illu: 'pulldown', gif: FP + '2021/02/Lat-Pulldown.gif',
          cues: ['امسكي أوسع من كتفك شوي', 'اسحبي البار لصدرك بضمّ اللوحين', 'طلّعيه ببطء لين يمتد ظهرك'] },
        { ar: 'تجديف بمسند الصدر', en: 'Chest Supported Row', sets: 3, reps: '١٠', muscle: 'ظهر', illu: 'row', gif: FP + '2021/02/45-Degree-Incline-Row.gif',
          cues: ['صدرك مسنود وثابت', 'اسحبي مرفقيك للخلف قريبين من جسمك', 'اعصري ظهرك ثانية بالأعلى'] },
        { ar: 'تجديف أرضي كيبل', en: 'Seated Cable Row', sets: 3, reps: '١٠', muscle: 'ظهر', illu: 'row', gif: FP + '2021/02/Seated-Cable-Row.gif',
          cues: ['ظهرك مستقيم وصدرك مرفوع', 'اسحبي للبطن وضمّي اللوحين', 'الشغل بالظهر مو بالتأرجح'] },
        { ar: 'سحب للوجه', en: 'Face Pull', sets: 3, reps: '١٥', muscle: 'كتف خلفي', illu: 'raise', gif: FP + '2021/02/Face-Pull.gif',
          cues: ['اسحبي الحبل لمستوى وجهك', 'افتحي يديك ومرفقيك عاليين', 'ركّزي على الكتف الخلفي'] },
        { ar: 'مرجحة مائلة دمبل', en: 'Incline Dumbbell Curl', sets: 3, reps: '١٠', muscle: 'بايسبس', illu: 'curl', gif: FP + '2021/02/Seated-Incline-Dumbbell-Curl.gif',
          cues: ['اتكئي على كرسي مائل وذراعك مرتخية', 'ارفعي بالبايسبس بدون تأرجح', 'نزّلي كامل لين يمتد'] },
        { ar: 'مرجحة مطرقية', en: 'Hammer Curl', sets: 3, reps: '١٢', muscle: 'بايسبس · ساعد', illu: 'curl', gif: FP + '2021/02/Hammer-Curl.gif',
          cues: ['كفوفك متقابلة زي المطرقة', 'ارفعي بثبات وثبّتي مرفقك', 'نزّلي ببطء وتحكّم'] }
      ],
      stretches: [
        { ar: 'وضعية الجرو', en: 'Puppy Dog', reps: '٣٠–٤٥ ث', illu: 'kneel', gif: NML + '2025/12/puppy-dog-stretch-Cool-Down-Stretches-routine.gif',
          cues: ['ركبك بالأرض ويدينك للأمام', 'نزّلي صدرك للأرض', 'حسّي شدّ حلو باللاتس'] },
        { ar: 'وضعية الطفل بالمد الجانبي', en: "Child's Pose Reach", reps: '٣٠–٤٥ ث', illu: 'kneel', gif: NML + '2021/03/childs-pose.gif',
          cues: ['اجلسي على كعوبك ومدّي يدينك', 'ميّلي المد لجهة تحسّين شدّ الجنب', 'بدّلي الجهة وتنفّسي'] },
        { ar: 'إطالة الرقبة والترابيس', en: 'Trap & Neck Stretch', reps: '٣٠–٤٥ ث', illu: 'stretchStand', gif: NML + '2021/03/trap-stretch.gif',
          cues: ['ميّلي راسك لجهة كتفك', 'يد خفيفة فوق للشدّ البسيط', 'بلطف للجهتين بدون شدّ قوي'] }
      ],
      tip: 'إطالة البايسبس على الحائط — افردي ذراعك على الجدار خلفك ولفّي جسمك بعكسها شوي.'
    },

    legs: {
      label: 'أرجل', accent: 'legs',
      title: 'يوم الأرجل', sub: 'تركيز المؤخرة',
      warmup: [
        { ar: 'صباح الخير', en: 'Good Mornings', reps: '×١٠', illu: 'hinge', gif: NML + '2025/09/1-good-morning.gif',
          cues: ['يدينك على صدرك أو خلف راسك', 'اهبطي بالورك للخلف وظهرك مستوي', 'ارجعي بعصر المؤخرة'] },
        { ar: 'جسر المؤخرة', en: 'Glute Bridge', reps: '×١٥', illu: 'bridge', gif: NML + '2025/09/9-glute-bridge.gif',
          cues: ['نامي على ظهرك وركبك مثنية', 'ادفعي بكعبك وارفعي وركك', 'اعصري المؤخرة ثانية بالأعلى'] },
        { ar: 'سكوات بوزن الجسم', en: 'Bodyweight Squat', reps: '×١٠', illu: 'squat', gif: NML + '2025/09/4-squats.gif',
          cues: ['قدمينك بعرض كتفك', 'اهبطي وصدرك مرفوع', 'ادفعي بالكعب للطلوع'] },
        { ar: 'خطوة سبايدرمان', en: "World's Greatest Stretch", reps: '٥ لكل جهة', illu: 'squat', gif: NML + '2025/09/6-spiderman-step-ins.gif',
          cues: ['اطلعي خطوة أمامية واسعة', 'نزّلي مرفقك جنب قدمك', 'لفّي جذعك وارفعي يدك للسقف'] },
        { ar: 'تدوير الورك ٩٠/٩٠', en: '90/90 Hip Rotations', reps: '٥ لكل جهة', illu: 'seated', gif: NML + '2025/09/8-hip-rotations.gif',
          cues: ['اجلسي ورجليك بزاوية ٩٠', 'بدّلي ركبك من جهة لجهة', 'خلي الحركة من الورك بهدوء'] },
        { ar: 'دفع ورك تحضيري', en: 'Warm-up Hip Thrust', reps: '٢ خفيفة', illu: 'bridge', gif: FP + '2022/04/bodyweight-hip-thrust.gif',
          cues: ['نفس حركة دفع الورك بوزن خفيف', 'ركّزي على دفع الكعب وعصر المؤخرة', 'تسخين مو إجهاد'] }
      ],
      exercises: [
        { ar: 'دفع الورك', en: 'Hip Thrust', sets: 4, reps: '٨', muscle: 'مؤخرة', illu: 'bridge', gif: FP + '2021/02/Barbell-Hip-Thrust.gif',
          cues: ['لوّحي ظهرك على الكرسي وذقنك مدسوس', 'ادفعي بالكعب وارفعي الورك', 'اعصري المؤخرة ثانية بالأعلى ولا تقوّسين أسفل ظهرك'] },
        { ar: 'رفعة رومانية', en: 'Romanian Deadlift', sets: 4, reps: '٨', muscle: 'خلفية · مؤخرة', illu: 'hinge', gif: FP + '2021/02/Barbell-Romanian-Deadlift.gif',
          cues: ['ادفعي وركك للخلف وظهرك مستوي', 'نزّلي الوزن قريب من رجلك', 'حسّي شدّ الخلفية وارجعي بعصر المؤخرة'] },
        { ar: 'دفع أرجل', en: 'Leg Press', sets: 3, reps: '١٠', muscle: 'أرجل · مؤخرة', illu: 'squat', gif: FP + '2015/11/Leg-Press.gif',
          cues: ['قدمينك بعرض كتفك على المنصة', 'انزلي لين تصير ركبتك ٩٠ درجة', 'ادفعي بالكعب ولا تقفلين ركبتك بالكامل'] },
        { ar: 'سكوات بلغاري', en: 'Bulgarian Split Squat', sets: 3, reps: '١٠ لكل رجل', muscle: 'مؤخرة · فخذ', illu: 'squat', gif: FP + '2021/05/Dumbbell-Bulgarian-Split-Squat.gif',
          cues: ['رجلك الخلفية على الكرسي', 'انزلي عمودي وركبتك الأمامية فوق كعبك', 'ادفعي بكعب رجلك الأمامية'] },
        { ar: 'مبعدات الورك', en: 'Hip Abductor', sets: 3, reps: '١٥', muscle: 'مبعدات · مؤخرة', illu: 'seated', gif: FP + '2021/02/HiP-ABDUCTION-MACHINE.gif',
          cues: ['اجلسي بظهر مسنود', 'افتحي رجليك للجانب بضغط', 'ارجعي ببطء وحسّي جانب المؤخرة'] },
        { ar: 'ركلة خلفية كيبل', en: 'Cable Kickback', sets: 3, reps: '١٥ لكل رجل', muscle: 'مؤخرة', illu: 'gluteKick', gif: FP + '2021/06/Glute-Kickback-Machine.gif',
          cues: ['ميلي شوي للأمام وثبّتي جذعك', 'اركلي رجلك للخلف بالكعب', 'اعصري المؤخرة بالنهاية بدون تقويس الظهر'] },
        { ar: 'رفع السمانة واقفة', en: 'Standing Calf Raise', sets: 4, reps: '١٥', muscle: 'سمانة', illu: 'calf', gif: FP + '2021/06/Standing-Calf-Raise.gif',
          cues: ['اطلعي على أطراف أصابعك بالكامل', 'ثبّتي ثانية بالأعلى', 'نزّلي ببطء لين تحسّين شدّ السمانة'] }
      ],
      stretches: [
        { ar: 'ثنيات الورك جاثية', en: 'Kneeling Hip Flexor', reps: '٣٠–٤٥ ث', illu: 'kneel', gif: NML + '2025/12/hip-flexor-stretch-Cool-Down-Stretches.gif',
          cues: ['ركبة بالأرض والثانية أمامك', 'ادفعي وركك للأمام بلطف', 'حسّي شدّ مقدمة الفخذ'] },
        { ar: 'الخلفية والمؤخرة جالسة', en: 'Seated Hamstring & Glute', reps: '٣٠–٤٥ ث', illu: 'seated', gif: NML + '2025/12/quad-stretch-and-glute-stretch.gif',
          cues: ['اجلسي ومدّي رجلك', 'ميلي من وركك للأمام', 'ظهرك مستوي وتنفّسي'] },
        { ar: 'الفخذ الأمامي واقفة', en: 'Standing Quad', reps: '٣٠–٤٥ ث', illu: 'stretchStand', gif: NML + '2025/12/quad-stretch-standing-Cool-Down-Stretches.gif',
          cues: ['اسحبي قدمك لمؤخرتك', 'خلي ركبك قريبات من بعض', 'ثبّتي واتوازني للجهتين'] },
        { ar: 'السمانة على الحائط', en: 'Wall Calf', reps: '٣٠–٤٥ ث', illu: 'calf', gif: NML + '2025/12/standing-calf-stretch-Cool-Down-Stretches.gif',
          cues: ['يدينك على الحائط ورجل للخلف', 'كعبك بالأرض وركبتك مفرودة', 'اتقدّمي شوي لين تحسّين الشدّ'] }
      ],
      tip: 'وضعية الرقم ٤ (Figure-4) — نامي على ظهرك، حطي كاحلك على ركبة الرجل الثانية واسحبيها لصدرك. ٣٠–٤٥ ث لكل جهة.'
    }
  };

  const DAYS = ['push', 'pull', 'legs'];

  /* ==========================================================================
     Persistent set-tracker state
     ========================================================================== */
  const STORE_KEY = 'booboo-fit:v1';
  const loadState = () => {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; }
    catch (_) { return {}; }
  };
  let STATE = loadState();
  const saveState = () => { try { localStorage.setItem(STORE_KEY, JSON.stringify(STATE)); } catch (_) {} };

  const daySets = (day, i, total) => {
    STATE[day] = STATE[day] || {};
    if (!Array.isArray(STATE[day][i]) || STATE[day][i].length !== total) {
      STATE[day][i] = new Array(total).fill(false);
    }
    return STATE[day][i];
  };
  const dayTotals = (day) => {
    const ex = PROGRAM[day].exercises;
    let total = 0, done = 0;
    ex.forEach((e, i) => { total += e.sets; done += daySets(day, i, e.sets).filter(Boolean).length; });
    return { total, done };
  };

  /* ==========================================================================
     Rendering
     ========================================================================== */
  const ytLink = (en) =>
    'https://www.youtube.com/results?search_query=' + encodeURIComponent(en + ' exercise proper form');

  function mediaHTML(item) {
    const gif = item.gif
      ? `<img class="media__gif" src="${item.gif}" alt="${item.ar}" loading="lazy"
             referrerpolicy="no-referrer" onerror="this.remove()">`
      : '';
    return `<div class="media">
        <div class="media__illu">${illuSvg(item.illu)}</div>
        ${gif}
      </div>`;
  }

  const cuesHTML = (cues) => `<ul class="cues">${cues.map((c) => `<li>${c}</li>`).join('')}</ul>`;

  // type: 'warmup' | 'exercise' | 'stretch'
  function cardHTML(item, day, type, index) {
    const p = PHASE[type];
    let chips;
    if (type === 'exercise') {
      chips = `<span class="chip chip--reps">${toAr(item.sets)} × ${item.reps}</span>
               <span class="chip chip--muscle">${item.muscle}</span>`;
    } else {
      const cls = type === 'stretch' ? 'chip--time' : 'chip--reps';
      chips = `<span class="chip ${cls}">${item.reps}</span>`;
    }

    let tracker = '';
    if (type === 'exercise') {
      const sets = daySets(day, index, item.sets);
      const dots = sets.map((done, s) =>
        `<button class="set-dot ${done ? 'is-done' : ''}" data-day="${day}" data-ex="${index}" data-set="${s}"
                 type="button" aria-pressed="${done}" aria-label="مجموعة ${toAr(s + 1)}">${done ? icon('check') : ''}</button>`
      ).join('');
      tracker = `<div class="tracker">
          <div class="tracker__label">مجموعاتك — دقّي عليها لما تخلّصينها</div>
          <div class="tracker__sets">${dots}</div>
        </div>`;
    }

    return `<article class="card card--${type} reveal">
        <span class="phase-tag phase-tag--${type}">${icon(p.icon)}<span>${p.tag}</span></span>
        ${mediaHTML(item)}
        <h3 class="card__title">${item.ar}</h3>
        <div class="card__title-en">${item.en}</div>
        <div class="chips">${chips}</div>
        ${cuesHTML(item.cues)}
        <a class="watch-btn" href="${ytLink(item.en)}" target="_blank" rel="noopener">${icon('play')}<span>شاهدي المقطع</span></a>
        ${tracker}
      </article>`;
  }

  function phaseHTML(type, count) {
    const p = PHASE[type];
    return `<div class="phase reveal">
        <span class="phase__badge">${icon(p.icon)}</span>
        <span class="phase__text">
          <span class="phase__title">${p.head}</span>
          <span class="phase__count">${toAr(count)} ${p.unit}</span>
        </span>
        <span class="phase__line"></span>
      </div>`;
  }

  function viewHTML(day) {
    const d = PROGRAM[day];
    const { total } = dayTotals(day);
    const warm = d.warmup.map((it, i) => cardHTML(it, day, 'warmup', i)).join('');
    const ex = d.exercises.map((it, i) => cardHTML(it, day, 'exercise', i)).join('');
    const str = d.stretches.map((it, i) => cardHTML(it, day, 'stretch', i)).join('');

    return `
      <section class="view ${day === 'push' ? 'is-active' : ''}" id="view-${day}" role="tabpanel">
        <div class="day-head">
          <h2 class="day-head__title">${d.title}</h2>
          <p class="day-head__sub">${d.sub}</p>
        </div>

        <div class="day-progress">
          <div class="day-progress__row">
            <span class="day-progress__label" id="prog-label-${day}">خلّصتي ٠ من ${toAr(total)} مجموعة</span>
            <button class="day-progress__reset" data-reset="${day}" type="button">${icon('reset')}<span>أسبوع جديد</span></button>
          </div>
          <div class="day-progress__bar"><div class="day-progress__fill" id="prog-fill-${day}"></div></div>
        </div>

        ${phaseHTML('warmup', d.warmup.length)}
        ${warm}
        ${phaseHTML('exercise', d.exercises.length)}
        ${ex}
        ${phaseHTML('stretch', d.stretches.length)}
        ${str}

        <div class="tip"><span class="tip__icon">${icon('bulb')}</span><span><strong>نصيحة: </strong>${d.tip}</span></div>

        <p class="attr">الصور المتحركة من
          <a href="https://www.nourishmovelove.com" target="_blank" rel="noopener">Nourish Move Love</a>
          و <a href="https://fitnessprogramer.com" target="_blank" rel="noopener">Fitness Programer</a>
        </p>

        <footer class="day-footer">
          <div class="day-footer__big">Good Luck Booboo</div>
          <div class="day-footer__note">مسوّي بحب خصيصًا لك ${icon('heart', 'heart-ic')}</div>
        </footer>
      </section>`;
  }

  function updateProgress(day, celebrateIfDone) {
    const { total, done } = dayTotals(day);
    const fill = document.getElementById(`prog-fill-${day}`);
    const label = document.getElementById(`prog-label-${day}`);
    if (fill) fill.style.width = (total ? (done / total) * 100 : 0) + '%';
    if (label) {
      label.innerHTML = done >= total && total > 0
        ? `${icon('check', 'inline-ic')} خلّصتي كل الـ ${toAr(total)} مجموعة`
        : `خلّصتي ${toAr(done)} من ${toAr(total)} مجموعة`;
    }
    if (celebrateIfDone && total > 0 && done === total) celebrate('برافو يا بطلة');
  }

  /* ==========================================================================
     Build the app
     ========================================================================== */
  const views = document.getElementById('views');
  views.innerHTML = DAYS.map(viewHTML).join('');
  DAYS.forEach((d) => updateProgress(d, false));

  /* ---------- reveal-on-scroll (emphasises moving between phases) ---------- */
  let revealObserver = null;
  if ('IntersectionObserver' in window) {
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); revealObserver.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll('.reveal').forEach((n) => revealObserver.observe(n));
  } else {
    document.querySelectorAll('.reveal').forEach((n) => n.classList.add('in'));
  }

  /* ---------- set-dot tracking (event delegation) ---------- */
  views.addEventListener('click', (e) => {
    const dot = e.target.closest('.set-dot');
    if (dot) {
      const { day, ex, set } = dot.dataset;
      const item = PROGRAM[day].exercises[+ex];
      const sets = daySets(day, +ex, item.sets);
      const t = dayTotals(day);
      const wasComplete = t.done === t.total;
      sets[+set] = !sets[+set];
      saveState();
      dot.classList.toggle('is-done', sets[+set]);
      dot.innerHTML = sets[+set] ? icon('check') : '';
      dot.setAttribute('aria-pressed', sets[+set]);
      updateProgress(day, !wasComplete);
      return;
    }
    const reset = e.target.closest('[data-reset]');
    if (reset) {
      const day = reset.dataset.reset;
      STATE[day] = {};
      saveState();
      const old = document.getElementById(`view-${day}`);
      const fresh = el(viewHTML(day));
      fresh.classList.toggle('is-active', old.classList.contains('is-active'));
      old.replaceWith(fresh);
      // revealed immediately (already on screen) + rebind observer for offscreen
      fresh.querySelectorAll('.reveal').forEach((n) => {
        if (revealObserver) revealObserver.observe(n); else n.classList.add('in');
      });
      updateProgress(day, false);
    }
  });

  /* ==========================================================================
     Tabs
     ========================================================================== */
  const tabs = Array.from(document.querySelectorAll('.tab'));
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  const DAY_THEME = { push: '#FFDDEC', pull: '#EBE2FA', legs: '#FFE3DC' };

  function switchDay(day) {
    document.body.dataset.day = day;
    tabs.forEach((t) => {
      const on = t.dataset.tab === day;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', on);
    });
    DAYS.forEach((d) => document.getElementById(`view-${d}`).classList.toggle('is-active', d === day));
    if (themeMeta) themeMeta.setAttribute('content', DAY_THEME[day] || '#FFDDEC');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  tabs.forEach((t) => t.addEventListener('click', () => switchDay(t.dataset.tab)));

  /* ==========================================================================
     Rest timer
     ========================================================================== */
  const sheet = document.getElementById('timerSheet');
  const overlay = document.getElementById('sheetOverlay');
  const display = document.getElementById('timerDisplay');
  const toggleBtn = document.getElementById('timerToggle');
  const resetBtn = document.getElementById('timerReset');
  const presets = Array.from(document.querySelectorAll('.timer__preset'));

  let selected = 90, remaining = 90, ticking = null, audioCtx = null;

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const renderTimer = () => { display.textContent = fmt(remaining); };
  const setToggle = (running) => {
    toggleBtn.innerHTML = running ? `${icon('pause')}<span>إيقاف</span>` : `${icon('play')}<span>ابدئي</span>`;
  };

  function beep() {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const now = audioCtx.currentTime;
      [0, 0.22, 0.44].forEach((t, i) => {
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 660 + i * 220;
        g.gain.setValueAtTime(0.0001, now + t);
        g.gain.exponentialRampToValueAtTime(0.25, now + t + 0.03);
        g.gain.exponentialRampToValueAtTime(0.0001, now + t + 0.2);
        osc.connect(g).connect(audioCtx.destination);
        osc.start(now + t); osc.stop(now + t + 0.22);
      });
    } catch (_) {}
  }
  function stopTimer() { if (ticking) { clearInterval(ticking); ticking = null; } setToggle(false); }
  function finishTimer() {
    stopTimer();
    remaining = selected; renderTimer();
    display.classList.add('is-done');
    setTimeout(() => display.classList.remove('is-done'), 1900);
    if (navigator.vibrate) navigator.vibrate([120, 60, 120, 60, 240]);
    beep();
  }
  function startTimer() {
    if (remaining <= 0) remaining = selected;
    setToggle(true);
    try { if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume(); } catch (_) {}
    ticking = setInterval(() => { remaining -= 1; renderTimer(); if (remaining <= 0) finishTimer(); }, 1000);
  }

  presets.forEach((p) => p.addEventListener('click', () => {
    presets.forEach((x) => x.classList.remove('is-active'));
    p.classList.add('is-active');
    selected = +p.dataset.seconds; stopTimer(); remaining = selected; renderTimer();
  }));
  toggleBtn.addEventListener('click', () => { ticking ? stopTimer() : startTimer(); });
  resetBtn.addEventListener('click', () => { stopTimer(); remaining = selected; renderTimer(); });

  const openSheet = () => { sheet.hidden = false; overlay.hidden = false; };
  const closeSheet = () => { sheet.hidden = true; overlay.hidden = true; };
  document.getElementById('timerFab').addEventListener('click', openSheet);
  overlay.addEventListener('click', closeSheet);
  document.getElementById('sheetClose').addEventListener('click', closeSheet);
  setToggle(false); renderTimer();

  /* ==========================================================================
     Celebration — falling confetti petals + toast (no emoji)
     ========================================================================== */
  const celebrateLayer = document.getElementById('celebrate');
  const CONFETTI_COLORS = ['#E85D9E', '#9B7FD4', '#F4846C', '#F6C25B', '#FFD9EA', '#EBE2FA'];

  function celebrate(message) {
    for (let i = 0; i < 40; i++) {
      const s = document.createElement('span');
      s.className = 'confetti';
      const sz = 8 + Math.random() * 8;
      s.style.width = sz + 'px';
      s.style.height = sz + 'px';
      s.style.left = Math.random() * 100 + 'vw';
      s.style.background = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
      s.style.borderRadius = Math.random() < 0.5 ? '50%' : '2px';
      const dur = 2.4 + Math.random() * 1.8;
      s.style.animationDuration = dur + 's';
      s.style.animationDelay = Math.random() * 0.5 + 's';
      celebrateLayer.appendChild(s);
      setTimeout(() => s.remove(), (dur + 0.6) * 1000);
    }
    if (message) {
      const t = el(`<div class="toast"><span class="toast__ic">${icon('check')}</span><span>${message}</span></div>`);
      document.body.appendChild(t);
      requestAnimationFrame(() => t.classList.add('is-show'));
      setTimeout(() => t.remove(), 2400);
    }
  }

  /* ==========================================================================
     Service worker
     ========================================================================== */
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => { navigator.serviceWorker.register('./sw.js').catch(() => {}); });
  }
})();

/* ============================================================
   Redline. - the brain of the Readiness Check
   ============================================================

   Everything that decides WHAT gets asked and WHAT the answers
   mean lives in this one file. The screens that the user sees
   are in check.js and statement.js, and they do not know anything
   about scoring. They just ask RL for the next question or the
   result and draw whatever comes back.

   I split it this way on purpose. When I want to reword a question
   or change how harshly something is scored, I only have to touch
   this file and nothing visual can break.

   Sagar Nayar, SIT317 Task 8.2HD
   ============================================================ */

const RL = {
  /* The checklist version. In 8.1C I designed the consultant workspace to stamp this
     onto every Statement, so that you can always trace a Statement back to the exact
     version of the checklist that produced it. If OAIC guidance changes later, old
     Statements do not quietly become wrong, they just belong to an older version. */
  VERSION: 'v2.1 (Essential Eight small-firm subset + OAIC guidance, Aug 2026)',

  /* ---------- THE SIX QUESTIONS ----------
     Two things to notice here.

     First, every single question has an "I'm not sure" option. This was the most
     important decision in the whole design. If I force a non-technical principal to
     guess, I get bad data. But if they tell me they do not know where their ID copies
     are, that is genuinely useful, because not knowing is itself the finding.

     Second, the questions are written in the words the buyer uses, not the words the
     security industry uses. Nobody in a six person conveyancing practice says
     "data retention posture". They say "where do the scans end up". */
  questions: [
    {
      /* Q1 is the gate. If a firm provides none of these services then Tranche 2 does
         not capture them, and check.js sends them down the disqualification branch.
         Capture is triggered by the service, not by the profession, which is the thing
         most people get wrong about these reforms. */
      id: 'designated',
      type: 'multi',
      text: 'Does your practice provide any of these services?',
      help: 'Tranche 2 capture is triggered by the service you provide, not by your profession. Tick anything you do, even occasionally.',
      options: [
        { v: 'conveyancing', t: 'Conveyancing or property transfers' },
        { v: 'trusts',       t: 'Forming or managing companies or trusts' },
        { v: 'clientmoney',  t: 'Holding or managing client money' },
        { v: 'realestate',   t: 'Buying or selling real estate for a client' },
        { v: 'none',         t: 'None of these', exclusive: true },
        { v: 'unsure',       t: "I'm not sure", unsure: true }
      ]
    },
    {
      /* Multi-select on purpose. The honest answer is almost always "several of these",
         and each location I get back becomes a separate finding further down. */
      id: 'where',
      type: 'multi',
      text: 'Where do client ID documents end up?',
      help: 'Think about where a scanned licence or passport actually lands, not where it is supposed to land.',
      options: [
        { v: 'mailbox',  t: 'Email inbox or shared mailbox' },
        { v: 'drive',    t: 'Shared network drive' },
        { v: 'pms',      t: 'Practice management system' },
        { v: 'scanner',  t: 'Scanner drop folder' },
        { v: 'laptops',  t: 'Staff laptops' },
        { v: 'unsure',   t: "I'm not sure", unsure: true }
      ]
    },
    {
      /* This is the money question. It is the one thing free government guidance does not
         help a firm answer, and it is the gap the whole business exists to close. */
      id: 'retention',
      type: 'single',
      text: 'Do you still hold full copies of ID documents verified more than twelve months ago?',
      help: 'Full copies are not required for AML/CTF record-keeping once they have served their verification purpose.',
      options: [
        { v: 'no',     t: 'No, they are removed once verification is done' },
        { v: 'some',   t: 'Some of them, probably' },
        { v: 'yes',    t: 'Yes, we keep everything' },
        { v: 'unsure', t: "I'm not sure", unsure: true }
      ]
    },
    {
      id: 'mfa',
      type: 'single',
      text: 'Is multi-factor authentication turned on for every staff account?',
      help: 'This covers email, your practice management system and any cloud storage.',
      options: [
        { v: 'all',    t: 'Yes, on every account' },
        { v: 'most',   t: 'On most accounts' },
        { v: 'none',   t: 'No, or only on mine' },
        { v: 'unsure', t: "I'm not sure", unsure: true }
      ]
    },
    {
      /* Proving a negative. I wrote this one in AUSTRAC's voice rather than mine, because
         the principal needs to imagine being asked, not read a definition. */
      id: 'prove',
      type: 'single',
      text: "If AUSTRAC asked today, could you show what you hold and what you've deleted?",
      help: 'This is the hardest part of the obligation, so an honest answer here is worth more than a confident one.',
      options: [
        { v: 'documented', t: "Yes, it's documented" },
        { v: 'partly',     t: "Partly, we'd have to go looking" },
        { v: 'no',         t: 'No' },
        { v: 'unsure',     t: "I'm not sure", unsure: true }
      ]
    },
    {
      id: 'admin',
      type: 'single',
      text: 'How many people have administrator access to your main systems?',
      help: 'Administrator access means being able to add or remove staff accounts, or change security settings.',
      options: [
        { v: 'few',    t: 'One or two' },
        { v: 'some',   t: 'Three to five' },
        { v: 'many',   t: 'More than five' },
        { v: 'unsure', t: "I'm not sure", unsure: true }
      ]
    }
  ],

  /* ---------- SCORING ----------
     Dead simple by design. Every answer is worth some risk points and more points means
     more exposure. I did not want a weighted percentage model here, because the output
     is a named band and not a number, so extra precision would be fake precision.

     The weights are not random though. Shared mailboxes and scanner folders score highest
     among the storage locations because they are the two places where copies pile up that
     nobody ever decided to keep. A practice management system scores nothing at all,
     because that is where the copies are supposed to be.

     Notice that "unsure" never scores zero. If I scored not-knowing as harmless then the
     easiest way to get a good result would be to not know anything, which is backwards. */
  score(a) {
    let pts = 0;
    const w = a.where || [];
    if (w.includes('mailbox')) pts += 3;
    if (w.includes('scanner')) pts += 3;
    if (w.includes('laptops')) pts += 2;
    if (w.includes('drive'))   pts += 1;
    if (w.includes('unsure'))  pts += 3;

    pts += ({ no:0, some:2, yes:4, unsure:3 })[a.retention] ?? 0;
    pts += ({ all:0, most:2, none:4, unsure:3 })[a.mfa] ?? 0;
    pts += ({ documented:0, partly:3, no:4, unsure:3 })[a.prove] ?? 0;
    pts += ({ few:0, some:1, many:3, unsure:2 })[a.admin] ?? 0;
    return pts;
  },

  /* ---------- BANDS ----------
     Four named bands instead of a score out of 100. A number invites an argument about
     methodology that I would lose, and it means nothing to a non-technical reader anyway.
     "Developing" tells a principal roughly where they sit in one word, and it cannot be
     mistaken for a certification, which matters because we are not allowed to certify
     anything. */
  bandFor(pts) {
    if (pts <= 3)  return { key:'strong',     name:'Strong',     fill:4,
      note:'Your handling of client identity information is in good shape against the small-firm subset of the Essential Eight.' };
    if (pts <= 8)  return { key:'managed',    name:'Managed',    fill:3,
      note:'The basics are in place. The remaining gaps are narrow and can be closed quickly.' };
    if (pts <= 14) return { key:'developing', name:'Developing', fill:2,
      note:'Your practice collects and verifies correctly. The gap is at retention.' };
    return           { key:'initial',    name:'Initial',    fill:1,
      note:'Client identity information is spread across places nobody is accountable for. This is where most practices start.' };
  },

  /* ---------- FINDINGS ----------
     This turns raw answers into things a human can act on. Each finding carries a weight
     (w) so I can sort them and only show the top three, because showing someone eleven
     problems at once is how you get them to do none of them.

     The wording matters as much as the logic here. Every description says why the thing is
     a problem, in plain English, without making the person feel stupid for having the
     problem in the first place. They are running a conveyancing practice, not a SOC. */
  findings(a) {
    const out = [];
    const w = a.where || [];
    if (w.includes('mailbox')) out.push({ k:'mailbox', w:8,
      t:'Full ID copies sitting in a shared mailbox',
      d:'A shared mailbox is the hardest place to prove anything about, because everyone can reach it and nothing records who removed what.' });
    if (w.includes('scanner')) out.push({ k:'scanner', w:7,
      t:'Scanner drop folder is never cleared',
      d:'Scanned licences accumulate here by default. Nobody decided to keep them, which is exactly why they are still there.' });
    if (a.retention === 'yes' || a.retention === 'some') out.push({ k:'retention', w:9,
      t:'Full ID copies held past their verification purpose',
      d:'OAIC guidance is that full copies are not required for AML/CTF record-keeping once they are no longer needed, unless another lawful reason applies.' });
    if (a.retention === 'unsure') out.push({ k:'retention', w:9,
      t:'Nobody knows what identity copies the practice still holds',
      d:'Not knowing is itself a finding. It is also the answer that takes the longest to fix, so it is worth starting here.' });
    if (a.mfa === 'none' || a.mfa === 'most') out.push({ k:'mfa', w:8,
      t:'Multi-factor authentication is not on every account',
      d:'Business email compromise is the dominant loss category for Australian small business, and MFA is the single control that blocks most of it.' });
    if (a.mfa === 'unsure') out.push({ k:'mfa', w:8,
      t:'MFA coverage across staff accounts is unknown',
      d:'Coverage can be checked in about fifteen minutes from your admin console, and the answer is usually worse than expected.' });
    if (a.prove === 'partly' || a.prove === 'no' || a.prove === 'unsure') out.push({ k:'prove', w:10,
      t:'No record of what has been deleted',
      d:'You can describe what you hold, but not what you no longer hold. Proving that negative is the part with no free substitute.' });
    if (a.admin === 'many') out.push({ k:'admin', w:5,
      t:'More than five people hold administrator access',
      d:'Administrator access rarely gets revoked when someone changes role or leaves, so it quietly accumulates.' });
    if (a.admin === 'unsure') out.push({ k:'admin', w:5,
      t:'Administrator access has never been reviewed',
      d:'Worth listing every account with admin rights once, then deciding who genuinely still needs them.' });
    if (w.includes('laptops')) out.push({ k:'laptops', w:4,
      t:'ID documents stored on staff laptops',
      d:'These copies leave the practice with the device, and they are invisible to any central clean-up.' });
    if (w.includes('unsure')) out.push({ k:'where', w:9,
      t:'The practice cannot say where client ID is stored',
      d:'Mapping the locations is the first hour of any review, and it usually turns up two places nobody mentioned.' });
    return out.sort((x, y) => y.w - x.w);
  },

  /* ---------- WHAT TO DO ABOUT IT ----------
     Each finding maps to one concrete action. The time estimates are the important bit.
     Our buyer has about two hours a month for security, so "turn on MFA" is a vague
     intention but "turn on MFA, about 25 minutes" is something they can put in a calendar.

     Only ever three of these get shown at once. That restraint is deliberate and it runs
     through the whole design. */
  ACTIONS: {
    mailbox:   { t:'Search the shared mailbox for attachments and remove the full ID copies',      e:'~20 min' },
    scanner:   { t:'Set the scanner drop folder to clear itself automatically after seven days',   e:'~10 min' },
    retention: { t:'List every full ID copy held past verification, then remove or de-identify',   e:'~45 min' },
    mfa:       { t:'Turn on multi-factor authentication for every staff and admin account',        e:'~25 min' },
    prove:     { t:'Start a deletion register recording path, date and authorising person',        e:'~15 min' },
    admin:     { t:'Reduce administrator accounts to the two people who genuinely need them',      e:'~15 min' },
    laptops:   { t:'Move ID copies off staff laptops into one reviewed location',                  e:'~30 min' },
    where:     { t:'Map every location where client ID is stored, with the principal present',     e:'~40 min' }
  },

  /* ---------- REMEMBERING THE ANSWERS ----------
     sessionStorage rather than localStorage, and definitely not a server. The answers only
     need to survive the jump from check.html to statement.html, and then they can go.
     Nothing is transmitted anywhere and it all disappears when the tab closes.

     This is not just laziness about not building a backend. Redline. sells data
     minimisation to its clients, so a prototype that quietly hoarded their answers would
     be a bit rich. Everything is wrapped in try/catch because some browsers block storage
     entirely in private mode, and I would rather the page still work than throw. */
  save(a){ try{ sessionStorage.setItem('rl.answers', JSON.stringify(a)); }catch(e){} },
  load(){ try{ return JSON.parse(sessionStorage.getItem('rl.answers') || 'null'); }catch(e){ return null; } },
  clear(){ try{ sessionStorage.removeItem('rl.answers'); }catch(e){} },

  /* Every Statement needs a reference number so that a firm can point at a specific
     document months later and say "this is when our position was established". Generated
     once per session and then kept, so the number does not change if you reload. */
  ref(){
    let r = null;
    try{ r = sessionStorage.getItem('rl.ref'); }catch(e){}
    if(!r){
      r = 'RL-2026-' + String(Math.floor(1000 + Math.random()*8999));
      try{ sessionStorage.setItem('rl.ref', r); }catch(e){}
    }
    return r;
  },

  today(){
    return new Date().toLocaleDateString('en-AU',{day:'2-digit',month:'short',year:'numeric'}).toUpperCase();
  }
};

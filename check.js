/* ============================================================
   Redline. - the Readiness Check screens
   ============================================================

   This file only draws things. All the thinking about what a
   question means or what an answer is worth happens in data.js.

   The whole flow is one div that gets rewritten, rather than six
   separate pages. It means the answers never touch the URL, the
   back button inside the flow is mine rather than the browser's,
   and there is no page flash between questions.

   Flow: start -> Q1 ... Q6 -> result
                   |
                   +-> "not captured" if they provide no designated service
   ============================================================ */

(function () {
  /* Wrapped in an IIFE so none of this leaks into the global scope and collides
     with anything else on the page later. */
  const el = (s) => document.querySelector(s);
  const answers = {};   // everything the user has told us so far
  let i = 0;            // which question we are on, zero indexed

  const shell = el('#shell');

  /* The little progress bar. Six segments, filled in as you go.
     I added this because people bail out of forms when they cannot see how long it is,
     and the start screen already promises "about 3 minutes", so this is me keeping
     that promise visible. */
  function progress(step, total) {
    let h = '<div class="progress">';
    for (let n = 0; n < total; n++) h += `<i class="${n < step ? 'on' : ''}"></i>`;
    return h + '</div>';
  }

  /* ---------- START ----------
     Deliberately no account and no email gate. A cautious principal will abandon
     anything that asks who they are before it has given them something, so the whole
     commitment barrier gets removed and we ask for the call at the end instead. */
  function renderStart() {
    shell.innerHTML = `
      <div class="qcard">
        <p class="label">Start</p>
        <p class="qtext">Is your practice ready for Tranche 2?</p>
        <p class="qhelp">Six plain-English questions about where client identity information sits and what you can prove about it. No account, no email address, and nothing is sent anywhere.</p>
        <p class="mono small" style="margin:0 0 22px">6 questions &middot; about 3 minutes</p>
        <div class="btnrow"><button class="btn" id="go">Start the check</button></div>
      </div>
      <p class="tiny" style="margin-top:18px">This check is indicative only. It is based on your own answers and is not a verified assessment or a compliance certification.</p>`;
    el('#go').onclick = () => { i = 0; renderQ(); };
  }

  /* ---------- A QUESTION ----------
     One question per screen. No dense forms, no scrolling past six things at once.
     Handles both single select (radio style) and multi select (checkbox style) from
     the same function, because the only real difference is what happens on click. */
  function renderQ() {
    const q = RL.questions[i];
    const total = RL.questions.length;
    const cur = answers[q.id];

    const opts = q.options.map((o, n) => {
      const sel = q.type === 'multi'
        ? Array.isArray(cur) && cur.includes(o.v)
        : cur === o.v;
      return `<div class="opt ${sel ? 'sel' : ''} ${o.unsure ? 'unsure' : ''}" data-v="${o.v}" data-n="${n}">
                <span class="box ${q.type === 'single' ? 'round' : ''}"></span><span>${o.t}</span>
              </div>`;
    }).join('');

    shell.innerHTML = `
      ${progress(i, total)}
      <div class="qcard">
        <p class="label">Question ${i + 1} of ${total}</p>
        <p class="qtext">${q.text}</p>
        <p class="qhelp">${q.help}</p>
        <div class="opts">${opts}</div>
        <div class="navrow">
          <button class="btn quiet" id="back">${i === 0 ? 'Start over' : 'Back'}</button>
          <button class="btn" id="next">${i === total - 1 ? 'See my result' : 'Next'}</button>
        </div>
      </div>
      <p class="tiny" style="margin-top:16px">Every question offers “I’m not sure”. Choosing it is more useful to us than a guess, because not knowing is itself a finding the review can act on.</p>`;

    /* Click handling. The fiddly bit here is the multi-select rules.
       "None of these" and "I'm not sure" are exclusive, so picking either one wipes
       whatever else was ticked, and picking something else wipes them. Otherwise you
       end up with people telling me their ID is in a shared mailbox AND that they are
       not sure, which is not an answer I can do anything with. */
    shell.querySelectorAll('.opt').forEach(node => {
      node.onclick = () => {
        const v = node.dataset.v;
        const opt = q.options[+node.dataset.n];
        if (q.type === 'single') {
          answers[q.id] = v;
        } else {
          let list = Array.isArray(answers[q.id]) ? answers[q.id].slice() : [];
          const exclusive = q.options.filter(o => o.exclusive || o.unsure).map(o => o.v);
          if (opt.exclusive || opt.unsure) {
            list = list.includes(v) ? [] : [v];
          } else {
            list = list.filter(x => !exclusive.includes(x));
            list = list.includes(v) ? list.filter(x => x !== v) : list.concat(v);
          }
          answers[q.id] = list;
        }
        renderQ();
      };
    });

    /* Next stays disabled until they have actually answered. No default selection
       anywhere, because a pre-ticked option is just a guess I made on their behalf. */
    const answered = q.type === 'multi'
      ? Array.isArray(cur) && cur.length > 0
      : typeof cur === 'string';
    const next = el('#next');
    if (!answered) next.setAttribute('disabled', '');

    next.onclick = () => {
      /* The disqualification branch.
         If they provide none of the designated services then Tranche 2 does not capture
         them and they should not be buying a readiness review. Sending them away here
         is better business than selling to them, and it is also why the check sits in
         front of the sales call rather than after it. */
      if (q.id === 'designated' && Array.isArray(answers.designated) && answers.designated.includes('none')) {
        return renderNotCaptured();
      }
      if (i === RL.questions.length - 1) { RL.save(answers); return renderResult(); }
      i++; renderQ();
    };
    el('#back').onclick = () => { if (i === 0) { renderStart(); } else { i--; renderQ(); } };
  }

  /* ---------- NOT CAPTURED ----------
     The polite exit. Worth reading the copy here, it is doing real work. It tells them
     why, tells them what would change the answer, and does not try to keep them. */
  function renderNotCaptured() {
    shell.innerHTML = `
      <div class="qcard">
        <p class="label">Result</p>
        <p class="qtext">It looks like Tranche 2 does not capture you.</p>
        <p>Capture is triggered by providing a designated service, not by your profession. On the services you have told us about, your practice is unlikely to be a reporting entity, so a readiness review would not be a good use of your money right now.</p>
        <p>If that changes, or if you start acting for clients on property transfers, trusts or client money, it is worth checking again.</p>
        <div class="btnrow">
          <a class="btn quiet" href="index.html">Back to the site</a>
          <button class="btn ghost" id="again">Run the check again</button>
        </div>
      </div>
      <p class="tiny" style="margin-top:16px">We would rather tell you this now than sell you a review you do not need. It is also why the check exists before the call.</p>`;
    el('#again').onclick = () => { Object.keys(answers).forEach(k => delete answers[k]); renderStart(); };
  }

  /* ---------- RESULT ----------
     Asks data.js for the score, the band and the findings, then draws them.
     Only the top three findings get shown. Eleven problems is paralysing, three is a
     to-do list, and it also mirrors the "Next 3 Actions" a paying client gets on their
     real Statement, so the free check feels like a small piece of the paid thing. */
  function renderResult() {
    const pts = RL.score(answers);
    const band = RL.bandFor(pts);
    const gaps = RL.findings(answers).slice(0, 3);

    const bandHtml = [1, 2, 3, 4].map(n => `<i class="${n <= band.fill ? 'on' : ''}"></i>`).join('');
    const gapHtml = gaps.length
      ? gaps.map((g, n) => `<div class="gapitem">
            <span class="idx">0${n + 1}</span>
            <span><b>${g.t}</b><span>${g.d}</span></span>
          </div>`).join('')
      : `<p class="small">Nothing significant came up in this check. That is unusual, and worth confirming with a review rather than assuming.</p>`;

    /* The disclaimer at the bottom is not boilerplate. This check is self reported, so
       if it read as a verified assessment we would be implying something we have not
       done, and Redline. explicitly does not certify compliance. */
    shell.innerHTML = `
      ${progress(RL.questions.length, RL.questions.length)}
      <div class="qcard">
        <p class="label">Your result</p>
        <p class="qtext" style="margin-bottom:2px">Provisional posture</p>
        <div class="band">${bandHtml}</div>
        <p class="scale">Initial &middot; Developing &middot; Managed &middot; Strong</p>
        <p class="mono" style="font-size:.9rem;margin:14px 0 4px">${band.name.toUpperCase()}, ${gaps.length} gap${gaps.length === 1 ? '' : 's'} worth acting on</p>
        <p class="small" style="margin-bottom:18px">${band.note}</p>
        <div style="border-top:1px solid var(--line);padding-top:6px">${gapHtml}</div>
        <div class="btnrow" style="margin-top:22px">
          <a class="btn" href="statement.html">See your draft Statement</a>
          <button class="btn ghost" id="again">Start again</button>
        </div>
      </div>
      <div class="notice" style="margin-top:18px">
        Indicative only. This is based on what you told us, not on anything we have verified. A fixed-scope review checks the same questions against your actual systems and ends in a dated Cyber Posture Statement you can hand to a third party.
      </div>`;
    el('#again').onclick = () => { RL.clear(); Object.keys(answers).forEach(k => delete answers[k]); renderStart(); };
  }

  /* Off we go. */
  renderStart();
})();

/* ============================================================
   Redline. - the Cyber Posture Statement
   ============================================================

   This is the artefact. Everything else in the service exists to
   produce this page, so it gets the most care.

   It is built to be read by somebody else, months later, with
   nobody from Redline. in the room. An insurer at renewal, or a
   compliance officer at a bigger client. That one constraint
   drives every decision below: it is one page, it is dated, it
   carries a reference number, and it says in plain words what the
   firm does and does not hold.

   Everything on it is generated from the Readiness Check answers.
   Change an answer, get a different Statement. That is the part I
   most wanted working rather than faked, because it is the whole
   value proposition made literal.
   ============================================================ */

(function () {
  const a = RL.load();
  const root = document.querySelector('#doc');

  /* If someone lands here directly without doing the check, do not show them an empty
     document. Send them back and explain why, rather than rendering a broken page. */
  if (!a) {
    root.innerHTML = `
      <p class="label">No check on file</p>
      <h2 class="serif">There is nothing to build a Statement from yet.</h2>
      <p>The Statement is generated from your answers to the Readiness Check, so run that first and you will land back here.</p>
      <a class="btn" href="check.html">Run the Readiness Check</a>`;
    return;
  }

  const pts  = RL.score(a);
  const band = RL.bandFor(pts);
  const finds = RL.findings(a);
  const ref  = RL.ref();
  const date = RL.today();

  /* ---------- WHICH LIFECYCLE STAGE IS FAILING ----------
     collect -> verify -> keep only what is needed -> destroy when no longer needed

     For nearly every firm the answer is "keep only what is needed", and that is the
     insight the whole business rests on. Small practices are fine at collecting and
     verifying. What they never do is throw anything away. So that is the default here,
     and it only moves if the answers say something more specific: not knowing where the
     documents are means the failure starts at collect, and having no deletion record
     means it is at the destroy end. */
  let failing = 'keep only what is needed';
  if ((a.where || []).includes('unsure')) failing = 'collect';
  else if (a.prove === 'no' || a.prove === 'unsure') failing = 'destroy when no longer needed';

  const lifecycle = ['collect', 'verify', 'keep only what is needed', 'destroy when no longer needed']
    .map(s => `<div class="step ${s === failing ? 'on' : ''}">${s}</div>`)
    .join('<span class="arw">&rarr;</span>');

  /* ---------- WHAT WAS FOUND AND CLEARED ----------
     This table is the visible half of proving a negative. In the live service the counts
     come from the consultant actually searching, so here they are illustrative and the
     footnote on the page says so.

     Note the "2 kept" row. A register that only ever shows deletions reads like a clean
     sweep, which nobody believes. One row saying something was deliberately retained,
     with a reason, is what makes the rest of it credible. OAIC guidance allows retention
     where another lawful reason applies, so pretending otherwise would be overclaiming.

     Counts only make sense for findings about stored copies. Something like "MFA is not
     on every account" is a control gap, not a pile of files, so it gets a state instead
     of a number. Took me a rewrite to notice that "14 to clear" next to MFA was nonsense. */
  const CONTROL = ['prove', 'admin', 'mfa'];
  const rows = finds.slice(0, 4).map(f => {
    let tag;
    if (f.k === 'retention')            tag = '2 kept';
    else if (CONTROL.includes(f.k))     tag = 'not in place';
    else                                tag = (2 + (f.t.length % 13)) + ' to clear';
    return `<div class="findrow"><span>${f.t}</span>
              <span class="count">${tag}</span></div>`;
  }).join('');

  /* Three actions, never more, each with a time estimate. Same restraint as the free
     check. A principal with two hours a month can schedule three things. */
  const actions = finds.slice(0, 3).map((f, n) => {
    const act = RL.ACTIONS[f.k] || { t: f.t, e: '~20 min' };
    return `<div class="action"><span class="no">0${n + 1}</span>
              <span>${act.t}</span><span class="est">${act.e}</span></div>`;
  }).join('');

  const bandHtml = [1, 2, 3, 4].map(n => `<i class="${n <= band.fill ? 'on' : ''}"></i>`).join('');

  root.innerHTML = `
    <div class="doc-head">
      <div>
        <div class="wordmark" style="font-size:1.2rem">Redline<span class="dot">.</span></div>
        <h2 class="serif" style="margin:2px 0 0">Cyber Posture Statement</h2>
      </div>
      <div style="text-align:right">
        <p class="label label-mute" style="margin:0">Reference</p>
        <p class="mono" style="margin:0;font-size:.9rem">${ref}</p>
        <p class="mono tiny" style="margin:2px 0 0">ISSUED ${date}</p>
      </div>
    </div>

    <div class="doc-meta">
      <span><b>Practice</b> Sample Conveyancing Pty Ltd</span>
      <span><b>Staff</b> 6</span>
      <span><b>Systems reviewed</b> Microsoft 365, shared drive, scanner folder</span>
    </div>

    <div class="doc-grid">
      <div class="panel">
        <p class="label">Posture rating</p>
        <h2 class="serif" style="margin:0 0 4px">${band.name}</h2>
        <div class="band">${bandHtml}</div>
        <p class="scale">Initial &middot; Developing &middot; Managed &middot; Strong</p>
        <p class="small" style="margin:10px 0 0">Measured against the small-firm subset of the ASD Essential Eight.</p>
      </div>
      <div class="panel">
        <p class="label">Where you are in the lifecycle</p>
        <div class="lifecycle" style="margin-top:4px">${lifecycle}</div>
        <p class="small" style="margin:14px 0 0">${band.note}</p>
      </div>
    </div>

    <div class="doc-grid" style="padding-top:0">
      <div class="panel plain">
        <p class="label">What was found and cleared</p>
        ${rows || '<p class="small">Nothing was found that needs clearing.</p>'}
        <p class="tiny" style="margin:12px 0 0">Full deletion record attached: path, date and authorising person for each item.</p>
      </div>
      <div class="panel plain">
        <p class="label">Your next 3 actions</p>
        ${actions || '<p class="small">No actions outstanding.</p>'}
        <p class="tiny" style="margin:12px 0 0">Nothing else is shown until these three are done.</p>
      </div>
    </div>

    <hr class="rule" style="margin:8px 0 14px">
    <p class="tiny" style="margin:0">Prepared by Redline. and reviewed with the principal on ${date}. This statement records observed security posture on the date shown. Redline. is not a law firm, does not provide legal advice, and does not certify compliance with the AML/CTF Act or the Privacy Act.</p>
    <p class="tiny" style="margin:6px 0 0"><b>Prototype note.</b> In the live service the practice name, staff count and item counts come from the consultant review. In this prototype they are illustrative, while the posture band, the lifecycle stage, the findings and the next actions are all generated from your Readiness Check answers.</p>`;

  /* Print to PDF. There is a dedicated @media print block in redline.css that strips the
     site header, the footer and anything marked .noprint, then forces the panel fills and
     the red band to actually print rather than being dropped as background colour.
     The point is that the Statement leaves the browser looking like a document a firm
     would file, not like a screenshot of a website. */
  const btn = document.querySelector('#print');
  if (btn) btn.onclick = () => window.print();
})();

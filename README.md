# Redline. High-Fidelity Prototype (SIT317 Task 8.2HD)

Sagar Nayar (224846163) · Team 9, Redline. · Project 2, Cyber Safety

A cyber-readiness and privacy-assurance service for small Australian professional-services
firms brought into scope by the Tranche 2 AML/CTF reforms.

---

## Running it

No build step and no dependencies. Open `index.html` in any modern browser.

To serve it locally instead (which some browsers prefer):

    python3 -m http.server 8000

Then open <http://localhost:8000>.

The fonts (Newsreader and IBM Plex) load from Google Fonts, so the first load needs a
network connection. Without one the pages still work, they just fall back to system faces.

---

## The four screens

| File | Screen | Status |
|---|---|---|
| `index.html` | Landing page | High fidelity, static |
| `check.html` | Tranche 2 Cyber & Privacy Readiness Check | **Working.** Six questions, real branching and scoring |
| `statement.html` | Cyber Posture Statement | **Working.** Generated from the Check answers, prints to PDF |
| `workspace.html` | Consultant review workspace | High fidelity, simulated |

## What actually works, rather than being simulated

- **Six-question flow** with a progress bar, back navigation, and single- and multi-select
  question types.
- **"I'm not sure" on every question**, scored as a real finding rather than a skipped answer,
  because not knowing where identity documents are stored is itself a gap.
- **A disqualification branch.** Answering "none of these" to the designated-services question
  ends the flow with an honest "Tranche 2 does not capture you" result instead of pushing a
  sales call. Capture is triggered by the service provided, not by profession.
- **Scoring engine** in `js/data.js` that converts answers into risk points, then into one of
  four named posture bands (Initial, Developing, Managed, Strong).
- **Findings and remediation** derived from the specific answers given, ranked by weight, each
  mapped to a concrete next action with a realistic time estimate.
- **A generated Cyber Posture Statement.** The posture band, the failing lifecycle stage, the
  found-and-cleared table and the three next actions all change with the answers.
- **Print to PDF** via a dedicated print stylesheet, so the Statement leaves the browser as the
  one-page document a client would file.

Answers are held in `sessionStorage` only. Nothing is transmitted, and the data disappears
when the tab closes.

## What is simulated, and why

- The **consultant workspace** is a static screen. In the live service it sits behind
  authentication and holds real client data, so building it functionally here would mean
  handling information the prototype has no business holding.
- **Practice name, staff count and item counts** on the Statement are illustrative. In the live
  service they come from the consultant review rather than the self-assessment.
- There is **no backend**. The Readiness Check in production would persist to managed
  PostgreSQL hosted in an Australian region, per the Task 7.1P technology plan.

## File structure

    index.html          Landing page
    check.html          Readiness Check
    statement.html      Cyber Posture Statement
    workspace.html      Consultant review workspace (simulated)
    css/redline.css     Brand stylesheet, including the print rules
    js/data.js          Questions, scoring, findings and remediation mapping
    js/check.js         Readiness Check flow and branching
    js/statement.js     Statement generation
    README.md           This file

## Colour and type

Carried from the Task 6.1P Marketing and Branding Plan.

| Token | Value | Use |
|---|---|---|
| Paper | `#FAF7F1` | Page background |
| Ink | `#2C2A28` | All body text |
| Redline Red | `#A8201A` | Marks, state and calls to action only, never a large fill |
| Line | `#DCD4C6` | Hairlines and borders |
| Band | `#F2EEE5` | Quiet panel fills |

Newsreader for the wordmark and headings, IBM Plex Sans for body text, IBM Plex Mono for
dates, references and labels.

Red at large scale reads as danger, and this buyer responds to a calm, evidence-led register.
So red is used as a mark: filled segments of a posture band, the selected answer, the failing
lifecycle stage, and the primary action. Nothing else on any screen carries colour.

## Related submissions

- Task 6.1P, Marketing and Branding Plan (team)
- Task 6.2C, Landing page, first high-fidelity screen
- Task 7.1P, Design and Technology Plan (team)
- Task 8.1C, Low-fidelity prototype, the four wireframes this build is based on
- Task 9.1D, Business Plan

## Acknowledgement of generative AI use

The four low-fidelity wireframes that this prototype implements were designed and drawn by me
in PowerPoint for Task 8.1C. Claude (Anthropic, accessed September 2026) was used to write the
HTML, CSS and JavaScript in this repository from those designs and from the question set,
scoring approach and content decisions I specified. All output was reviewed and tested by me,
including checking that no wording overstates AML/CTF or Privacy Act obligations.

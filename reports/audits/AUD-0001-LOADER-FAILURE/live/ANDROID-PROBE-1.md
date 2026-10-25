[2] Instrumented probe run (diagnostics note, verbatim):
< paste the full diagnostics note here >

The relayed Issue #2 comment contains the literal placeholder above rather than the full diagnostics transcript. No additional verbatim probe transcript was present in the retrievable relay record, so this file does not fabricate one.

Associated adjudication text from the same human-relayed Issue #2 comment (preserved verbatim):

ADJUDICATION:
- dist/ IS present on device; stub main.js = 99 bytes → install layout is NOT the cause.
- Replication of the stub via the probe's own injected require COMPLETED with
  module.exports === undefined: the injected require returns undefined SILENTLY
  for relative specifiers (no exception) → loader export check found no
  constructor → "No exports detected".
- The probe itself (self-contained main.js, sole external "obsidian") loaded and
  ran on the same device → self-contained bundle validated in principle on Android.
- G0 remaining criterion: disposable-vault install of the bundled artifact
  (post ADR-0002 execution) loading on Android.

Source: https://github.com/mizael-miz/1-SBKMPZK.HoloTaxon-fcf86651704d72301c52f7fc07acc0e3/issues/2#issuecomment-6400314962
Evidence limitation: the above adjudication is a relayed summary, not a substitute for the missing full probe diagnostics note.

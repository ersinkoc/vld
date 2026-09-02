# DEPRECATED — 3.0.2 → 3.0.4
#
# This was a temporary script used to verify the 6 required-field VLD
# bugs were fixed after the 3.0.2 patch. The same coverage is now part
# of the standard dropin audit suite (examples/dropin/audit.mjs) and
# the VLD regression test suite
# (tests/validators/required-field.test.ts). No need to run this
# separately.

throw new Error(
  'examples/dropin/verify-fix.mjs was a temporary 3.0.2 verification ' +
  'script and is no longer needed. The required-field behaviour is ' +
  'covered by examples/dropin/audit.mjs and ' +
  'tests/validators/required-field.test.ts. ' +
  'To run the dropin suite, use: node examples/dropin/run.mjs'
);

# DEPRECATED — 3.0.2 → 3.0.4
#
# This was a one-shot script used during the 3.0.2 release to add the
# `requiredField` locale key to every locale file in src/locales/. The
# migration is now complete and the locales are kept in sync going
# forward via the standard translation pipeline.
#
# This file is kept only as a historical reference and intentionally
# throws if executed.

throw new Error(
  'examples/dropin/add-locale-msg.mjs was a one-shot 3.0.2 migration ' +
  'script and is no longer needed. The locales are already up to date. ' +
  'To run the dropin suite, use: node examples/dropin/run.mjs'
);

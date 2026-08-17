# Security Policy

## Supported Versions

The `@oxog/vld` package follows the latest release line. Security patches are
applied to the `main` branch and shipped in the next release.

| Version line | Supported |
| ------------ | --------- |
| `2.x` (latest) | Yes — active bug fixes and security patches |
| `1.x` | No — please upgrade |

The `engines` field in `package.json` requires `node >= 18`. CI is exercised on
Node 20, 22, and 24 (see `.github/workflows/ci.yml`).

## Reporting a Vulnerability

Please **do not** file a public issue for suspected vulnerabilities. Instead,
email **security@ersinkoc.dev** with a clear subject line (e.g. `[vld] CVE-class
issue in <area>`) and the following details:

1. The affected version range and the version you reproduced on
2. A minimal reproduction (input data, schema, expected vs. actual behaviour)
3. The impact category — for example, validation bypass, DoS via pathological
   input, prototype pollution through a parser, or unsafe deserialization
4. Whether you intend to disclose publicly and the timeline you prefer

A maintainer will acknowledge within **72 hours** and aim for an initial triage
within **7 days**. If the report is accepted, a fix will be coordinated
privately and shipped in a patch release with full credit in `CHANGELOG.md`
unless you ask to remain anonymous.

## Out-of-Scope Reports

- Performance regressions that do not have security impact — please file a
  regular GitHub issue instead
- Behavioural differences from Zod that are intentional (see
  `docs/ZOD_COMPATIBILITY.md` for the audited contract)
- Reports against unsupported versions (see the table above)

## Disclosure Notes

- VLD performs runtime checks only. It does not execute, deserialize, or eval
  user data — input strings reach the parser as plain JS values
- The package has no runtime dependencies. The dependency surface is `dev`-only
  and does not ship to consumers
- The release pipeline (`scripts/verify-security.cjs`) audits the built `dist/`
  output as part of `npm run release:check`
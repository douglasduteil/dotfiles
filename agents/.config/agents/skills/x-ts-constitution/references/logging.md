# Log events and error events

Detail behind the logging rules in `SKILL.md` (Article V). The rules, not this
file, are normative; these are their sources and their long form.

## Log events name one precise state

A log event is a contract with whoever queries it: dashboards, alerts, the next
incident. The rules follow the OpenTelemetry [events](https://opentelemetry.io/docs/specs/semconv/general/events/)
and [naming](https://opentelemetry.io/docs/specs/semconv/general/naming/)
conventions.

- The name states what happened, as `<namespace>.<entity>.<state>` in lowercase
  snake_case: `rate_limit.denied`, `dns.lookup.failed`, `dns.domain.unreachable`.
  An operation name such as `dns.check` says what ran and hides the outcome.
- One name, one field set. Outcomes with different fields get different names;
  per-occurrence values (domain, uid) go in fields, never in the name.
- Field names stay precise across events. A field the OpenTelemetry
  [attribute registry](https://opentelemetry.io/docs/specs/semconv/registry/attributes/)
  defines keeps its registry name (`error.type`, `exception.message`,
  `http.route`); a field of your own is snake_case. `kind` is the in-code
  discriminant and stays in code: a failure event carries `error.type`, a
  low-cardinality class from a documented list (`timeout`, `http_error`), and a
  success event carries none.
- The shell builds each event by an explicit mapping, one `switch` branch per
  variant: the same total function as error mapping (Article IV). Spreading a
  domain object (`{ ...failure }`) leaks its internal names into the contract
  and silently changes the log whenever the type changes.

## An error event carries what happened

In production the log is the only witness. Each error event answers when, where,
who and what on its own, without a second lookup ([OWASP Logging Cheat Sheet,
event attributes](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html#event-attributes)).

- **One event, one line.** The shell writes one JSON object per event to stdout,
  unbuffered: `timestamp` (ISO 8601, UTC), `severity`, `event.name`, then
  fields. A multi-line `console.error(err)` arrives as separate records in most
  collectors, and the stack loses its event.
- **Correlation.** The shell gives each request an id at the edge (a trusted
  incoming `traceparent` or `x-request-id`, else a fresh UUID), puts it on every
  event of that request as `request.id`, and shows it on the error page, so a
  user's report leads to the event ([OWASP, note
  A](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html#event-attributes)).
- **The whole exception.** `exception.type`, `exception.message`,
  `exception.stacktrace`, plus `exception.causes`: the `cause` chain unrolled to
  an array of `{ type, message }`. A library wrapper names itself and its root
  cause names the reason (openid-client `ClientError: invalid response
  encountered` wraps `response parameter "iss" missing`). Set `error.type` to
  the first type in the chain that classifies the failure ([OTel exceptions in
  logs](https://opentelemetry.io/docs/specs/semconv/exceptions/exceptions-logs/),
  [`error.type`](https://opentelemetry.io/docs/specs/semconv/registry/attributes/error/)).
- **The operation.** `http.request.method`, `http.route` (the route template,
  never the raw path), `http.response.status_code`, and the domain step that
  failed, plus the inputs that chose the branch (which prompt, which flag).
  Values of secrets stay out.
- **Severity by impact** ([OTel
  severity](https://opentelemetry.io/docs/specs/semconv/exceptions/exceptions-logs/#severity)):
  `FATAL` for a startup failure such as invalid config; `ERROR` for an exception
  reaching the framework's error handler; `WARN` for a handled failure of an
  outbound call; `DEBUG` for a client cancellation. A domain rejection is an
  expected outcome (Article IV): it gets its own event name at `INFO` or `WARN`,
  with no stack.
- **Event names for exceptions** follow OTel: `<operation>.exception`
  (`http.server.request.exception`), or `exception` for a global handler.
- **Excluded data** ([OWASP, data to
  exclude](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html#data-to-exclude)):
  session ids (log a hash when one is needed), access, ID and refresh tokens,
  authorization codes, passwords, keys, sensitive personal data. Library errors
  carry requests and responses in `cause`: copy only `type` and `message` from
  each link, and redact secret-bearing query parameters (`code`, `state`,
  `id_token_hint`) from any URL, keeping the key (`code=REDACTED`).
- **Logging never breaks the request.** A logger failure falls back to a plain
  line on stderr. JSON encoding neutralizes CR and LF from untrusted input.

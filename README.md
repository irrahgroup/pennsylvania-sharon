# @zapi-omni/n8n-nodes-hubmessage

Community node for using the [HubMessage API](https://developer.hubmessage.io/) in n8n.
It creates and connects WhatsApp channels, sends nine message types, and manages Meta
message templates.

## Installation

In a self-hosted n8n instance, open **Settings → Community Nodes**, select
**Install**, and enter:

```text
@zapi-omni/n8n-nodes-hubmessage
```

Restart n8n after installing or updating the package. This package is developed and
tested against n8n 2.x.

## Credentials

Create a **HubMessage API** credential with:

- **Base URL:** `https://api.hubmessage.io`;
- **Secret Key:** generated in the HubMessage Security panel.

The node sends the key as a Bearer token. Credential validation uses the official,
read-only `GET /whatsapp/businesses` endpoint.

## Resources and operations

### Channel

- **Create:** creates a `META_WHATSAPP` channel with `POST /v1/channels`.
- **Connect:** completes the Meta connection with
  `POST /v1/channels/{channelId}/connect` using the values returned by the
  HubMessage Connect SDK.

### Message

All message operations send through `POST /v1/channels/{channelId}/messages`:

- Send Text;
- Send Audio;
- Send Contact;
- Send Image;
- Send Interactive Action;
- Send Interactive Button;
- Send Sticker;
- Send Template;
- Send Video.

Enter the HubMessage **Channel ID** manually. Expressions are supported. Free-form
messages require an open WhatsApp 24-hour conversation window; outside that window,
send an approved template first.

Interactive buttons use reorderable visual editors by default. Reply messages accept
one to three buttons with unique IDs. Action buttons provide URL and Call types with
conditional fields. Both operations also provide a JSON mode for dynamic arrays and
advanced expressions.

Contact phone numbers can be entered with a visual list or as a comma-separated list.
Common formatting characters such as `+`, spaces, parentheses, dots, and hyphens are
removed before the number is sent. The node requires digits after normalization and
enforces only the E.164 maximum of 15 digits; HubMessage remains responsible for
validating whether the complete DDI + DDD + number is routable.

Thumbnail media type provides the documented JPEG and MP4 suggestions plus a Custom
option for other MIME types accepted by HubMessage. When a Thumbnail URL is added,
Thumbnail MIME Type must also be added. Custom values must use the `type/subtype`
format, for example `image/png`. Template components remain JSON because Meta's
component schema varies by template type.

Development builds that predate the Options collections stored `caption`,
`interactiveHeader`, `interactiveFooter`, `thumbnailUrl`, and `thumbnailMimeType` at
the node root. These fields remain recognized as hidden compatibility parameters and
are used only when their replacement inside Options was not explicitly configured.
New workflows should use Options.

### Template

- Get Many WABAs;
- Get Many;
- Create;
- Update;
- Sync;
- Delete.

`Get Many` returns one n8n item per template. An empty API list produces no output
items; enable n8n's **Always Output Data** setting when the following branch must run
for an empty list. `Sync` returns the complete synchronization response as one item.

During integration testing, `GET /whatsapp/businesses` returned an empty list even
with a connected Meta channel. HubMessage confirmed that it was investigating the
backend behavior. Until a production fix is confirmed, an empty **Get Many WABAs**
result may reflect this known limitation rather than a credential permission issue.

## Example workflow

The package includes `workflows/hubmessage-all-operations-test.json`, containing all
17 operations. Its HubMessage nodes are disabled by default to prevent accidental
channel changes or message sends. After importing it, assign your own credential,
complete the **Config** node, and enable one operation at a time.

## Development

```bash
npm install
npm run lint
npm test
```

Methods, paths, and payloads are validated against the official documentation at
[developer.hubmessage.io](https://developer.hubmessage.io/).

## License

[MIT](LICENSE)

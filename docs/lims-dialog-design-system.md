# LIMS Dialog Design System Notes

These notes document the Create Parameter dialog reference for future LIMS modal states.

## Dialog Shell

- Dialog width: responsive full width with a desktop max-width around `980px`.
- Mobile width: viewport width minus page padding.
- Background: `#ffffff`.
- Border: `1px solid #dfe5ec`.
- Border radius: large, about `22px`.
- Shadow: deep but soft, `0 24px 70px rgba(16, 24, 40, 0.18)`.
- Body should scroll when content exceeds viewport height.

## Header

- Header uses horizontal layout: title left, close icon right.
- Padding: `20px` mobile, `28px` desktop.
- Divider below header: `1px solid #dfe5ec`.
- Title: `22px`, bold, dark `#111827`.
- Close icon: muted gray `#667085`, compact square hit area, subtle gray hover.

## Body

- Padding: `20px` mobile, `28px` desktop.
- Vertical spacing between major groups: `20px`.
- Avoid horizontal overflow; grids should wrap before inputs become cramped.

## Labels And Inputs

- Main label: `13px`, semibold, `#344054`.
- Compact row label: `11px`, semibold, `#667085`.
- Input height: `38px`.
- Input radius: `8px`.
- Input border: `#dfe5ec`.
- Input text: `13px`, medium, `#111827`.
- Placeholder color: `#98a2b3`.
- Focus: teal border `#006c5b` and a soft teal ring.
- Search input uses a muted icon inset on the left with input padding adjusted.

## Dropdowns

- Dropdowns share the same height, border, radius, and text style as inputs.
- Native selects are acceptable for now; future states can swap to the shared select component if needed.

## Buttons

- Footer buttons: `40px` tall, `8px` radius.
- Cancel: gray background `#f2f4f7`, text `#344054`.
- Save: teal background `#006c5b`, white text.
- Unit Add button: attached to the unit input, black `#111827`, white text, rounded right corners only.
- New Range button: outlined teal, white background, `36px` tall, plus icon on the left.

## Toggle Switches

- Toggle card: white background, subtle border `#e5e9ef`, `12px` radius.
- Track size: about `44px x 24px`.
- Off track: `#d0d5dd`.
- On track: `#006c5b`.
- Knob: white, `20px`, subtle shadow.
- Toggle label: `13px`, bold, `#111827`.
- Helper text: `12px`, medium, `#667085`.

## Chips And Tags

- Unit chip: light gray `#eef2f3`, teal text `#006c5b`.
- Chip height: `28px`.
- Chip radius: full pill.
- Close icon: small `12px`, teal.

## Reference Range

- Section label: uppercase, `11px`, bold, letter-spaced, `#667085`.
- Container background: `#f8fafb`.
- Container border: `1px solid #dfe5ec`.
- Container radius: `14px`.
- Container padding: `12px` mobile, `16px` desktop.
- Individual rows: white card background, border `#e4e9ef`, radius `12px`, padding `12px`.
- Preview text: `12px`, medium, muted gray `#667085`.

## Row And Grid Spacing

- Reference rows stack with `12px` vertical spacing.
- Desktop reference row fits across a single row where possible.
- Tablet rows wrap to 2-3 columns.
- Mobile rows use two columns when possible, with controls wrapping cleanly.

## Footer

- Footer is bottom-right aligned.
- Padding: `16px 20px` mobile, `16px 28px` desktop.
- Divider above footer: `1px solid #e5e9ef`.
- Footer background: white.
- On very small screens, buttons may wrap but must remain tappable and visible.

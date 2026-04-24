# LIMS Design System Notes

These styles document the Create New Test Figma reference so future LIMS pages can be built even when Figma MCP access is unavailable.

## Page Shell

- Page background: `#f4f5f7`.
- Main content fills available app-shell width with responsive horizontal padding.
- Use a fluid content column, not a fixed desktop-only width. Current max-width target: `1680px`.
- Stack major sections vertically with `16px` gaps.

## Cards

- Card background: `#ffffff`.
- Border: `1px solid #dfe5ec`.
- Radius: `8px`.
- Shadow: very subtle `0 1px 2px rgba(16, 24, 40, 0.03)`.
- Header height: about `58px`, with `16px-20px` horizontal padding.
- Header border: `1px solid #e5e9ef`.
- Body padding: `16px` on small screens and `20px` on desktop.

## Section Headers

- Header title: `15px`, semibold, `#111827`, compact line-height.
- Icon boxes are `36px x 36px`, radius `7px`.
- Icon size is about `18px`.
- Icon tones:
  - Blue: background `#eaf1ff`, icon `#2f6fed`.
  - Orange: background `#fff0e6`, icon `#d86b20`.
  - Teal: background `#e1f3ef`, icon `#006c5b`.
  - Purple: background `#f3e8ff`, icon `#7c3aed`.

## Form Labels

- Label size: `12px`.
- Label weight: semibold.
- Label color: `#344054`.
- Label spacing below: `6px`.
- Required asterisk: `#ff5a5f`, placed immediately after label text.

## Inputs And Selects

- Height: `38px`.
- Radius: `6px`.
- Border: `#dfe5ec`.
- Background: white.
- Text: `13px`, medium, `#111827`.
- Placeholder: `#98a2b3`.
- Focus: teal border `#006c5b` plus subtle teal ring.
- Select chevron: right aligned, muted `#667085`.

## Buttons

- Primary action: dark teal `#006c5b`, white text, `38px` high, `6px` radius.
- Primary hover: `#00594c`.
- Cancel action: white background, `#dfe5ec` border, muted text `#667085`.
- Small ghost add buttons: soft teal `#e1f3ef`, text `#006c5b`, `30px` high, `5px` radius.
- Parameter button: black `#111827`, white text, `34px` high.

## Tables

- Table should sit directly inside the card body with horizontal scrolling on narrow screens.
- Minimum table width for this page: about `760px`.
- Header row height: `42px`.
- Header background: `#f7f8fa`.
- Header text: `11px`, uppercase, semibold, `#667085`.
- Body row height: `54px`.
- Row borders: `#e8edf2`.
- Body text: `13px`, `#111827`.
- Action buttons remain compact: `30px` high.

## Spacing

- Page title row: compact `40px` minimum height.
- Back icon button: `36px x 36px`.
- Form grid gap: `16px`.
- Add-button row margin-top: `16px`.
- Footer action row padding: `12px 16px`.

## Responsive Rules

- Desktop: cards are stacked; Test Details uses a three-column grid; Pricing uses a four-column grid.
- Tablet: form grids collapse to two columns.
- Mobile: form grids become one column; footer buttons stack without overflow.
- Tables must use horizontal scrolling instead of shrinking columns until labels or buttons overlap.

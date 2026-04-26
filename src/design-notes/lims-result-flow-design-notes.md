# LIMS Result Flow Design Notes

Figma MCP was unavailable during implementation, so these notes capture the provided page-366 prompt and the existing app tokens used in code.

- Page background: warm off-white `bg-background`; publish preview interior uses a light grey/beige band `#f5f4f1`.
- Card styling: white cards, subtle beige/grey borders, no heavy shadows, primary radius around `12px-15px`.
- Borders: entry form uses `#ece7dc` outer borders and `#e2e0d8` field borders; report preview uses `#ded9cf` and `#e5e1d8`.
- Typography: existing Plus Jakarta Sans app font; compact bold titles, small muted helper text, uppercase table headers with positive letter spacing.
- Buttons: primary actions use `bg-primary` with white text; preview/report action uses dark foreground fill; cancel is white outline; return is soft red.
- Inputs: compact `38px-40px` controls with rounded `8px-9px` borders and muted unit dropdown blocks.
- Result rows: numbered badges on the left, bold parameter names, muted units/reference ranges, right-aligned values or inputs.
- Report table: bordered, horizontally scrollable on small screens, light beige header, generous row padding, bold result values.
- Badge/status styles: reuse `StatusPill` tones for order/test states; green for approved/published, warning for in-progress/current work.
- Patient card/header: circular initials/avatar, patient name bold, patient ID as a small pill, age/gender muted.
- Timeline: keep existing store-driven timeline with done/current/todo states derived from order status.
- Digital signature: small horizontal violet-accent block with outlined icon square, title, and doctor name.
- Result report layout: printable white report card inside a muted preview surface, boxed subsections, right-aligned signature footer.

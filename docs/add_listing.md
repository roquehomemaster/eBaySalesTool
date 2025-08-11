Add Listing workflow

Overview
- Users can add a new eBay listing from the Listing Details header via the Add button.
- The list section is locked to the configured number of rows from appconfig (listings.page_size). The details pane stays fixed below.

Requirements covered
- Create-mode form with required fields marked by *: Title, Listing Price, Catalog Item.
- Default status is draft on save.
- After save, the newly created listing is auto-selected and its details are shown.
- Cancel exits create mode and restores the previous selection.
- List shows exactly X rows based on appconfig; scrolling only appears if more than X items.

How to use
1) Go to the Listings page.
2) Click Add in the Listing Details header.
3) Fill out Title, Listing Price, and choose a Catalog Item.
4) Click Save to create (status = draft) or Cancel to discard.
5) The new listing is selected automatically; details appear in the 4-column view.

Configuration
- Page size is managed by appconfig key listings.page_size (integer).
- Similar keys exist for other pages: catalog.page_size, sales.page_size.

Notes
- Currency and date values in details are formatted for readability.
- Optional fields (payment/shipping/etc.) are placeholders for future iterations.

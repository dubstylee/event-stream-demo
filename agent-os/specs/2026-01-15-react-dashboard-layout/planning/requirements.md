# Spec Requirements: React Dashboard Layout

## Initial Description
From the product roadmap:
"Build the main dashboard page with Vite and Tailwind CSS, including four topic widgets (message count + log) and the order entry form"

This is part of an event-stream demo project that:
- Uses Kafka for message streaming (4 topics)
- Has an Express API with Socket.io for real-time browser updates
- Needs a React frontend to display real-time Kafka topic activity

The dashboard should display:
1. Four topic widgets showing message counts and logs for each Kafka topic
2. An order entry form to create new orders

## Requirements Discussion

### First Round Questions

**Q1:** What layout do you prefer for the four topic widgets - grid (2x2), single column, or horizontal row?
**Answer:** Single column on the RIGHT half of the screen for the four topic widgets. The LEFT side will be used for other widgets (like the order entry form and future widgets from other specs).

**Q2:** For the message log in each widget, how many recent messages should be shown? Should there be a "clear log" button?
**Answer:** 5-10 most recent messages with auto-scroll is good. No clear log button needed.

**Q3:** What fields should the order entry form include beyond the basics?
**Answer:** Order ID (user-entered) and Product Count (user-entered).

**Q4:** For message count, should it be a running total since page load, or should it reset on some condition?
**Answer:** Running total since page load (resets on refresh) is fine.

**Q5:** Should the Socket.io connection be established automatically on page load, or should there be a manual connect/disconnect control?
**Answer:** Auto-connect on page load with connection status indicator - confirmed.

**Q6:** For state management, is local component state with useState/useEffect sufficient, or do you need a more robust solution?
**Answer:** Local component state with useState/useEffect is sufficient.

**Q7:** Is routing needed, or is this a single-page dashboard?
**Answer:** Single-page dashboard, no React Router needed.

**Q8:** What should be explicitly excluded from this spec?
**Answer:** The order form submission to Kafka API is deferred to the "Order Creation Flow" spec. This spec focuses on the UI/layout only - the form will be present but non-functional.

### Existing Code to Reference

No similar existing features identified for reference.

### Follow-up Questions

No follow-up questions were needed.

## Visual Assets

### Files Provided:
No visual assets provided.

### Visual Insights:
Not applicable.

## Requirements Summary

### Functional Requirements
- Two-column dashboard layout: left side for order form and future widgets, right side for topic widgets
- Four Kafka topic widgets displayed in a single column on the right half of the screen
- Each topic widget displays:
  - Message count (running total since page load)
  - Message log showing 5-10 most recent messages with auto-scroll
- Order entry form with two fields:
  - Order ID (user-entered text input)
  - Product Count (user-entered number input)
- Form is present but non-functional (submission deferred to Order Creation Flow spec)
- Socket.io auto-connection on page load
- Connection status indicator showing WebSocket connection state
- Real-time updates when messages arrive via Socket.io

### Reusability Opportunities
- No existing code patterns identified for reference
- This will establish patterns for future widget development

### Scope Boundaries
**In Scope:**
- Dashboard page layout (two-column: left for forms/actions, right for topic widgets)
- Four topic widget components with message count and log display
- Order entry form UI (fields only, no submission logic)
- Socket.io connection management with status indicator
- Local state management with useState/useEffect
- Tailwind CSS styling
- Vite as build tool

**Out of Scope:**
- Order form submission to Kafka API (deferred to "Order Creation Flow" spec)
- React Router / multi-page navigation
- Global state management (Redux, Zustand, etc.)
- Clear log functionality
- Manual connect/disconnect controls for Socket.io
- Products needing review list (separate spec)
- Product approval workflow (separate spec)

### Technical Considerations
- Built with Vite and React
- Styled with Tailwind CSS
- Socket.io client for WebSocket connection to Express API
- Local component state with useState/useEffect hooks
- Four Kafka topics to display: order-created, product-needs-review, product-matched, import-requested
- Message count resets on page refresh (no persistence needed)
- Auto-scroll behavior for message logs
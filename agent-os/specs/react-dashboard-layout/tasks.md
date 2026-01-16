# Task Breakdown: React Dashboard Layout

## Overview
Total Tasks: 16

This spec implements a React dashboard with Vite and Tailwind CSS featuring a two-column layout with an order entry form on the left and four Kafka topic widgets on the right. The dashboard connects to the existing Express/Socket.io server on port 4000 to receive real-time Kafka messages.

**Note:** Unit tests are explicitly out of scope for this spec per the requirements. The focus is on UI implementation only.

## Task List

### Project Setup

#### Task Group 1: Vite + React + Tailwind Configuration
**Dependencies:** None

- [ ] 1.0 Complete Vite project setup with Tailwind CSS
  - [ ] 1.1 Initialize Vite React project
    - Create project in `/Users/brian/event-stream-demo/client` directory
    - Use Vite with React template
    - Configure for JavaScript (not TypeScript per existing project patterns)
  - [ ] 1.2 Install and configure Tailwind CSS with PostCSS
    - Install tailwindcss, postcss, autoprefixer
    - Create tailwind.config.js with content paths
    - Create postcss.config.js
    - Add Tailwind directives to main CSS file
  - [ ] 1.3 Install socket.io-client dependency
    - Add socket.io-client to package.json
  - [ ] 1.4 Configure development server
    - Set dev server port (e.g., 5173 or 3000)
    - Verify CORS compatibility with Express server on port 4000
  - [ ] 1.5 Verify project runs successfully
    - Run `npm run dev` or `bun dev`
    - Confirm Tailwind styles are applied
    - Confirm no console errors

**Acceptance Criteria:**
- Vite dev server starts without errors
- Tailwind CSS classes are applied correctly
- socket.io-client is available for import
- Project structure follows React conventions

### Socket.io Integration

#### Task Group 2: Socket.io Connection Management
**Dependencies:** Task Group 1

- [ ] 2.0 Complete Socket.io connection layer
  - [ ] 2.1 Create useSocket custom hook
    - Location: `src/hooks/useSocket.js`
    - Auto-connect to localhost:4000 on mount
    - Manage connection state: connecting, connected, disconnected, error
    - Clean up connection on unmount
    - Return connection status and socket instance
  - [ ] 2.2 Create useKafkaMessages custom hook
    - Location: `src/hooks/useKafkaMessages.js`
    - Accept socket instance as parameter
    - Listen for `kafka:message` events
    - Maintain separate message arrays for each of the four topics
    - Track message counts per topic
    - Limit stored messages to 10 per topic (newest at end)
  - [ ] 2.3 Verify Socket.io connection works
    - Start Express server on port 4000
    - Start Vite dev server
    - Confirm connection established in browser console
    - Confirm `kafka:message` events are received (if Kafka is running)

**Acceptance Criteria:**
- Socket.io connects automatically on page load
- Connection status accurately reflects current state
- Messages are correctly routed to topic-specific arrays
- Connection cleans up on component unmount

### UI Components

#### Task Group 3: Connection Status Indicator
**Dependencies:** Task Group 2

- [ ] 3.0 Complete ConnectionStatus component
  - [ ] 3.1 Create ConnectionStatus component
    - Location: `src/components/ConnectionStatus.jsx`
    - Accept connectionStatus prop (connecting, connected, disconnected, error)
    - Display color-coded indicator:
      - Green for connected
      - Yellow for connecting
      - Red for disconnected/error
    - Show status text alongside indicator
  - [ ] 3.2 Style with Tailwind CSS
    - Use Tailwind utility classes for colors and layout
    - Ensure sufficient color contrast (4.5:1 minimum)
    - Make indicator visually prominent

**Acceptance Criteria:**
- Indicator displays correct color for each connection state
- Status text is readable and informative
- Component is visually consistent with dashboard design

#### Task Group 4: Topic Widget Component
**Dependencies:** Task Group 2

- [ ] 4.0 Complete TopicWidget component
  - [ ] 4.1 Create TopicWidget component structure
    - Location: `src/components/TopicWidget.jsx`
    - Accept props: topicName, messageCount, messages
    - Display topic name as header
    - Display running message count
    - Display message log area
  - [ ] 4.2 Implement message log display
    - Show messages in chronological order (newest at bottom)
    - Each entry displays: timestamp and message content
    - Use monospace font for message content readability
    - Fixed height container with overflow-y-auto
  - [ ] 4.3 Implement auto-scroll behavior
    - Use useEffect to scroll to bottom when new messages arrive
    - Use useRef for scrollable container reference
  - [ ] 4.4 Style with Tailwind CSS
    - Card-style container with subtle border or shadow
    - Clear visual boundaries between widgets
    - Consistent spacing and typography
    - Adequate whitespace

**Acceptance Criteria:**
- Topic name displays as header
- Message count updates in real-time
- Messages display with timestamp and content
- Auto-scroll works when new messages arrive
- Scrollable area allows viewing older messages

#### Task Group 5: Order Entry Form
**Dependencies:** Task Group 1

- [ ] 5.0 Complete OrderEntryForm component
  - [ ] 5.1 Create OrderEntryForm component structure
    - Location: `src/components/OrderEntryForm.jsx`
    - Two input fields: Order ID (text), Product Count (number)
    - Submit button (non-functional per spec)
    - Use semantic HTML with form element
  - [ ] 5.2 Add form labels and accessibility
    - Associate labels with inputs using htmlFor
    - Add appropriate input types and attributes
    - Ensure keyboard navigation works
  - [ ] 5.3 Implement form event handling
    - Prevent default form submission (preventDefault)
    - Manage local state for input values with useState
  - [ ] 5.4 Style with Tailwind CSS
    - Consistent input sizing and spacing
    - Clear visual hierarchy
    - Button styling (can appear disabled or inactive since non-functional)

**Acceptance Criteria:**
- Form displays Order ID and Product Count fields
- Labels are properly associated with inputs
- Form submission does not cause page reload
- Styling is consistent with dashboard design

### Dashboard Layout

#### Task Group 6: Dashboard Page Layout
**Dependencies:** Task Groups 3, 4, 5

- [ ] 6.0 Complete Dashboard layout and integration
  - [ ] 6.1 Create Dashboard component
    - Location: `src/components/Dashboard.jsx`
    - Integrate useSocket and useKafkaMessages hooks
    - Pass connection status to ConnectionStatus component
    - Pass topic data to four TopicWidget instances
    - Include OrderEntryForm in left column
  - [ ] 6.2 Implement two-column layout
    - Left column: ~40% width for order form
    - Right column: ~60% width for topic widgets
    - Use Tailwind CSS flexbox or grid utilities
    - Four topic widgets stacked vertically in right column
  - [ ] 6.3 Implement responsive design
    - Mobile-first approach
    - Stack columns vertically on smaller screens (below 768px)
    - Side-by-side layout on desktop (768px and above)
  - [ ] 6.4 Add semantic HTML structure
    - Use main element wrapping dashboard content
    - Use appropriate heading levels (h1-h6) in logical order
    - Ensure logical tab order for accessibility
  - [ ] 6.5 Position ConnectionStatus indicator
    - Place in header or prominent location
    - Ensure visibility at all times
  - [ ] 6.6 Update App.jsx to render Dashboard
    - Import and render Dashboard component
    - Remove default Vite boilerplate content

**Acceptance Criteria:**
- Two-column layout displays correctly on desktop
- Columns stack on mobile screens
- All four topic widgets display (order-created, product-needs-review, product-matched, import-requested)
- Order form displays in left column
- Connection status is visible at all times
- Dashboard uses semantic HTML

### Final Verification

#### Task Group 7: Integration Verification
**Dependencies:** Task Group 6

- [ ] 7.0 Complete end-to-end verification
  - [ ] 7.1 Verify full dashboard functionality
    - Start Express server on port 4000
    - Start Vite dev server
    - Confirm Socket.io connection indicator shows "Connected"
    - Confirm four topic widgets display with zero message counts
  - [ ] 7.2 Verify real-time message display (if Kafka available)
    - Send test messages to Kafka topics
    - Confirm messages appear in correct widgets
    - Confirm message counts increment
    - Confirm auto-scroll works
  - [ ] 7.3 Verify responsive layout
    - Test at mobile width (320px - 767px)
    - Test at tablet width (768px - 1023px)
    - Test at desktop width (1024px+)
    - Confirm layout adapts appropriately
  - [ ] 7.4 Verify accessibility basics
    - Confirm keyboard navigation works
    - Confirm form labels are associated
    - Confirm color contrast is sufficient
    - Confirm semantic HTML is in place

**Acceptance Criteria:**
- Dashboard connects to Socket.io server successfully
- Real-time messages display in correct topic widgets
- Layout is responsive across screen sizes
- Basic accessibility requirements are met
- No console errors during normal operation

## Execution Order

Recommended implementation sequence:

1. **Project Setup (Task Group 1)** - Foundation for all other work
2. **Socket.io Integration (Task Group 2)** - Core real-time data layer
3. **Connection Status (Task Group 3)** - Simple component, depends on socket
4. **Topic Widget (Task Group 4)** - Core display component
5. **Order Entry Form (Task Group 5)** - Can be done in parallel with Task Groups 3-4
6. **Dashboard Layout (Task Group 6)** - Integrates all components
7. **Integration Verification (Task Group 7)** - Final validation

## File Structure

```
client/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── index.css
│   ├── components/
│   │   ├── Dashboard.jsx
│   │   ├── ConnectionStatus.jsx
│   │   ├── TopicWidget.jsx
│   │   └── OrderEntryForm.jsx
│   └── hooks/
│       ├── useSocket.js
│       └── useKafkaMessages.js
```

## Technical Notes

- Express server is already running on port 4000 with Socket.io configured
- Socket.io emits `kafka:message` events with payload: `{ topic, message, partition, offset, timestamp }`
- Four valid topics: `order-created`, `product-needs-review`, `product-matched`, `import-requested`
- Clients are auto-joined to all topic rooms on connection (no manual subscription needed)
- CORS is configured to allow localhost origins
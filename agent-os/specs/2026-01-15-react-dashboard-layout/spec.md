# Specification: React Dashboard Layout

## Goal
Build the main dashboard page using Vite and React with Tailwind CSS, featuring a two-column layout with an order entry form on the left and four Kafka topic widgets on the right that display real-time message counts and logs via Socket.io.

## User Stories
- As a user, I want to see real-time Kafka message activity across all four topics so that I can monitor the event stream system at a glance
- As a user, I want to see the Socket.io connection status so that I know whether I am receiving live updates

## Specific Requirements

**Two-Column Dashboard Layout**
- Left column for order form and future widgets (approximately 40% width)
- Right column for four topic widgets stacked vertically (approximately 60% width)
- Use Tailwind CSS flexbox or grid utilities for layout
- Mobile-first approach: stack columns vertically on smaller screens, side-by-side on desktop
- Use semantic HTML with main element wrapping the dashboard content

**Topic Widget Component**
- Create a reusable TopicWidget component that accepts topic name as a prop
- Display the topic name as a header within each widget
- Show running message count (increments with each received message, resets on page refresh)
- Display message log area showing 5-10 most recent messages
- Auto-scroll to bottom when new messages arrive
- Style consistently using Tailwind CSS with clear visual boundaries between widgets

**Message Log Display**
- Show messages in chronological order (newest at bottom)
- Each message entry should display: timestamp and message content
- Limit visible messages to 10; older messages scroll out of view
- Use monospace or code-style font for message content readability
- Implement overflow-y-auto with fixed height container for scrollable area

**Order Entry Form**
- Two input fields: Order ID (text input) and Product Count (number input)
- Include a Submit button (non-functional in this spec)
- Form fields should have appropriate labels for accessibility
- Use Tailwind form styling with consistent spacing and input sizing
- Disable form submission (preventDefault) to avoid page reload

**Socket.io Connection Management**
- Auto-connect to Socket.io server at localhost:4000 on component mount
- Implement connection status state: connecting, connected, disconnected, error
- Clean up Socket.io connection on component unmount
- Listen for kafka:message events and route to appropriate topic widget
- Handle reconnection attempts automatically (Socket.io default behavior)

**Connection Status Indicator**
- Display visual indicator showing current connection state
- Use color coding: green for connected, yellow for connecting, red for disconnected/error
- Position in header or prominent location visible at all times
- Show brief status text alongside the indicator (e.g., "Connected", "Reconnecting...")

**State Management Architecture**
- Use useState for: connection status, message counts per topic, message logs per topic
- Use useEffect for: Socket.io connection lifecycle, auto-scroll behavior
- Store messages as array of objects with topic, message, and timestamp fields
- Maintain separate message arrays for each of the four topics

**Vite Project Setup**
- Initialize React project with Vite if not already present
- Configure Tailwind CSS with PostCSS
- Install socket.io-client dependency
- Configure development server proxy or CORS for API communication

## Visual Design
No visual mockups provided. Follow these design guidelines:
- Clean, minimal interface with adequate whitespace
- Card-style containers for topic widgets with subtle borders or shadows
- Consistent color palette using Tailwind defaults
- Readable typography with sufficient contrast ratios (4.5:1 minimum)

## Existing Code to Leverage

**Express API Server (`/Users/brian/event-stream-demo/src/app.js`)**
- Server runs on port 4000 (from config.json)
- Socket.io emits kafka:message events with payload: { topic, message, partition, offset, timestamp }
- Clients auto-join all topic rooms on connection
- CORS configured to allow localhost origins
- Four valid topics defined: order-created, product-needs-review, product-matched, import-requested

**Server Configuration (`/Users/brian/event-stream-demo/src/server/config.json`)**
- Port 4000 is the server port to connect Socket.io client
- CORS credentials set to false

**Kafka Message Event Structure**
- Events emitted as kafka:message with payload containing topic, message object, partition, offset, and server timestamp
- Subscribe/unsubscribe events available but not needed (auto-join handles subscription)

## Out of Scope
- Order form submission logic and API integration (deferred to "Order Creation Flow" spec)
- React Router or multi-page navigation
- Global state management libraries (Redux, Zustand, Context API)
- Clear log button or manual log management
- Manual Socket.io connect/disconnect controls
- Products needing review list display
- Product approval workflow
- Message persistence or history beyond current session
- Unit tests for components (follow minimal testing standard)
- Authentication or user sessions
# Event Stream Dashboard - Frontend

Real-time React dashboard for visualizing Kafka event streams with WebSocket-powered live updates.

## Overview

The frontend provides an interactive interface for:
- Creating orders and triggering Kafka events
- Reviewing and approving products requiring manual review
- Monitoring real-time message flows across four Kafka topics
- Tracking WebSocket connection status

## Tech Stack

- **Framework:** React 19
- **Build Tool:** Vite 7
- **Styling:** Tailwind CSS 4
- **Real-time Communication:** Socket.io Client
- **Testing:** Vitest (via parent project)

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) v1.3.4 or later
- Backend server running on `http://localhost:3000`
- Kafka infrastructure running (via Docker Compose)

### Installation

```bash
bun install
```

### Development

Start the development server with hot module replacement:

```bash
bun run dev
```

The app will be available at `http://localhost:5173` (default Vite port).

### Build

Create a production build:

```bash
bun run build
```

Output will be in the `dist/` directory.

### Preview Production Build

```bash
bun run preview
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `bun run dev` | Start development server with HMR |
| `bun run build` | Build for production |
| `bun run preview` | Preview production build locally |
| `bun run lint` | Run ESLint for code quality checks |

## Project Structure

```
client/
├── src/
│   ├── App.jsx                   # Root component with ToastProvider
│   ├── main.jsx                  # React entry point
│   ├── index.css                 # Global styles + Tailwind imports
│   ├── components/
│   │   ├── Dashboard.jsx         # Main layout with two-column grid
│   │   ├── ConnectionStatus.jsx  # WebSocket connection indicator
│   │   ├── OrderEntryForm.jsx    # Order creation form
│   │   ├── ProductsNeedingReview.jsx  # Product approval queue
│   │   ├── TopicWidget.jsx       # Individual topic message display
│   │   ├── Toast.jsx             # Toast notification component
│   │   └── ToastContainer.jsx    # Toast management context
│   └── hooks/
│       ├── useSocket.js          # WebSocket connection management
│       └── useKafkaMessages.js   # Kafka message state management
├── public/
├── index.html
├── vite.config.js
├── tailwind.config.js
└── package.json
```

## Architecture

### Component Hierarchy

```
App (ToastProvider)
└── Dashboard
    ├── Header
    │   ├── Title
    │   └── ConnectionStatus
    └── Main Layout (2-column responsive grid)
        ├── Left Column (Order Entry)
        │   ├── OrderEntryForm
        │   └── ProductsNeedingReview
        └── Right Column (Topic Widgets)
            ├── TopicWidget (order-created)
            ├── TopicWidget (product-needs-review)
            ├── TopicWidget (product-matched)
            └── TopicWidget (import-requested)
```

### Custom Hooks

#### `useSocket()`

Manages WebSocket connection lifecycle:

```javascript
const { connectionStatus, socket } = useSocket();
```

- **connectionStatus:** One of `"connecting"`, `"connected"`, `"disconnected"`
- **socket:** Socket.io client instance

Features:
- Auto-connects to backend on mount
- Auto-subscribes to all four Kafka topics
- Handles reconnection logic
- Cleans up on unmount

#### `useKafkaMessages(socket)`

Manages Kafka message state for all topics:

```javascript
const topicState = useKafkaMessages(socket);
// topicState = {
//   "order-created": { count: 5, messages: [...] },
//   "product-needs-review": { count: 2, messages: [...] },
//   ...
// }
```

Features:
- Listens for `kafka:message` events from WebSocket
- Maintains last 10 messages per topic
- Provides message count per topic
- Updates in real-time as events arrive

## Key Components

### Dashboard

Main application layout with responsive two-column grid:
- **Left:** Order entry form + products needing review
- **Right:** Four stacked topic widgets
- **Header:** Title + connection status

### OrderEntryForm

Form for creating orders:
- Input: Order ID (text)
- Input: Product Count (number)
- Validation: Both fields required, product count > 0
- Action: POSTs to `/api/kafka/produce` endpoint
- Feedback: Toast notifications for success/error

### ProductsNeedingReview

Interactive queue showing products awaiting approval:
- Displays products from `product-needs-review` messages
- "Approve" button triggers `product-matched` event
- Shows empty state when no products need review
- Tracks order ID and product ID for each item

### TopicWidget

Displays real-time messages for a single Kafka topic:
- Shows message count badge
- Displays last 10 messages (newest first)
- Color-coded by topic:
  - `order-created`: Blue
  - `product-needs-review`: Yellow
  - `product-matched`: Green
  - `import-requested`: Purple
- Pretty-printed JSON message display

### ConnectionStatus

Visual indicator of WebSocket connection state:
- 🟢 Green: Connected
- 🟡 Yellow: Connecting
- 🔴 Red: Disconnected

### Toast System

Global notification system for user feedback:
- Success notifications (green)
- Error notifications (red)
- Auto-dismiss after 5 seconds
- Manual dismiss via close button
- Accessible with ARIA labels

## Styling

### Tailwind CSS

The project uses Tailwind CSS 4 for styling with:
- Utility-first CSS approach
- Responsive design with mobile-first breakpoints
- Custom color palette for topic widgets
- Consistent spacing and typography

### Responsive Design

- **Mobile (< 768px):** Single column, stacked layout
- **Desktop (≥ 768px):** Two-column grid layout
- Header remains sticky on scroll
- Components adapt fluidly to screen size

## API Integration

### WebSocket Events

The frontend listens for these events:

```javascript
// Incoming messages
socket.on('kafka:message', (payload) => {
  // payload: { topic, message, partition, offset, timestamp }
});

// Connection events
socket.on('connect', () => { /* ... */ });
socket.on('disconnect', () => { /* ... */ });
```

### HTTP Endpoints

The frontend calls these backend endpoints:

**POST `/api/kafka/produce`** - Send Kafka messages
```javascript
await fetch('http://localhost:3000/api/kafka/produce', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    topic: 'order-created',
    message: { orderId: 'ORD-123', productCount: 5 }
  })
});
```

## Development Guidelines

### Adding New Components

1. Create component file in `src/components/`
2. Follow existing patterns (props destructuring, JSDoc comments)
3. Use Tailwind utility classes for styling
4. Add accessibility attributes (ARIA labels, semantic HTML)
5. Export as default export

### State Management

- Local state: `useState` for component-specific state
- Shared state: Context API (see `ToastContainer`)
- Server state: Custom hooks (`useSocket`, `useKafkaMessages`)

### Code Style

- Use functional components with hooks
- Destructure props at function signature
- Include JSDoc comments for components
- Use semantic HTML elements (`<main>`, `<section>`, `<header>`)
- Follow accessibility best practices

## Testing

Tests are located in `src/components/__tests__/`:

```bash
# Run all frontend tests (from project root)
bun test client/

# Run specific test
bun test client/src/components/__tests__/Dashboard.test.jsx
```

Test utilities:
- **Framework:** Vitest
- **Testing Library:** @testing-library/react (if configured)

## Troubleshooting

### WebSocket Won't Connect

1. Verify backend is running: `curl http://localhost:3000/api/health`
2. Check browser console for errors
3. Ensure CORS is configured in backend
4. Check `useSocket.js` for correct URL

### Messages Not Appearing

1. Verify WebSocket connection status (should be green)
2. Check browser console for `kafka:message` events
3. Verify Kafka topics exist: `docker compose exec kafka kafka-topics --list --bootstrap-server localhost:9092`
4. Check backend logs for consumer errors

### Styling Issues

1. Verify Tailwind is processing: check for `@tailwind` directives in `index.css`
2. Rebuild if styles are missing: `bun run build`
3. Clear browser cache

## Configuration

### Vite Configuration

Edit `vite.config.js` to customize:
- Dev server port
- Build output directory
- Proxy settings
- Plugin configuration

### Tailwind Configuration

Edit `tailwind.config.js` to customize:
- Color palette
- Typography scale
- Breakpoints
- Custom utilities

## Performance Considerations

- **Message Limiting:** Only last 10 messages per topic retained
- **React Optimization:** Use React 19's automatic batching
- **WebSocket Efficiency:** Auto-reconnection with exponential backoff
- **Responsive Images:** No images currently used, but use `srcset` if added

## Accessibility

The dashboard follows WCAG 2.1 Level AA guidelines:
- Semantic HTML structure
- ARIA labels for interactive elements
- Keyboard navigation support
- Color contrast ratios meet standards
- Screen reader friendly

## Learn More

- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vite.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Socket.io Client Documentation](https://socket.io/docs/v4/client-api/)

---

**Built with React + Vite + Bun** ⚛️

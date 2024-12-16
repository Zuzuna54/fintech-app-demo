# Fintech ACH Application Frontend

A modern React application built with Next.js 14 for managing banking operations and ACH payments.

## Quick Start

1. **Prerequisites**

   - Node.js 18+
   - npm 9+

2. **Installation**

   ```bash
   # Clone repository
   git clone <repository-url>
   cd fintech-ach-app/frontend

   # Install dependencies
   npm install

   # Setup environment
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

3. **Development**

   ```bash
   # Start development server
   npm run dev

   # Build for production
   npm run build

   # Start production server
   npm start
   ```

## Features

- 🔐 Role-based access control
- 🏢 Multi-tenant organization management
- 🏦 Bank account management
- 💸 Payment processing
- 📱 Responsive design
- 🌓 Dark/light mode
- ⚡ Real-time updates

## Tech Stack

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State**: React Context + SWR
- **Testing**: Jest + React Testing Library + Playwright

## Testing

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:coverage
```

## Documentation

For comprehensive documentation, including:

- System Architecture
- Component Structure
- State Management
- Authentication Flow
- And more...

Please see [DOCUMENTATION.md](./DOCUMENTATION.md)

## Development

- Development server: http://localhost:3000
- API documentation: http://localhost:3000/api-docs
- Test coverage: http://localhost:3000/coverage

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

[MIT License](LICENSE)

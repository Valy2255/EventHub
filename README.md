# EventHub

A comprehensive event management platform that allows users to discover, book, and manage events. EventHub provides a seamless experience for both event organizers and attendees with features like ticket booking, payment processing, real-time chat, and admin management.

## Features

### Core Event Management
- **Event Discovery**: Advanced search and filtering by category, location, date, price range, and keywords
- **Event Creation**: Full event management with gallery images, multiple ticket types, and pricing tiers
- **Event Editing**: Comprehensive event modification with automatic notification system
- **Event Cancellation**: Automated cancellation with refund processing and email notifications
- **Event Rescheduling**: Event date/time updates with automatic attendee notifications
- **Featured Events**: Promotional event highlighting system
- **Event Reviews**: Rating and review system with moderation capabilities
- **Event Analytics**: Detailed attendance and performance tracking
- **Geocoding Integration**: Automatic location mapping and address validation
- **Related Events**: Smart event recommendation system

### Advanced Ticketing System
- **Multiple Ticket Types**: Support for various ticket categories with different pricing
- **Dynamic Pricing**: Flexible pricing models with discounts and promotions
- **QR Code Generation**: Automatic QR code generation for digital tickets
- **Ticket Validation**: QR code scanning for event check-ins
- **Ticket Exchange**: Peer-to-peer ticket transfer with price difference handling
- **Ticket Refunds**: Automated refund processing with configurable policies
- **Ticket History**: Complete purchase and usage tracking
- **Digital Delivery**: Email-based ticket delivery with PDF attachments
- **Bulk Ticket Operations**: Group ticket purchases and management

### Sophisticated Payment Processing
- **Multiple Payment Methods**: Credit cards, debit cards, and saved payment methods
- **Secure Card Storage**: PCI-compliant saved payment method management
- **Payment History**: Comprehensive transaction tracking and receipts
- **Refund Automation**: Intelligent refund processing with status tracking
- **Credit System**: User credit balance management and redemption
- **Payment Analytics**: Revenue tracking and payment method statistics
- **Failed Payment Recovery**: Automatic retry mechanisms for failed transactions
- **Currency Support**: Multi-currency payment processing

### User Experience Features
- **Social Authentication**: Google and Facebook OAuth integration
- **User Profiles**: Comprehensive profile management with preferences
- **Purchase History**: Detailed transaction and ticket history
- **Wishlist System**: Save and track favorite events
- **Real-time Chat**: Customer support chat with admin responses
- **Email Notifications**: Automated emails for bookings, cancellations, and updates
- **Mobile Responsive**: Full mobile optimization and PWA capabilities
- **Accessibility**: WCAG compliant design and navigation

### Administrative Dashboard
- **User Management**: Complete user account administration and moderation
- **Analytics & Reports**: 
  - Revenue analytics with trends and forecasting
  - User engagement metrics and behavior analysis
  - Event performance statistics
  - Payment method usage statistics
  - Geographic user distribution
- **Content Management**: 
  - FAQ management with categorization
  - Legal document management (Terms, Privacy Policy)
  - Newsletter system with subscriber management
- **Financial Management**:
  - Refund request processing and approval
  - Payment dispute handling
  - Revenue tracking and reporting
- **Event Moderation**: Event approval, editing, and cancellation workflows
- **Category Management**: Dynamic category and subcategory organization

### Real-time Features
- **Live Chat Support**: Socket.io powered real-time customer support
- **Real-time Notifications**: Instant updates for bookings and event changes
- **Live Event Updates**: Real-time capacity and availability updates
- **Admin Notifications**: Instant alerts for new bookings and issues

### Security & Compliance
- **JWT Authentication**: Secure token-based authentication system
- **Role-based Access Control**: Admin, user, and guest permission levels
- **Data Encryption**: Secure storage of sensitive user and payment data
- **Session Management**: Secure session handling and timeout controls
- **Input Validation**: Comprehensive data validation and sanitization
- **Rate Limiting**: API rate limiting and abuse prevention

### Email & Communication
- **Automated Email System**: 
  - Booking confirmations with ticket attachments
  - Event reminder notifications
  - Cancellation and refund notifications
  - Password reset and account verification
- **Email Templates**: Professional, branded email templates
- **Newsletter System**: Subscriber management and email campaigns
- **Contact Forms**: Customer inquiry handling and routing

### Search & Discovery
- **Advanced Search**: Multi-criteria search with filters and sorting
- **Autocomplete**: Smart search suggestions and type-ahead
- **Search History**: User search tracking and recommendations
- **Recently Viewed**: Track and display recently viewed events
- **Location-based Search**: GPS and address-based event discovery

### Technical Features
- **Scheduled Tasks**: Automated cleanup, reminders, and maintenance
- **Logging & Monitoring**: Comprehensive error tracking and performance monitoring
- **Testing Suite**: Extensive unit, integration, and end-to-end testing
- **Database Optimization**: Indexed queries and performance optimization
- **Caching Layer**: Redis-based caching for improved performance
- **API Documentation**: Comprehensive REST API documentation
- **Backup Systems**: Automated database backups and recovery procedures

## 🛠 Tech Stack

### Backend
- **Runtime**: Node.js with ES6 modules
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Authentication**: 
  - JWT tokens
  - Passport.js with Google and Facebook OAuth
- **Real-time Communication**: Socket.io
- **Email Service**: Nodemailer
- **Testing**: Jest with Supertest
- **Other Tools**:
  - QR Code generation
  - Scheduled tasks with node-cron
  - Geocoding services
  - Payment processing

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite
- **Styling**: Tailwind CSS 4.0
- **UI Components**: Headless UI
- **Icons**: React Icons
- **Routing**: React Router DOM 7.2
- **HTTP Client**: Axios
- **Real-time**: Socket.io Client
- **Rich Text Editor**: CKEditor 5
- **QR Code Scanner**: html5-qrcode
- **Notifications**: React Toastify
- **Date Handling**: date-fns

## 📁 Project Structure

```
EventHub/
├── backend/
│   ├── config/
│   │   ├── config.js           # Environment configuration
│   │   ├── db.js               # Database connection
│   │   └── passport.js         # Passport authentication strategies
│   ├── controllers/
│   │   ├── adminController.js
│   │   ├── authController.js
│   │   ├── categoryController.js
│   │   ├── checkInController.js
│   │   ├── contactController.js
│   │   ├── creditController.js
│   │   ├── eventController.js
│   │   ├── faqController.js
│   │   ├── legalDocumentController.js
│   │   ├── newsletterController.js
│   │   ├── paymentController.js
│   │   ├── paymentMethodController.js
│   │   ├── purchaseController.js
│   │   ├── reviewController.js
│   │   ├── statisticsController.js
│   │   ├── subcategoryController.js
│   │   ├── ticketController.js
│   │   └── userController.js
│   ├── middleware/
│   │   ├── admin.js            # Admin authorization
│   │   ├── asyncHandler.js     # Async error handling
│   │   ├── auth.js             # Authentication middleware
│   │   └── errorHandler.js     # Global error handler
│   ├── models/
│   │   ├── Category.js
│   │   ├── CheckIn.js
│   │   ├── Event.js
│   │   ├── Faq.js
│   │   ├── LegalDocument.js
│   │   ├── Payment.js
│   │   ├── PaymentMethod.js
│   │   ├── Purchase.js
│   │   ├── Review.js
│   │   ├── SocialAccount.js
│   │   ├── Statistics.js
│   │   ├── Subcategory.js
│   │   ├── Ticket.js
│   │   ├── TicketType.js
│   │   └── User.js
│   ├── routes/
│   │   ├── admin/
│   │   │   └── adminRoutes.js   # Admin-specific routes
│   │   ├── auth.js
│   │   ├── categoryRoutes.js
│   │   ├── chatRoutes.js
│   │   ├── contactRoutes.js
│   │   ├── creditRoutes.js
│   │   ├── eventRoutes.js
│   │   ├── faqRoutes.js
│   │   ├── legalDocumentRoutes.js
│   │   ├── newsletterRoutes.js
│   │   ├── paymentMethodRoutes.js
│   │   ├── paymentRoutes.js
│   │   ├── purchaseRoutes.js
│   │   ├── searchRoutes.js
│   │   ├── statisticsRoutes.js
│   │   ├── ticketRoutes.js
│   │   └── userRoutes.js
│   ├── scripts/
│   │   ├── geocodeEvents.js     # Geocoding batch scripts
│   │   └── geocodeMaintenance.js
│   ├── services/
│   │   ├── AdminService.js
│   │   ├── AuthService.js
│   │   ├── BaseService.js       # Base service class
│   │   ├── CategoryService.js
│   │   ├── chatService.js
│   │   ├── CheckInService.js
│   │   ├── CreditService.js
│   │   ├── EventService.js
│   │   ├── FaqService.js
│   │   ├── geocodingService.js  # Location services
│   │   ├── LegalDocumentService.js
│   │   ├── PaymentMethodService.js
│   │   ├── PaymentService.js
│   │   ├── PurchaseService.js
│   │   ├── refundService.js
│   │   ├── ReviewService.js
│   │   ├── StatisticsService.js
│   │   ├── SubcategoryService.js
│   │   ├── TicketService.js
│   │   └── UserService.js
│   ├── socket/
│   │   └── socketHandlers.js    # Real-time event handlers
│   ├── tests/
│   │   ├── config/              # Configuration tests
│   │   │   ├── config.test.js
│   │   │   ├── db.test.js
│   │   │   └── passport.test.js
│   │   ├── controllers/         # Controller tests
│   │   │   ├── adminController.test.js
│   │   │   ├── authController.test.js
│   │   │   ├── categoryController.test.js
│   │   │   ├── checkInController.test.js
│   │   │   ├── creditController.test.js
│   │   │   ├── eventController.test.js
│   │   │   ├── faqController.test.js
│   │   │   ├── legalDocumentController.test.js
│   │   │   ├── paymentController.test.js
│   │   │   ├── paymentMethodController.test.js
│   │   │   ├── purchaseController.test.js
│   │   │   ├── reviewController.test.js
│   │   │   ├── statisticsController.test.js
│   │   │   ├── subcategoryController.test.js
│   │   │   ├── ticketController.test.js
│   │   │   └── userController.test.js
│   │   ├── middleware/          # Middleware tests
│   │   │   ├── admin.test.js
│   │   │   ├── asyncHandler.test.js
│   │   │   ├── auth.test.js
│   │   │   └── errorHandler.test.js
│   │   ├── models/              # Model tests
│   │   │   ├── Category.test.js
│   │   │   ├── CheckIn.test.js
│   │   │   ├── Event.test.js
│   │   │   ├── Faq.test.js
│   │   │   ├── LegalDocument.test.js
│   │   │   ├── Payment.test.js
│   │   │   ├── PaymentMethod.test.js
│   │   │   ├── Purchase.test.js
│   │   │   ├── Review.test.js
│   │   │   ├── SocialAccount.test.js
│   │   │   ├── Statistics.test.js
│   │   │   ├── Subcategory.test.js
│   │   │   ├── Ticket.test.js
│   │   │   ├── TicketType.test.js
│   │   │   └── User.test.js
│   │   ├── services/            # Service tests
│   │   │   ├── AdminService.test.js
│   │   │   ├── AuthService.test.js
│   │   │   ├── CategoryService.test.js
│   │   │   ├── CheckInService.test.js
│   │   │   ├── CreditService.test.js
│   │   │   ├── EventService.test.js
│   │   │   ├── FaqService.test.js
│   │   │   ├── LegalDocumentService.test.js
│   │   │   ├── PaymentMethodService.test.js
│   │   │   ├── PaymentService.test.js
│   │   │   ├── PurchaseService.test.js
│   │   │   ├── ReviewService.test.js
│   │   │   ├── StatisticsService.test.js
│   │   │   ├── SubcategoryService.test.js
│   │   │   ├── TicketService.test.js
│   │   │   └── UserService.test.js
│   │   └── utils/               # Utility tests
│   │       ├── emailService.test.js
│   │       ├── emailTemplates.test.js
│   │       ├── jwtGenerator.test.js
│   │       ├── scheduledTasks.test.js
│   │       └── sendEmail.test.js
│   ├── utils/
│   │   ├── emailService.js      # Email service configuration
│   │   ├── emailTemplates.js    # Email template definitions
│   │   ├── jwtGenerator.js      # JWT token utilities
│   │   ├── scheduledTasks.js    # Cron job definitions
│   │   └── sendEmail.js         # Email sending utilities
│   ├── coverage/                # Test coverage reports
│   ├── jest.config.cjs          # Jest testing configuration
│   ├── package.json
│   ├── server.js                # Main server entry point
│   └── .env                     # Environment variables
└── frontend/
    ├── public/
    │   └── ticket-logo.svg      # Application logo
    ├── src/
    │   ├── components/
    │   │   ├── auth/
    │   │   │   └── SocialAuthCallback.jsx
    │   │   ├── chat/
    │   │   │   └── ChatWidget.jsx
    │   │   ├── event/
    │   │   │   ├── EventGallery.jsx
    │   │   │   ├── EventListing.jsx
    │   │   │   ├── EventMap.jsx
    │   │   │   ├── EventReviews.jsx
    │   │   │   ├── RelatedEvents.jsx
    │   │   │   └── TicketSelector.jsx
    │   │   ├── layout/
    │   │   │   ├── AdminLayout.jsx
    │   │   │   ├── CategoryHeader.jsx
    │   │   │   ├── Footer.jsx
    │   │   │   ├── Header.jsx
    │   │   │   └── HeaderDropdown.jsx
    │   │   ├── newsletter/
    │   │   │   └── NewsletterSection.jsx
    │   │   ├── payment/
    │   │   │   └── CardPaymentForm.jsx
    │   │   ├── routing/
    │   │   │   ├── AdminRoute.jsx
    │   │   │   └── PrivateRoute.jsx
    │   │   ├── search/
    │   │   │   ├── DatePicker.jsx
    │   │   │   ├── RecentlyViewedEvents.jsx
    │   │   │   └── SearchFilter.jsx
    │   │   ├── ticket/
    │   │   │   └── TicketExchangeModal.jsx
    │   │   └── ui/
    │   │       ├── ErrorMessage.jsx
    │   │       └── LoadingSpinner.jsx
    │   ├── context/
    │   │   ├── AuthContext.jsx     # Authentication state
    │   │   ├── ChatContext.jsx     # Chat state management
    │   │   └── SocketContext.jsx   # Socket.io connection
    │   ├── hooks/
    │   │   ├── useAuth.js          # Authentication hook
    │   │   ├── useChat.js          # Chat functionality hook
    │   │   └── useSocket.js        # Socket connection hook
    │   ├── pages/
    │   │   ├── admin/              # Admin pages
    │   │   │   ├── AdminCategories.jsx
    │   │   │   ├── AdminChat.jsx
    │   │   │   ├── AdminDashboard.jsx
    │   │   │   ├── AdminEventForm.jsx
    │   │   │   ├── AdminEvents.jsx
    │   │   │   ├── AdminFAQForm.jsx
    │   │   │   ├── AdminFAQs.jsx
    │   │   │   ├── AdminLegalDocumentForm.jsx
    │   │   │   ├── AdminLegalDocuments.jsx
    │   │   │   ├── AdminRefunds.jsx
    │   │   │   ├── AdminSubcategories.jsx
    │   │   │   ├── AdminUsers.jsx
    │   │   │   └── TicketCheckIn.jsx
    │   │   ├── CategoryEvents.jsx
    │   │   ├── Checkout.jsx
    │   │   ├── ContactPage.jsx
    │   │   ├── CreditHistory.jsx
    │   │   ├── EventDetails.jsx
    │   │   ├── EventsPage.jsx
    │   │   ├── FAQPage.jsx
    │   │   ├── ForgotPassword.jsx
    │   │   ├── Home.jsx
    │   │   ├── Login.jsx
    │   │   ├── NotFound.jsx
    │   │   ├── PaymentMethods.jsx
    │   │   ├── PrivacyPage.jsx
    │   │   ├── PurchaseHistoryPage.jsx
    │   │   ├── PurchasePage.jsx
    │   │   ├── RefundPage.jsx
    │   │   ├── Register.jsx
    │   │   ├── ResetPassword.jsx
    │   │   ├── SearchResultsPage.jsx
    │   │   ├── SubcategoryEvents.jsx
    │   │   ├── TermsPage.jsx
    │   │   ├── TicketPage.jsx
    │   │   ├── UserProfile.jsx
    │   │   └── UserTickets.jsx
    │   ├── routes/
    │   │   └── AdminRoutes.jsx     # Admin route definitions
    │   ├── services/
    │   │   ├── api.js              # API service layer
    │   │   ├── newsletterService.js
    │   │   └── searchService.js
    │   ├── App.jsx                 # Main app component
    │   ├── main.jsx                # React entry point
    │   └── styles.css              # Global styles
    ├── eslint.config.js            # ESLint configuration
    ├── index.html                  # HTML template
    ├── package.json
    ├── vite.config.js              # Vite build configuration
    ├── .env                        # Frontend environment variables
    └── .gitignore
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd EventHub
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   ```

4. **Environment Variables**
   Create a `.env` file in the backend directory:
   ```env
   # Database
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=eventhub
   DB_USER=your_username
   DB_PASSWORD=your_password
   
   # JWT
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRES_IN=7d
   
   # OAuth
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   FACEBOOK_APP_ID=your_facebook_app_id
   FACEBOOK_APP_SECRET=your_facebook_app_secret
   
   # Email
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email
   EMAIL_PASS=your_password
   ```

### Running the Application

1. **Start the Backend**
   ```bash
   cd backend
   npm start          # Production
   npm run dev        # Development with nodemon
   ```

2. **Start the Frontend**
   ```bash
   cd frontend
   npm run dev        # Development server
   npm run build      # Build for production
   npm run preview    # Preview production build
   ```

The backend will run on `http://localhost:5000` and the frontend on `http://localhost:5173` (default Vite port).

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test                    # Run all tests
npm run test:utils         # Test utilities
npm run test:models        # Test models
npm run test:controllers   # Test controllers
npm run test:services      # Test services
npm run test:middleware    # Test middleware
npm run test:integration   # Integration tests
```

### Frontend Linting
```bash
cd frontend
npm run lint              # Run ESLint
```

## 🔌 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset confirmation
- `GET /api/auth/google` - Google OAuth login
- `GET /api/auth/facebook` - Facebook OAuth login
- `GET /api/auth/verify-token` - Token validation

### Event Management
- `GET /api/events` - Get all events with filtering and pagination
- `GET /api/events/:id` - Get event details
- `POST /api/events` - Create new event (Admin)
- `PUT /api/events/:id` - Update event (Admin/Owner)
- `DELETE /api/events/:id` - Delete event (Admin/Owner)
- `POST /api/events/:id/cancel` - Cancel event with refunds
- `POST /api/events/:id/reschedule` - Reschedule event
- `GET /api/events/featured` - Get featured events
- `GET /api/events/categories` - Get all categories
- `GET /api/events/search` - Advanced event search
- `POST /api/events/:id/reviews` - Add event review
- `GET /api/events/:id/reviews` - Get event reviews
- `GET /api/events/nearby` - Location-based event discovery

### Ticket Management
- `POST /api/tickets/book` - Book event tickets
- `GET /api/tickets/user/:userId` - Get user's tickets
- `GET /api/tickets/:id` - Get ticket details
- `POST /api/tickets/:id/cancel` - Cancel ticket booking
- `POST /api/tickets/exchange` - Exchange tickets
- `GET /api/tickets/:id/qr` - Generate QR code
- `POST /api/tickets/validate` - Validate QR code
- `POST /api/tickets/transfer` - Transfer ticket ownership
- `GET /api/tickets/history` - Get ticket history

### Payment Processing
- `POST /api/payments/create` - Create payment intent
- `POST /api/payments/confirm` - Confirm payment
- `GET /api/payments/methods` - Get saved payment methods
- `POST /api/payments/methods` - Save payment method
- `DELETE /api/payments/methods/:id` - Remove payment method
- `POST /api/payments/refund` - Process refund
- `GET /api/payments/history` - Get payment history
- `POST /api/payments/credit/add` - Add user credit
- `POST /api/payments/credit/use` - Use user credit
- `GET /api/payments/analytics` - Payment analytics (Admin)

### User Management
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/bookings` - Get user bookings
- `POST /api/users/wishlist` - Add to wishlist
- `DELETE /api/users/wishlist/:eventId` - Remove from wishlist
- `GET /api/users/wishlist` - Get wishlist
- `GET /api/users/notifications` - Get user notifications
- `PUT /api/users/notifications/:id/read` - Mark notification as read

### Admin Endpoints
- `GET /api/admin/dashboard` - Admin dashboard data
- `GET /api/admin/users` - Manage users
- `GET /api/admin/events` - Manage all events
- `GET /api/admin/analytics` - System analytics
- `GET /api/admin/reports` - Generate reports
- `POST /api/admin/refunds/:id/approve` - Approve refund
- `POST /api/admin/refunds/:id/reject` - Reject refund
- `GET /api/admin/faqs` - Manage FAQs
- `POST /api/admin/faqs` - Create FAQ
- `PUT /api/admin/faqs/:id` - Update FAQ
- `DELETE /api/admin/faqs/:id` - Delete FAQ
- `GET /api/admin/newsletter` - Newsletter management
- `POST /api/admin/newsletter/send` - Send newsletter

### Real-time Features (WebSocket)
- `/chat` - Real-time customer support
- `/notifications` - Live notification updates
- `/event-updates` - Real-time event changes
- `/booking-updates` - Live booking status updates

### File Management
- `POST /api/upload/image` - Upload event images
- `POST /api/upload/document` - Upload documents
- `GET /api/files/:filename` - Retrieve uploaded files
- `DELETE /api/files/:filename` - Delete uploaded files

### Analytics & Reporting
- `GET /api/analytics/revenue` - Revenue analytics
- `GET /api/analytics/users` - User analytics
- `GET /api/analytics/events` - Event performance
- `GET /api/analytics/bookings` - Booking statistics
- `GET /api/analytics/geographic` - Geographic distribution
- `GET /api/reports/export` - Export data reports


# ImpactLink

A transparent micro-donation platform connecting charities with donors

## 🚀 Live Demo

**Try ImpactLink now:** [https://impact-link-d61a13ed.base44.app/](https://impact-link-d61a13ed.base44.app/)

### Current MVP Status (November 2025)
- ✅ **3 Verified Charities** added to South African database
  - So Loved Helping Hands (Johannesburg, Gauteng)
  - Water for Life (Soweto, Gauteng)
  - Education First (Alexandra, Gauteng)
- ✅ Complete database schema with 9 entities
- ✅ Beautiful UI with Roundup App-inspired design
- ✅ Fundraising progress bars showing donation targets
- ✅ Public, fully accessible demo
- 🔄 Projects data population (in progress)
- 🔄 PayFast payment integration (South Africa)

## 💻 Tech Stack

### Current Implementation (MVP - Base44 No-Code)
- **Platform**: Base44 (React-based no-code builder)
- **Frontend**: React components, Tailwind CSS
- **Backend**: Base44 API, PostgreSQL database
- **Database Entities**: Users, Charities, Projects, Donations, Subscriptions, Updates, Badges, CorporateAccounts, Payouts
- **Payment Gateway**: PayFast (South Africa)
- **Hosting**: Base44 managed cloud
- **Design Inspiration**: Roundup App (minimal, clean, blue-focused)
- **Functionality Inspiration**: Uber (real-time matching, on-demand)

### Future Stack (Node.js Migration)
- Backend: Express.js + Node.js
- API: RESTful with JWT authentication
- Database: PostgreSQL (self-hosted)
- Frontend: React with modern tooling
- Hosting: HostKing (SSH/cPanel support)
- Payment: PayFast API integration

## 🌟 How to Use

### For Donors
1. Visit [https://impact-link-d61a13ed.base44.app/](https://impact-link-d61a13ed.base44.app/)
2. Browse verified charities and their active fundraising projects
3. View detailed fundraising progress bars showing funding targets
4. Make micro-donations (starting from R5) to causes you care about
5. Track your donations and see real-time impact

### For Charities
1. Create verified charity profile
2. Launch fundraising campaigns with specific goals
3. Add projects and track donations received
4. View donor impact and generate reports
5. Communicate with supporters and share success stories

## 🌍 South African Focus

ImpactLink is specifically designed for the South African nonprofit sector:
- **Currency**: South African Rand (ZAR)
- **Payment Gateway**: PayFast (leading SA payment processor)
- **Launch Cities**: Johannesburg, Soweto, Alexandra (Gauteng province)
- **Verification**: Compliance with South African NPO standards
- **Impact**: Supporting local charities and community organizations

## 🤝 Contributing

We welcome contributions! Whether you're interested in:
- Adding features
- Improving the Node.js backend
- Enhancing the UI/UX
- Writing documentation
- Testing with real charities

This is an open-source project built for social impact.

## 💬 Connect With Us

- **NPO**: So Loved Helping Hands (Cosmo City, Johannesburg)
- **Email**: marketing@solovedhelpinghands.org.za
- **Website**: https://solovedhelpinghands.org.za
- **GitHub**: idesignmedia6557/ImpactLink

## 📄 License

MIT License - This project is open-source and free for nonprofit organizations to use and adapt.

---

*Last Updated: November 2025*
*MVP Status: Base44 demo with 3 verified charities and complete database schema*


## Project Vision

ImpactLink aims to revolutionize charitable giving by creating a transparent, accessible micro-donation platform that directly connects donors with verified charities. Our vision is to make charitable giving as simple as a few clicks while ensuring complete transparency about where donations go and how they're used.

We believe that even small donations can create significant impact when facilitated through a trustworthy, user-friendly platform. By leveraging modern technology and blockchain-inspired transparency principles, ImpactLink will build trust between donors and charities, ultimately increasing overall charitable contributions and social impact.

## Core Features

### For Donors
- **Easy Micro-Donations**: Support causes with donations starting from $1
- **Real-time Transparency**: Track exactly where your donations go and how they're used
- **Charity Discovery**: Browse and discover verified charities by cause, location, and impact metrics
- **Donation History**: Complete record of all contributions and their impact
- **Recurring Donations**: Set up automatic monthly contributions to favorite causes
- **Social Sharing**: Share your impact and inspire others to give

### For Charities
- **Verification System**: Rigorous vetting process to build donor trust
- **Impact Reporting**: Easy-to-use dashboard for reporting fund usage and outcomes
- **Donor Engagement**: Tools to communicate with supporters and share success stories
- **Analytics**: Insights into donation patterns and donor demographics
- **Low Transaction Fees**: Maximized funds going directly to charitable work
- **Campaign Creation**: Launch specific fundraising campaigns with goals and timelines

### Platform Features
- **Secure Payment Processing**: PCI-compliant payment infrastructure
- **Transparency Ledger**: Immutable record of all transactions and fund allocation
- **Search & Filter**: Advanced discovery tools for finding causes that matter
- **Mobile-First Design**: Seamless experience across all devices
- **Multi-Currency Support**: Accept donations in multiple currencies
- **Tax Documentation**: Automatic generation of donation receipts for tax purposes

## MVP Execution Plan

### Phase 1: Foundation (Weeks 1-4)
**Goal**: Establish core infrastructure and basic functionality

#### Technical Setup
- Set up development environment and repository structure
- Configure CI/CD pipeline
- Establish database architecture (PostgreSQL)
- Set up authentication system (OAuth 2.0)
- Implement basic API framework (RESTful)

#### Deliverables
- User registration and login for donors and charities
- Basic profile management
- Database schema with core entities (users, charities, donations)
- API documentation

### Phase 2: Core Donation Flow (Weeks 5-8)
**Goal**: Enable end-to-end donation functionality

#### Features
- Integrate payment processor (Stripe)
- Build charity listing page
- Create donation flow (select charity → choose amount → payment)
- Implement donation confirmation and receipts
- Basic charity profile pages

#### Deliverables
- Working payment processing
- Donor can browse charities and make donations
- Email notifications for donation confirmations
- Simple dashboard showing donation history

### Phase 3: Transparency & Trust (Weeks 9-12)
**Goal**: Implement transparency features that differentiate the platform

#### Features
- Charity verification workflow
- Fund allocation tracking system
- Impact reporting dashboard for charities
- Public transparency pages showing fund usage
- Search and filter functionality

#### Deliverables
- Charities can submit verification documents
- Admin panel for charity approval
- Charities can report how funds were used
- Donors can see detailed fund allocation for their donations

### Phase 4: Polish & Launch (Weeks 13-16)
**Goal**: Prepare for public launch

#### Activities
- User acceptance testing
- Security audit
- Performance optimization
- Mobile responsiveness refinement
- Content creation (about pages, FAQs, help docs)
- Onboard 10-20 pilot charities

#### Deliverables
- Production-ready platform
- Legal compliance (terms of service, privacy policy)
- Marketing website
- Launch plan and initial charity partnerships

### Success Metrics for MVP
- Successfully process 100+ donations
- Onboard 20+ verified charities
- Achieve 90%+ user satisfaction rating
- Zero critical security vulnerabilities
- Average page load time under 2 seconds
- 95%+ uptime

## Technology Stack (Proposed)

### Frontend
- React.js with TypeScript
- Tailwind CSS for styling
- Redux for state management
- React Router for navigation

### Backend
- Node.js with Express.js
- PostgreSQL database
- Prisma ORM
- JWT for authentication
- Stripe API for payments

### Infrastructure
- AWS/Google Cloud for hosting
- Docker for containerization
- GitHub Actions for CI/CD
- CloudFlare for CDN

### Security
- SSL/TLS encryption
- PCI DSS compliance
- OWASP security best practices
- Regular security audits

## Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL (v14+)
- npm or yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/idesignmedia6557/ImpactLink.git

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
npm run migrate

# Start development servers
npm run dev
```

## Project Structure
```
ImpactLink/
├── frontend/          # React frontend application
├── backend/           # Node.js backend API
├── docs/             # Documentation
└── README.md         # This file
```

## Contributing

We welcome contributions! Please see our contributing guidelines for more information.

## License

TBD

## Contact

For questions or feedback, please open an issue or contact the maintainers.

---

**Note**: This is an initial project setup. The platform is under active development.

# SaaS Directory Agent - Frontend

This is the React frontend I built for the SaaS Directory Submission Agent. It provides a clean dashboard for managing products, directories, and tracking submissions.

## Tech Stack

I chose this stack for a fast, type-safe development experience:

- **React 19** - Latest React with improved performance
- **TypeScript** - Type safety throughout
- **Vite** - Fast build tool and dev server
- **TanStack Query** - Smart data fetching with caching
- **Tailwind CSS** - Utility-first styling
- **React Hook Form + Zod** - Form handling with validation
- **Recharts** - Data visualization for the dashboard

## Getting Started

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit http://localhost:5173

## Environment Variables

Create a `.env` file:

```env
VITE_API_URL=http://localhost:8000/api
```

## Available Scripts

```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run preview  # Preview production build
npm run format   # Format code with Biome
npm run lint     # Lint code with Biome
```

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/                    # Reusable UI components (shadcn/ui)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── form.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── table.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── toast.tsx
│   │   │   └── ...
│   │   ├── layout/
│   │   │   ├── Layout.tsx         # Main layout wrapper
│   │   │   └── NavLink.tsx        # Navigation links
│   │   ├── dashboard/
│   │   │   ├── Dashboard.tsx      # Dashboard page
│   │   │   ├── DashboardOverview.tsx
│   │   │   ├── RecentSubmissions.tsx
│   │   │   ├── SubmissionsChart.tsx
│   │   │   ├── StatusIcon.tsx
│   │   │   └── utils.ts
│   │   ├── submissions/
│   │   │   ├── SubmissionList.tsx
│   │   │   ├── SubmissionTable.tsx
│   │   │   ├── SubmissionFilters.tsx
│   │   │   ├── SubmissionDetailsModal.tsx
│   │   │   ├── StatusIcon.tsx
│   │   │   └── utils.ts
│   │   ├── bulk-submit/
│   │   │   ├── BulkSubmit.tsx     # Bulk submission page
│   │   │   ├── SaasProductSelection.tsx
│   │   │   ├── DirectorySelection.tsx
│   │   │   ├── SubmitButton.tsx
│   │   │   └── InfoBox.tsx
│   │   ├── saas/
│   │   │   ├── SaasManager.tsx    # SaaS products page
│   │   │   └── forms/
│   │   │       └── SaasProductForm.tsx
│   │   ├── directories/
│   │   │   ├── DirectoryManager.tsx # Directories page
│   │   │   ├── forms/
│   │   │   │   └── DirectoryForm.tsx
│   │   │   └── utils.ts
│   │   ├── DeleteAlertDialog.tsx
│   │   ├── ModalRoot.tsx
│   │   └── ProtectedRoute.tsx
│   ├── contexts/
│   │   ├── AuthContext.tsx        # Authentication state
│   │   └── ModalContext.tsx       # Modal management
│   ├── pages/
│   │   ├── Login.tsx
│   │   └── Register.tsx
│   ├── services/
│   │   ├── api/
│   │   │   ├── ApiService.ts      # Main API service
│   │   │   ├── authApi.ts         # Auth endpoints
│   │   │   ├── saasApi.ts         # SaaS product endpoints
│   │   │   ├── directoriesApi.ts  # Directory endpoints
│   │   │   ├── submissionsApi.ts  # Submission endpoints
│   │   │   ├── config.ts          # Axios configuration
│   │   │   ├── tokenManager.ts    # JWT token handling
│   │   │   └── index.ts
│   │   └── utils.ts               # Validation utilities
│   ├── store/
│   │   ├── hooks/
│   │   │   ├── useDashboard.ts    # Dashboard queries
│   │   │   ├── useDirectories.ts  # Directory CRUD hooks
│   │   │   ├── useSaasProducts.ts # SaaS product hooks
│   │   │   └── useSubmissions.ts  # Submission hooks
│   │   ├── queryKeys.ts           # Query key factory
│   │   └── index.ts
│   ├── types/
│   │   ├── schema.ts              # Zod schemas & types
│   │   └── models/
│   │       └── enums.ts
│   ├── hooks/
│   │   └── use-toast.ts           # Toast notifications
│   ├── utils/
│   │   └── use-debounce.ts        # Debounce hook
│   ├── lib/
│   │   └── utils.ts               # Utility functions (cn)
│   ├── assets/
│   ├── App.tsx                    # Main app with routing
│   ├── main.tsx                   # Entry point
│   └── index.css                  # Global styles + Tailwind
├── public/
├── .env
├── biome.json                     # Biome linter config
├── components.json                # shadcn/ui config
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
└── README.md
```

## Main Pages

### Dashboard
The main overview with stats, recent submissions, and a pie chart showing submission status breakdown.

### SaaS Manager
Where I manage the SaaS products that get submitted to directories. Each product has name, URL, description, category, etc.

### Directory Manager
List of all directories I can submit to. Shows success rates and lets me configure login credentials for protected directories.

### Bulk Submit
The main workflow - select a product, pick directories, and submit. Shows real-time progress.

### Submissions
Full list of all submissions with filtering by status. I can retry failed ones from here.

## API Integration

I use a centralized API service with TanStack Query for data fetching:

```typescript
// Using the hooks
const { data: products } = useSaasProducts();
const { mutate: createProduct } = useCreateSaasProduct();

// Direct API calls
import { api } from '@/services/api/ApiService';
const products = await api.getSaasProducts();
```

## Form Handling

Forms use React Hook Form with Zod validation:

```typescript
const form = useForm({
  resolver: zodResolver(SaasProductCreateSchema),
  defaultValues: { name: '', website_url: '' }
});
```

## Styling

I use Tailwind CSS with shadcn/ui components. The UI components are in `src/components/ui/` and follow a consistent design.

## Code Quality

Biome handles linting and formatting:

```bash
npm run format   # Format all files
npm run lint     # Check for issues
```

---

Built as part of the SaaS Directory Submission Agent.

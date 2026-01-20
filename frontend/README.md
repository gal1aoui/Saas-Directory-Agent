# SaaS Directory Agent - Frontend

Modern React TypeScript frontend with TanStack Query, Zod validation, and Biome for code quality.

## 🚀 Features

- ✅ **React 18 + TypeScript** - Type-safe development
- ✅ **TanStack Query** - Smart data fetching & caching
- ✅ **Zod Validation** - Runtime type checking
- ✅ **Tailwind CSS** - Utility-first styling
- ✅ **Biome** - Fast linting & formatting
- ✅ **React Hook Form** - Performant forms
- ✅ **Recharts** - Beautiful data visualization

## 📋 Prerequisites

- Node.js 18+
- npm or yarn
- Backend API running

## 🔧 Installation

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit http://localhost:5173

## 🏃 Available Scripts

```bash
# Development
npm run dev          # Start dev server (Vite)
npm run build        # Build for production
npm run preview      # Preview production build

# Code Quality
npm run format       # Format code with Biome
npm run lint         # Lint code with Biome
npm run check        # Type check with TypeScript
```

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/         # React components
│   │   ├── Dashboard.tsx
│   │   ├── SubmissionList.tsx
│   │   ├── BulkSubmit.tsx
│   │   ├── SaasManager.tsx
│   │   └── DirectoryManager.tsx
│   ├── hooks/             # Custom React hooks
│   │   └── index.ts       # TanStack Query hooks
│   ├── providers/         # Context providers
│   │   └── QueryProvider.tsx
│   ├── services/          # API client
│   │   └── api.ts
│   ├── types/             # TypeScript types
│   │   └── schemas.ts     # Zod schemas
│   ├── App.tsx            # Main app component
│   ├── main.tsx           # Entry point
│   └── index.css          # Global styles
├── public/
├── .env                   # Environment variables
├── biome.json             # Biome configuration
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 🎨 Components Overview

### Dashboard
- Real-time statistics
- Success rate visualization
- Recent submissions
- Pie chart breakdown

### SaaS Manager
- Add/edit SaaS products
- Upload logos
- Manage product details
- Form validation with Zod

### Directory Manager
- Add/edit directories
- **Login credentials** support
- **Multi-step form** configuration
- Success rate tracking

### Bulk Submit
- Select SaaS product
- Multi-select directories
- Real-time submission progress
- Results summary

### Submission List
- Filter by status
- Search submissions
- Retry failed submissions
- View detailed logs

## 🔌 API Integration

### Environment Variables

Create `.env`:

```env
VITE_API_URL=http://localhost:8000/api
```

### API Service

```typescript
import { api } from '@/services/api';

// Fetch data
const products = await api.getSaasProducts();

// Create data
const product = await api.createSaasProduct(data);

// Update data
await api.updateSaasProduct(id, data);
```

## 🎯 State Management

### TanStack Query

All data fetching uses TanStack Query:

```typescript
// Automatic caching & refetching
const { data, isLoading, error, refetch } = useSaasProducts();

// Mutations with cache invalidation
const mutation = useCreateSaasProduct();
await mutation.mutateAsync(data);
```

**Benefits:**
- Automatic caching
- Background refetching
- Optimistic updates
- Request deduplication

## ✅ Type Safety

### Zod Schemas

Runtime validation with TypeScript types:

```typescript
import { SaasProductCreateSchema } from '@/types/schemas';

// Validate at runtime
const product = SaasProductCreateSchema.parse(formData);

// TypeScript knows the exact shape
product.name // string
product.website_url // string (validated URL)
```

### React Hook Form Integration

```typescript
const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(SaasProductCreateSchema)
});

// Automatic validation on submit
<input {...register('name')} />
{errors.name && <span>{errors.name.message}</span>}
```

## 🎨 Styling

### Tailwind CSS

Utility-first styling:

```tsx
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
  Submit
</button>
```

### Custom Classes

Defined in `index.css`:

```css
.btn-primary {
  @apply px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700;
}

.card {
  @apply bg-white rounded-lg shadow p-6;
}
```

## 🧹 Code Quality with Biome

### Configuration

`biome.json`:

```json
{
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "double"
    }
  }
}
```

### Usage

```bash
# Format all files
npm run format

# Check formatting
npm run lint

# Fix auto-fixable issues
npm run lint:fix
```

## 🐛 VS Code Integration

### Recommended Extensions

```json
{
  "recommendations": [
    "biomejs.biome",
    "bradlc.vscode-tailwindcss",
    "dbaeumer.vscode-eslint"
  ]
}
```

### settings.json

```json
{
  "editor.defaultFormatter": "biomejs.biome",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.organizeImports": "explicit"
  },
  "[typescript]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "biomejs.biome"
  }
}
```

### Debugging

`launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Launch Chrome",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}/src"
    }
  ]
}
```

## 🧪 Testing

```bash
# Run tests
npm test

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage
```

## 🏗️ Building

### Development

```bash
npm run dev
```

- Hot module replacement
- Fast refresh
- Source maps

### Production

```bash
npm run build
```

- Minification
- Tree shaking
- Code splitting
- Optimized assets

Output in `dist/`

### Preview

```bash
npm run preview
```

Serve production build locally

## 🚀 Deployment

### Vercel

```bash
npm install -g vercel
vercel
```

### Netlify

```bash
npm run build
netlify deploy --prod --dir=dist
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
CMD ["npm", "run", "preview"]
```

## 📊 Performance

### Code Splitting

Automatic route-based splitting with React Router

### Lazy Loading

```typescript
const Dashboard = lazy(() => import('./components/Dashboard'));
```

### Memoization

```typescript
const MemoizedComponent = React.memo(SubmissionList);

const stats = useMemo(() => calculateStats(data), [data]);
```

## 🐛 Troubleshooting

### API not connecting

```env
# Check .env
VITE_API_URL=http://localhost:8000/api
```

### Type errors

```bash
# Regenerate types
npm run type-check
```

### Biome errors

```bash
# Auto-fix
npm run lint:fix

# Format code
npm run format
```

### Cache issues

```bash
# Clear cache
rm -rf node_modules/.vite
npm run dev
```

## 🎓 Learning Resources

- [React Docs](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [TanStack Query](https://tanstack.com/query/latest/docs/react/overview)
- [Zod Documentation](https://zod.dev/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Biome](https://biomejs.dev/)

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Run `npm run lint` and `npm run format`
4. Run `npm run type-check`
5. Submit pull request

## 📄 License

Proprietary - All rights reserved

---
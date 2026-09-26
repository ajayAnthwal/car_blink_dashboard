const fs = require('fs');
const path = 'C:/Users/ajay anthwal/Desktop/car_blink/components/layout/providers.tsx';
let content = fs.readFileSync(path, 'utf8');

// Ensure 'use client'; is the first line
content = content.replace(/'use client';/g, '').replace(/"use client";/g, '').trim();
content = `'use client';\n\nimport React from 'react';\nimport { QueryClientProvider } from '@tanstack/react-query';\nimport queryClient from '@/lib/react-query';\nimport { AuthProvider } from '@/features/auth/hooks/useAuth';\n\nexport default function Providers({\n  children\n}: {\n  children: React.ReactNode;\n}) {\n  return (\n    <QueryClientProvider client={queryClient}>\n      <AuthProvider>\n        {children}\n      </AuthProvider>\n    </QueryClientProvider>\n  );\n}\n`;

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully fixed providers.tsx directive order');

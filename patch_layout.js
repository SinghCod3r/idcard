const fs = require('fs');
let code = fs.readFileSync('src/app/layout.tsx', 'utf8');

code = code.replace(
  'import { Toaster } from "@/components/ui/toast";',
  'import { Toaster } from "@/components/ui/toast";\nimport NextTopLoader from "nextjs-toploader";'
);

code = code.replace(
  '{children}',
  '<NextTopLoader color="#3b82f6" showSpinner={false} />\n        {children}'
);

fs.writeFileSync('src/app/layout.tsx', code);

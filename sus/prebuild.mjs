import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

const generatedFiles = [
  "convex/_generated/api.d.ts",
  "convex/_generated/api.js",
  "convex/_generated/dataModel.d.ts",
  "convex/_generated/server.d.ts",
  "convex/_generated/server.js",
];

const hasGeneratedFiles = generatedFiles.every((file) => existsSync(file));
const hasConvexDeployConfig =
  Boolean(process.env.CONVEX_DEPLOY_KEY) ||
  (Boolean(process.env.CONVEX_SELF_HOSTED_URL) &&
    Boolean(process.env.CONVEX_SELF_HOSTED_ADMIN_KEY));
const isVercel = Boolean(process.env.VERCEL);

if (isVercel && !hasConvexDeployConfig) {
  if (!hasGeneratedFiles) {
    console.error(
      "Skipping Convex codegen on Vercel because no deployment credentials were provided, but convex/_generated is missing."
    );
    process.exit(1);
  }

  console.log(
    "Skipping Convex codegen on Vercel because no Convex deployment credentials were provided; using committed convex/_generated files."
  );
  process.exit(0);
}

const result = spawnSync("npx", ["convex", "codegen"], {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: process.env,
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

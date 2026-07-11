import { loadEnvConfig } from "@next/env"
loadEnvConfig(process.cwd())

import { defineConfig } from "prisma/config"

export default defineConfig({
  schema: "./prisma/schema.prisma",
  datasource: {
    url: process.env.DIRECT_URL || process.env.DATABASE_URL || "",
  },
})

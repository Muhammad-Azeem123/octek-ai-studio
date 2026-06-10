import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";

import { routeTree } from "./routeTree.gen";

function resolveBasepath(): string | undefined {
  const baseUrl = import.meta.env.BASE_URL ?? "/";
  const trimmed = baseUrl.replace(/\/$/, "");
  return trimmed || undefined;
}

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    basepath: resolveBasepath(),
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};

export type AppRouter = ReturnType<typeof getRouter>;

declare module "@tanstack/react-router" {
  interface Register {
    router: AppRouter;
  }
}

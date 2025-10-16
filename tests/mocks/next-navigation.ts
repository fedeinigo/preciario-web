export type MockRouter = {
  push: (href: string, options?: { scroll?: boolean }) => void;
  replace: (href: string, options?: { scroll?: boolean }) => void;
  refresh: () => void;
  prefetch: (href: string) => Promise<void>;
  back: () => void;
  forward: () => void;
};

const noop = () => {};
const asyncNoop = async () => {};

let routerState: MockRouter = {
  push: noop,
  replace: noop,
  refresh: noop,
  prefetch: asyncNoop,
  back: noop,
  forward: noop,
};

let currentPathname = "/";
let currentSearchParams = new URLSearchParams();

export type ReadonlyURLSearchParams = URLSearchParams;

export function redirect(url: string): never {
  throw new Error(`Redirect attempted to ${url}`);
}

export function __setRouterState({
  pathname,
  searchParams,
  router,
}: {
  pathname?: string;
  searchParams?: URLSearchParams;
  router?: Partial<MockRouter>;
}) {
  if (pathname !== undefined) {
    currentPathname = pathname;
  }
  if (searchParams !== undefined) {
    currentSearchParams = new URLSearchParams(searchParams.toString());
  }
  if (router) {
    routerState = { ...routerState, ...router };
  }
}

export function __resetRouterState() {
  routerState = {
    push: noop,
    replace: noop,
    refresh: noop,
    prefetch: asyncNoop,
    back: noop,
    forward: noop,
  };
  currentPathname = "/";
  currentSearchParams = new URLSearchParams();
}

export function useRouter(): MockRouter {
  return routerState;
}

export function usePathname(): string {
  return currentPathname;
}

export function useSearchParams(): URLSearchParams {
  return currentSearchParams;
}

import * as React from "react";

type DynamicOptions = {
  loading?: () => React.ReactNode;
  ssr?: boolean;
};

type DynamicImport<TProps> = () => Promise<{ default: React.ComponentType<TProps> }>;

export default function dynamic<TProps>(
  importer: DynamicImport<TProps>,
  options?: DynamicOptions,
): React.ComponentType<TProps> {
  const LazyComponent = React.lazy(importer);
  const Loading = options?.loading;

  function DynamicComponent(props: TProps) {
    const fallback = Loading ? Loading() : null;
    return React.createElement(
      React.Suspense,
      { fallback },
      React.createElement(LazyComponent as React.ComponentType<any>, props as any),
    );
  }

  DynamicComponent.displayName = "DynamicComponent";

  return DynamicComponent;
}

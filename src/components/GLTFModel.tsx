import React, { useMemo, Component, ErrorInfo, ReactNode } from 'react';
import { useGLTF } from '@react-three/drei';
import { SkeletonUtils } from 'three-stdlib';

interface GLTFModelProps {
  url: string;
  [key: string]: any;
}

class ErrorBoundary extends Component<{children: ReactNode, fallback: ReactNode}, {hasError: boolean}> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("GLTFModel failed to load:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

function GLTFModelInner({ url, ...props }: GLTFModelProps) {
  const { scene } = useGLTF(url);
  // Clone the scene so we can reuse the same model multiple times (e.g., coins, obstacles)
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);

  return <primitive object={clone} {...props} />;
}

export function GLTFModel(props: GLTFModelProps) {
  return (
    <ErrorBoundary fallback={null}>
      <GLTFModelInner {...props} />
    </ErrorBoundary>
  );
}

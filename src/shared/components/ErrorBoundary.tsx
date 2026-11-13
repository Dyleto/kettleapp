import { Component, ErrorInfo, ReactNode } from 'react';
import { ActionButton } from './ActionButton';
import { FullScreenState } from './FullScreenState';
import { CRASH_LINE, CRASH_TITLE } from './RouteError';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Le dernier filet : ce qui plante hors du routeur — un fournisseur, la
 * bannière de mise à jour — et que `RouteError` ne peut donc pas attraper.
 *
 * Il affichait aussi un toast, qui n'a jamais pu paraître : le composant
 * qui dessine les toasts vit sous cette frontière, et disparaît avec tout le
 * reste au moment précis où elle prend la main. L'écran dit seul ce qu'il y
 * a à dire.
 */
class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <FullScreenState
          mood="oops"
          title={CRASH_TITLE}
          line={CRASH_LINE}
          action={
            <ActionButton size="md" onClick={this.handleReload}>
              Recharger
            </ActionButton>
          }
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

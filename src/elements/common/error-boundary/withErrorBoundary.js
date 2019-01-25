/**
 * @flow
 * @file withErrorBoundary HOC which adds error boundaries as well as error logging
 * @author Box
 */

import * as React from 'react';
import ErrorBoundary from './ErrorBoundary';

const withErrorBoundary = (errorOrigin: ElementOrigin) => (WrappedComponent: React.ComponentType<any>) =>
    React.forwardRef<Object, React.Ref<any>>((props: Object = {}, ref: React.Ref<any>) => (
        <ErrorBoundary {...props} errorOrigin={errorOrigin}>
            <WrappedComponent ref={ref} />
        </ErrorBoundary>
    ));

export default withErrorBoundary;

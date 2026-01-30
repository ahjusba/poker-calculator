import { ReactNode } from 'react';
import { Footer } from './footer';

interface PageContainerProps {
  children: ReactNode;
  title?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

export function PageContainer({ 
  children, 
  title, 
  maxWidth = 'md' 
}: PageContainerProps) {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    'full': 'max-w-full',
  };

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-6 md:py-8">
        <div className={`${maxWidthClasses[maxWidth]} mx-auto w-full`}>
          {title && (
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-6 md:mb-8 text-poker-light-green">
              {title}
            </h1>
          )}
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}

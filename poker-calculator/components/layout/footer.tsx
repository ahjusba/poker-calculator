import Image from 'next/image';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-poker-dark-green/80 backdrop-blur">
      <div className="container mx-auto">
        <div className="flex items-center justify-center">
          <div className="relative w-48 h-12 md:w-64 md:h-16">
            <Image
              src="/footer_logo.png"
              alt="Pokerikerho Logo"
              fill
              className="object-contain"
            />
          </div>
        </div>
      </div>
    </footer>
  );
}

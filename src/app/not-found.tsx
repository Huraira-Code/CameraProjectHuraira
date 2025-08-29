
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center">
      <h1 className="text-4xl font-bold mb-4">404 - Pagina Niet Gevonden</h1>
      <p className="mb-8">Sorry, de pagina die u zoekt bestaat niet.</p>
      <Link href="/" className="text-primary hover:underline">
        Ga terug naar de homepagina
      </Link>
    </div>
  );
}

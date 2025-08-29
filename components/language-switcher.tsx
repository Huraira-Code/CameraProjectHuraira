
"use client";

import { useAtom } from 'jotai';
import { Locale, localeAtom, locales } from '@/lib/locale';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function LanguageSwitcher() {
  const [locale, setLocale] = useAtom(localeAtom);

  return (
    <div className="flex items-center justify-center space-x-2 bg-black/20 backdrop-blur-sm p-1 rounded-full">
      {locales.map((loc) => (
        <Button
          key={loc}
          variant={locale === loc ? 'secondary' : 'ghost'}
          onClick={() => setLocale(loc)}
          className={cn(
            "rounded-full text-white hover:text-white hover:bg-white/20",
            locale === loc && "text-primary-foreground bg-primary hover:bg-primary/80"
          )}
        >
          {loc.toUpperCase()}
        </Button>
      ))}
    </div>
  )
}

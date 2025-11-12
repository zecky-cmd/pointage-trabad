import Link from "next/link"

type Props = {
  href: string // ← URL de retour personnalisable
  label?: string // ← texte du lien (optionnel)
}

export default function Navigation({ href, label = "← Retour" }: Props) {
  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16">
          <Link href={href} className="text-blue-600 hover:text-blue-800">
            {label}
          </Link>
        </div>
      </div>
    </nav>
  )
}

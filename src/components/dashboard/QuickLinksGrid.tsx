import Link from "next/link";
import { Users, Clock, FileText,  DatabaseBackup } from "lucide-react";


interface QuickLinksGridProps {
  role?: string;
}

const links = [
  {
    title: "Gestion Employés",
    description: "Ajouter, modifier ou supprimer des employés",
    href: "/employes",
    icon: Users,
    color: "bg-blue-500",
    roles: ["admin", "rh"],
  },
  {
    title: "Pointage Journalier",
    description: "Suivi des entrées et sorties",
    href: "/pointage",
    icon: Clock,
    color: "bg-green-500",
    roles: ["admin", "rh", "employe"],
  },
  {
    title: "Justifications",
    description: "Gérer les demandes d'absence",
    href: "/pointage/justifications",
    icon: FileText,
    color: "bg-orange-500",
    roles: ["admin", "rh"],
  },
  {
    title: "Gestion des rapports",
    description: "Gérer les rapports mensuels",
    href: "/pointage/detail",
    icon: DatabaseBackup,
    color: "bg-red-500",
    roles: ["admin", "rh"],
  },
];

export default function QuickLinksGrid({ role }: QuickLinksGridProps) {
  // Filter links based on role
  const filteredLinks = links.filter(
    (link) => !link.roles || (role && link.roles.includes(role))
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {filteredLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="group bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 flex items-start gap-4"
        >
          <div
            className={`p-3 rounded-xl ${link.color} text-white shadow-lg shadow-gray-200 group-hover:scale-110 transition-transform duration-200`}
          >
            <link.icon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
              {link.title}
            </h3>
            <p className="text-sm text-gray-500 mt-1">{link.description}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}

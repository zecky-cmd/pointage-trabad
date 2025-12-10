"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Plus } from "lucide-react";
import Link from "next/link";
import EmployeeActions from "@/components/EmployeeActions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface Profil {
  id_employe: number;
  role: string;
  est_actif: boolean;
  derniere_connexion: string | null;
}

export interface Employee {
  id_employe: number;
  prenom_employe: string;
  nom_employe: string;
  email_employe: string;
  post_employe: string | null;
  departement_employe: string | null;
  statut_employe: "actif" | "inactif";
  created_at: string;
  profil: Profil | null;
}

interface EmployeesListProps {
  employees: Employee[];
  userRole: string;
}

export default function EmployeesList({
  employees,
  userRole,
}: EmployeesListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "tous" | "actif" | "inactif"
  >("tous");

  const filteredEmployees = employees.filter((employee) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      employee.nom_employe.toLowerCase().includes(searchLower) ||
      employee.prenom_employe.toLowerCase().includes(searchLower) ||
      employee.email_employe.toLowerCase().includes(searchLower) ||
      (employee.departement_employe &&
        employee.departement_employe.toLowerCase().includes(searchLower));

    const matchesStatus =
      statusFilter === "tous" || employee.statut_employe === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto flex-1">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un employé..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(value: "tous" | "actif" | "inactif") =>
              setStatusFilter(value)
            }
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tous">Tous les statuts</SelectItem>
              <SelectItem value="actif">Actif</SelectItem>
              <SelectItem value="inactif">Inactif</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/employes/nouveau">
            <Plus className="mr-2 h-4 w-4" />
            Nouvel Employé
          </Link>
        </Button>
      </div>

      {/* Desktop View: Table */}
      <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden border">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nom Complet
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Poste
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Département
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rôle
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredEmployees.map((employe) => (
              <tr
                key={employe.id_employe}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-3 py-2 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {employe.prenom_employe} {employe.nom_employe}
                  </div>
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {employe.email_employe}
                  </div>
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {employe.post_employe || "-"}
                  </div>
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {employe.departement_employe || "-"}
                  </div>
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {employe.profil ? (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                      {employe.profil.role}
                    </span>
                  ) : (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-600">
                      Aucun compte
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      employe.statut_employe === "actif"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {employe.statut_employe}
                  </span>
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm">
                  <EmployeeActions
                    employeeId={employe.id_employe}
                    statut={employe.statut_employe}
                    isAdmin={userRole === "admin"}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile View: Cards */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {filteredEmployees.map((employe) => (
          <Card key={employe.id_employe}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">
                    {employe.prenom_employe} {employe.nom_employe}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {employe.email_employe}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    employe.statut_employe === "actif"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {employe.statut_employe}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Poste</p>
                  <p className="font-medium">{employe.post_employe || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Département</p>
                  <p className="font-medium">
                    {employe.departement_employe || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Rôle</p>
                  <p className="font-medium capitalize">
                    {employe.profil?.role || "Aucun compte"}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t flex justify-end">
                <EmployeeActions
                  employeeId={employe.id_employe}
                  statut={employe.statut_employe}
                  isAdmin={userRole === "admin"}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredEmployees.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-dashed">
          <p className="text-muted-foreground">Aucun employé trouvé</p>
        </div>
      )}
    </div>
  );
}

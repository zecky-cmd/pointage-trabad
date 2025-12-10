"use client";

import { forwardRef } from "react";
import { Ordinateur } from "@/types/ordinateur";

interface ContractProps {
  ordinateur: Ordinateur;
  date: string;
  adminName?: string;
}

export const ContractPrint = forwardRef<HTMLDivElement, ContractProps>(
  ({ ordinateur, date, adminName }, ref) => {
    return (
      <div
        ref={ref}
        className="hidden print:block p-8 bg-white text-black font-serif"
      >
        <div className="text-center mb-8 border-b-2 border-black pb-4">
          <h1 className="text-2xl font-bold uppercase mb-2">
            Mise à Disposition de Matériel
          </h1>
          <p className="text-sm">Trabad Immobilier</p>
        </div>

        <div className="mb-8">
          <p className="mb-4">
            <strong>Entre les soussignés :</strong>
          </p>
          <p className="mb-2">
            <strong>L&apos;Entreprise :</strong> Trabad Immobilier <br />
            Représentée par 
            {adminName || "............................................."}
          </p>
          <p className="mb-4 text-center font-bold">ET</p>
          <p className="mb-2">
            <strong>L&apos;Collaborateur :</strong>
          </p>
          <p className="ml-4">
            Nom : {ordinateur.employe?.nom_employe} <br />
            Prénom : {ordinateur.employe?.prenom_employe}
          </p>
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-bold border-b border-black mb-4">
            Caractéristiques du matériel
          </h2>
          <p className="mb-4">
            L&apos;entreprise met à la disposition du collaborateur le matériel
            suivant à titre professionnel :
          </p>
          <table className="w-full border-collapse border border-black mb-4">
            <tbody>
              <tr>
                <td className="border border-black p-2 font-bold bg-gray-100">
                  Type
                </td>
                <td className="border border-black p-2">{ordinateur.type}</td>
              </tr>
              <tr>
                <td className="border border-black p-2 font-bold bg-gray-100">
                  Marque / Modèle
                </td>
                <td className="border border-black p-2">
                  {ordinateur.marque} {ordinateur.modele}
                </td>
              </tr>
              <tr>
                <td className="border border-black p-2 font-bold bg-gray-100">
                  Numéro de Série
                </td>
                <td className="border border-black p-2">
                  {ordinateur.numero_serie}
                </td>
              </tr>
              <tr>
                <td className="border border-black p-2 font-bold bg-gray-100">
                  État
                </td>
                <td className="border border-black p-2">{ordinateur.etat}</td>
              </tr>
              {ordinateur.processeur && (
                <tr>
                  <td className="border border-black p-2 font-bold bg-gray-100">
                    Processeur
                  </td>
                  <td className="border border-black p-2">
                    {ordinateur.processeur}
                  </td>
                </tr>
              )}
              {ordinateur.ram && (
                <tr>
                  <td className="border border-black p-2 font-bold bg-gray-100">
                    RAM
                  </td>
                  <td className="border border-black p-2">{ordinateur.ram}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-bold border-b border-black mb-4">
            2. Engagements
          </h2>
          <p className="mb-2 text-sm">Le collaborateur s&apos;engage à :</p>
          <ul className="list-disc ml-8 text-sm space-y-1 mb-4">
            <li>
              Utiliser le matériel conformément à sa destination
              professionnelle.
            </li>
            <li>
              Prendre soin du matériel et signaler immédiatement tout
              dysfonctionnement ou perte.
            </li>
            <li>
              Restituer le matériel sur demande ou lors de la fin du contrat de
              travail.
            </li>
            <li>Ne pas installer de logiciels non autorisés.</li>
          </ul>
        </div>

        <div className="mt-16 flex justify-between items-start">
          <div className="w-1/2">
            <p className="mb-4">
              Fait à ............................, le {date}
            </p>
            <p className="font-bold mb-16">Pour l&apos;Entreprise</p>
            <p className="text-xs text-gray-400">Signature</p>
          </div>
          <div className="w-1/2">
            <p className="mb-4 opacity-0">.</p>
            <p className="font-bold mb-16">Le Collaborateur</p>
            <p className="text-xs text-gray-400">
              Signature précédée de la mention &quot;Lu et approuvé&quot;
            </p>
          </div>
        </div>
      </div>
    );
  }
);

ContractPrint.displayName = "ContractPrint";

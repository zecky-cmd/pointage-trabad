// interface Pointage {
//   id_pointage: number
//   id_employe: string
//   date_pointage: string
//   pointage_arrive: string | null
//   pointage_depart: string | null
//   pointage_pause: string | null
//   pointage_reprise: string | null
//   retard_minutes: number
//   statut: "present" | "absent" | "conge" | "weekend"
//   statut_justification_absence: "en_attente" | "justifiee" | "rejetee" | null
//   statut_justification_retard: "en_attente" | "justifiee" | "rejetee" | null
//   justification_absence: string | null
//   justification_retard: string | null
// }


// export default function DetailEmployePage({ params }: { params: { id: string } }) {

//   const loadPointagesMois = async (): Promise<void> => {
//     const [annee, mois] = moisSelectionne.split("-")
//     const premierJour = `${annee}-${mois}-01`
//     const dernierJour = new Date(Number.parseInt(annee), Number.parseInt(mois), 0).getDate()
//     const dernierJourDate = `${annee}-${mois}-${dernierJour}`

//     const { data } = await supabase
//       .from("pointage")
//       .select("*")
//       .eq("id_employe", params.id)
//       .gte("date_pointage", premierJour)
//       .lte("date_pointage", dernierJourDate)
//       .order("date_pointage", { ascending: false })

//     const typedPointages = (data || []) as Pointage[]
//     setPointages(typedPointages)
//     calculerStats(typedPointages)
//   }

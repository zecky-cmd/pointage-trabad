"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useGeolocation } from "@/hooks/useGeolocation";
import { isWithinRadius } from "@/utils/geolocation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();
  const {
    latitude,
    longitude,
    error: geoError,
    loading: geoLoading,
  } = useGeolocation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Geolocation Check
    const companyLat = parseFloat(process.env.NEXT_PUBLIC_COMPANY_LAT || "0");
    const companyLng = parseFloat(process.env.NEXT_PUBLIC_COMPANY_LNG || "0");
    const allowedRadius = parseFloat(
      process.env.NEXT_PUBLIC_ALLOWED_RADIUS_METERS || "100"
    );

    if (companyLat && companyLng) {
      if (geoLoading) {
        setError("Veuillez patienter, localisation en cours...");
        setLoading(false);
        return;
      }

      if (geoError) {
        setError(geoError);
        setLoading(false);
        return;
      }

      if (latitude && longitude) {
        const isAllowed = isWithinRadius(
          latitude,
          longitude,
          companyLat,
          companyLng,
          allowedRadius
        );
        if (!isAllowed) {
          setError(
            "Vous devez être dans les locaux de l'entreprise pour vous connecter."
          );
          setLoading(false);
          return;
        }
      } else {
        setError("Impossible de récupérer votre position.");
        setLoading(false);
        return;
      }
    }

    try {
      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (signInError) {
        throw new Error(signInError.message);
      }

      if (data?.user) {
        const { error: updateError } = await supabase
          .from("profil_utilisateur")
          .update({ derniere_connexion: new Date().toISOString() })
          .eq("id_profil", data.user.id);

        if (updateError) {
          console.warn("Failed to update last login:", updateError.message);
        }
      }

      router.push("/dashboard");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erreur de connexion";
      setError(errorMessage);
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="text-center text-3xl font-bold text-gray-900">
            Connexion
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Système de pointage
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </div>

          <div className="text-sm text-center">
            <a
              href="/forgot-password"
              className="text-blue-600 hover:text-blue-500"
            >
              Mot de passe oublié ?
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}

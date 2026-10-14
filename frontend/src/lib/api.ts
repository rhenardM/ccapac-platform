import axios from "axios";

const api = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:5000/api",

  timeout: 30000,
});

api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token =
        localStorage.getItem("token");

      if (token) {
        config.headers.Authorization =
          `Bearer ${token}`;
      }
    }

    if (
      typeof FormData !== "undefined" &&
      config.data instanceof FormData
    ) {
      delete config.headers[
        "Content-Type"
      ];
    } else if (
      !config.headers["Content-Type"]
    ) {
      config.headers["Content-Type"] =
        "application/json";
    }

    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,

  (error) => {
    /*
     * Ne pas supprimer le token pour chaque réponse
     * 401. Une route indisponible ou un problème de
     * permissions ne signifie pas forcément que la
     * session entière est invalide.
     *
     * La déconnexion est maintenant uniquement
     * effectuée par logout() dans AuthContext.
     */
    if (
      typeof window !== "undefined" &&
      error.response?.status === 401
    ) {
      console.warn(
        "Requête non autorisée :",
        error.config?.url,
      );
    }

    return Promise.reject(error);
  },
);

export default api;
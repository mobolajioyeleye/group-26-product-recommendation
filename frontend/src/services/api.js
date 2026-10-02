const API_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  "http://localhost:5000";

export const apiRequest = async (endpoint, options = {}) => {
  const token =
    typeof window !== "undefined"
      ? window.sessionStorage?.getItem("token") ||
        window.localStorage?.getItem("token")
      : null;

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    credentials: "include",
  });

  let data = null;

  try {
    data = await response.json();
  } catch {
    // Response does not contain JSON
  }

  if (!response.ok) {
    const error = new Error(
      data?.message || `Request failed with status ${response.status}`
    );

    error.response = {
      status: response.status,
      data,
    };

    throw error;
  }

  return data;
};

export const getProducts = async () => {
  const data = await apiRequest("/api/products");
  return data.data || [];
};

export const getProductById = async (productId) => {
  const data = await apiRequest(`/api/products/${productId}`);
  return data.data || null;
};

export const getCategories = async () => {
  const data = await apiRequest("/api/categories");
  return data.data || [];
};
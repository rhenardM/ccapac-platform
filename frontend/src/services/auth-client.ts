import {
  login,
  register,
  type RegisterData,
} from "@/services/auth";

export interface SignUpData {
  email: string;
  password: string;
  name?: string;

  first_name?: string;
  last_name?: string;

  firstName?: string;
  lastName?: string;

  phone?: string;
}

function splitFullName(name?: string) {
  const normalizedName =
    name?.trim() || "";

  if (!normalizedName) {
    return {
      firstName: "",
      lastName: "",
    };
  }

  const parts =
    normalizedName.split(/\s+/);

  const firstName =
    parts.shift() || "";

  const lastName =
    parts.join(" ");

  return {
    firstName,
    lastName,
  };
}

export async function signUp(
  data: SignUpData
) {
  const nameParts =
    splitFullName(data.name);

  const registerData: RegisterData = {
    email: data.email,
    password: data.password,

    first_name:
      data.first_name ||
      data.firstName ||
      nameParts.firstName ||
      "Utilisateur",

    last_name:
      data.last_name ||
      data.lastName ||
      nameParts.lastName ||
      "",

    phone:
      data.phone || undefined,
  };

  return register(registerData);
}

export async function signIn(
  email: string,
  password: string
) {
  return login(email, password);
}

export function signOut() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(
      "accessToken"
    );

    localStorage.removeItem(
      "user"
    );
  }

  return {
    success: true,
  };
}
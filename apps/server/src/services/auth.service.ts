import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { generateToken } from "../utils/jwt.js";

export const loginUser = async (loginData: any) => {
  const { email, password } = loginData;

  const user = await prisma.user.findUnique({
    where: { email },
    include: { perfil: true }, // IMPORTANTE: Incluimos el perfil
  });

  if (!user) throw new Error("Invalid credentials");

  const isPasswordCorrect = await bcrypt.compare(password, user.password);
  if (!isPasswordCorrect) throw new Error("Credenciales inválidas");

  const token = generateToken({ userId: user.id, role: user.role });

  const { password: _, ...userWithoutPassword } = user;
  return { user: userWithoutPassword, token };
};

export const registerUser = async (userData: any) => {
  const { email, password, nombre, role } = userData;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new Error("El correo electrónico ya está registrado");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // Guardamos el usuario con la contraseña encriptada
  const newUser = await prisma.user.create({
    data: {
      email,
      nombre,
      role,
      password: hashedPassword, // <--- DESCOMENTADO
    },
  });

  // Quitamos la contraseña del objeto antes de devolverlo por seguridad
  const { password: _, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
};

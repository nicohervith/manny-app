import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { generateToken } from "../utils/jwt.js";

export const loginUser = async (loginData: any) => {
  const { email, password } = loginData;

  const user = await prisma.user.findUnique({
    where: { email },
    include: { profile: true }, 
  });

  if (!user) throw new Error("Invalid credentials");

  const isPasswordCorrect = await bcrypt.compare(password, user.password);
  if (!isPasswordCorrect) throw new Error("Invalid credentials");

  const token = generateToken({ userId: user.id, role: user.role });

  // Separamos la password y retornamos el resto
  const { password: _, ...userWithoutPassword } = user;
  return { user: userWithoutPassword, token };
};

export const registerUser = async (userData: any) => {
  // Desestructuramos usando 'name' para que coincida con el frontend y el esquema
  const { email, password, name, role } = userData;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new Error("Email already registered");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await prisma.user.create({
    data: {
      email,
      name, // Ahora sí, la variable existe y la propiedad en el schema también
      role,
      password: hashedPassword,
    },
  });

  const { password: _, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
};

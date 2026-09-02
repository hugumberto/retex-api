import { Entity } from "../interfaces/entity.interface"
import { User } from "./user.entity"

export interface UserRole extends Entity {
  user: User
  role: Role
}

export enum Role {
  USER = "USER",
  DRIVER = "DRIVER",
  OPS = "OPS",
  ADMIN = "ADMIN",
  /** Acima do ADMIN. Ver `role-hierarchy.ts` para o que isso implica. */
  MASTER = "MASTER",
}

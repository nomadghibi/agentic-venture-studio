import { z } from "zod";
import { VentureSchema } from "../entities/venture.js";

export const ListVenturesResponseSchema = z.object({
  data: z.array(VentureSchema)
});

export const GetVentureResponseSchema = z.object({
  data: VentureSchema
});
